import unittest
from unittest.mock import patch

import fetch_metadata


class RateLimitBudgetTests(unittest.TestCase):
    def test_caps_candidates_to_metadata_and_readme_requests_with_safety_reserve(self):
        self.assertEqual(fetch_metadata.candidate_budget(60), 24)
        self.assertEqual(fetch_metadata.candidate_budget(11), 0)
        self.assertEqual(fetch_metadata.candidate_budget(13), 1)

    def test_rate_limit_uses_retry_after_header(self):
        error = type("Error", (), {"headers": {"Retry-After": "17"}})()
        self.assertEqual(fetch_metadata.resp_reset(error), 17)

    def test_rate_limit_falls_back_to_absolute_reset_timestamp(self):
        error = type("Error", (), {"headers": {"X-RateLimit-Reset": "1200"}})()
        with patch.object(fetch_metadata.time, "time", return_value=1000):
            self.assertEqual(fetch_metadata.resp_reset(error), 200)

    def test_rate_limit_returns_none_when_no_retry_hint_is_available(self):
        error = type("Error", (), {"headers": {}})()
        self.assertIsNone(fetch_metadata.resp_reset(error))


if __name__ == "__main__":
    unittest.main()
