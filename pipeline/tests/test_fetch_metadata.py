import io
import unittest
from unittest.mock import patch

import fetch_metadata


class FakeResponse:
    def __init__(self, body, content_type="text/plain"):
        self.body = body
        self.headers = {"Content-Type": content_type}
        self.requested_bytes = None

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, size=-1):
        self.requested_bytes = size
        return self.body if size < 0 else self.body[:size]


class ReadmeFetchTests(unittest.TestCase):
    def test_readme_requests_raw_media_and_bounds_body_read(self):
        response = FakeResponse(b"# Repo\n\nProject documentation")
        deadline = fetch_metadata.Deadline(30)
        with patch.object(fetch_metadata.urllib.request, "urlopen", return_value=response) as urlopen:
            result = fetch_metadata.api_get("/repos/owner/repo/readme", deadline, None)

        self.assertIsInstance(result, bytes)
        self.assertEqual(result, response.body)
        self.assertEqual(response.requested_bytes, fetch_metadata.README_MAX_BYTES + 1)
        request = urlopen.call_args.args[0]
        self.assertIn("application/vnd.github.raw", request.get_header("Accept"))

    def test_readme_preview_normalizes_raw_markdown(self):
        response = FakeResponse(b"# Project\n\nA focused developer tool for reviewing local source files safely.")
        with patch.object(fetch_metadata.urllib.request, "urlopen", return_value=response):
            preview = fetch_metadata.readme_preview("owner/repo", fetch_metadata.Deadline(30), None)
        self.assertTrue(preview.startswith("Summary: A focused developer tool"))
        self.assertIn("Project: Project", preview)

    def test_readme_preview_rejects_truncated_body(self):
        response = FakeResponse(b"x" * (fetch_metadata.README_MAX_BYTES + 1))
        with patch.object(fetch_metadata.urllib.request, "urlopen", return_value=response):
            preview = fetch_metadata.readme_preview("owner/repo", fetch_metadata.Deadline(30), None)
        self.assertIsNone(preview)


if __name__ == "__main__":
    unittest.main()
