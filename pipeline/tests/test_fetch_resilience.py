import json
import unittest
from email.message import Message
from unittest.mock import patch

import fetch_metadata


class FakeResponse:
    def __init__(self, body, content_type="application/json"):
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


class DeadlineAndBodyTests(unittest.TestCase):
    def test_expired_deadline_refuses_to_start_http_request(self):
        with patch.object(fetch_metadata.urllib.request, "urlopen") as urlopen:
            with self.assertRaises(fetch_metadata.DeadlineExpired):
                fetch_metadata.api_get("/repos/o/r", fetch_metadata.Deadline(0), None)
        urlopen.assert_not_called()

    def test_json_response_reads_only_up_to_hard_body_cap(self):
        body = json.dumps({"hello": "world"}).encode()
        response = FakeResponse(body)
        with patch.object(fetch_metadata.urllib.request, "urlopen", return_value=response):
            result = fetch_metadata.api_get("/repos/o/r", fetch_metadata.Deadline(30), None)
        self.assertEqual(result, {"hello": "world"})
        self.assertEqual(response.requested_bytes, fetch_metadata.MAX_API_BYTES + 1)

    def test_oversized_json_response_fails_instead_of_parsing_truncated_data(self):
        body = b"{" + (b" " * fetch_metadata.MAX_API_BYTES)
        response = FakeResponse(body)
        with patch.object(fetch_metadata.urllib.request, "urlopen", return_value=response):
            with self.assertRaisesRegex(ValueError, "exceeds"):
                fetch_metadata.api_get("/repos/o/r", fetch_metadata.Deadline(30), None)
        self.assertEqual(response.requested_bytes, fetch_metadata.MAX_API_BYTES + 1)


class RateLimitRetryTests(unittest.TestCase):
    def test_429_carries_retry_after_instead_of_being_treated_as_a_generic_error(self):
        headers = Message()
        headers["Retry-After"] = "27"
        error = fetch_metadata.urllib.error.HTTPError("https://api.github.com", 429, "limited", headers, None)
        with patch.object(fetch_metadata.urllib.request, "urlopen", side_effect=error):
            with self.assertRaises(fetch_metadata.RateLimited) as caught:
                fetch_metadata.api_get("/repos/o/r", fetch_metadata.Deadline(30), None)
        self.assertEqual(caught.exception.retry_after, 27)

    def test_retry_delay_larger_than_remaining_deadline_is_not_ignored(self):
        exc = fetch_metadata.RateLimited("rate limit", retry_after=90)
        with patch.object(fetch_metadata.time, "sleep") as sleep:
            with self.assertRaisesRegex(RuntimeError, "exceeds remaining deadline"):
                fetch_metadata.wait_before_rate_limit_retry(exc, fetch_metadata.Deadline(2))
        sleep.assert_not_called()

    def test_short_rate_limit_retry_waits_once_then_returns_to_caller(self):
        exc = fetch_metadata.RateLimited("rate limit", retry_after=1)
        deadline = fetch_metadata.Deadline(30)
        with patch.object(fetch_metadata.time, "sleep") as sleep:
            fetch_metadata.wait_before_rate_limit_retry(exc, deadline)
        sleep.assert_called_once_with(1)


if __name__ == "__main__":
    unittest.main()
