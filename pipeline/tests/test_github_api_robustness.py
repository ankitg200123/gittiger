import io
import json
import unittest
from email.message import Message
from unittest.mock import patch

import fetch_metadata


class FakeResponse:
    def __init__(self, body, content_type="application/vnd.github+json; charset=utf-8"):
        self.body = body
        self.headers = Message()
        self.headers["Content-Type"] = content_type
        self.requested_bytes = None

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, size=-1):
        self.requested_bytes = size
        return self.body if size < 0 else self.body[:size]


class GithubApiRobustnessTests(unittest.TestCase):
    def test_vendor_json_content_type_is_accepted(self):
        response = FakeResponse(b'{"ok": true}')
        with patch.object(fetch_metadata.urllib.request, "urlopen", return_value=response):
            value = fetch_metadata.api_get("/repos/o/r", fetch_metadata.Deadline(30), None)
        self.assertEqual(value, {"ok": True})

    def test_generic_forbidden_response_is_not_retried_as_rate_limit(self):
        error = fetch_metadata.urllib.error.HTTPError(
            "https://api.github.com/repos/o/r", 403, "forbidden", Message(), None
        )
        with patch.object(fetch_metadata.urllib.request, "urlopen", side_effect=error):
            with self.assertRaises(fetch_metadata.urllib.error.HTTPError):
                fetch_metadata.api_get("/repos/o/r", fetch_metadata.Deadline(30), None)

    def test_primary_limit_403_with_zero_remaining_is_retryable(self):
        headers = Message()
        headers["X-RateLimit-Remaining"] = "0"
        headers["X-RateLimit-Reset"] = "1200"
        error = fetch_metadata.urllib.error.HTTPError(
            "https://api.github.com/repos/o/r", 403, "limited", headers, None
        )
        with patch.object(fetch_metadata.urllib.request, "urlopen", side_effect=error):
            with self.assertRaises(fetch_metadata.RateLimited):
                fetch_metadata.api_get("/repos/o/r", fetch_metadata.Deadline(30), None)


if __name__ == "__main__":
    unittest.main()
