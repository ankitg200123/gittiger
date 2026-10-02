import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import fetch_metadata


def fake_repo(full_name):
    owner, name = full_name.split("/", 1)
    return {
        "owner": {"login": owner},
        "name": name,
        "description": "A source-backed developer tool.",
        "language": "Python",
        "stargazers_count": 20,
        "forks_count": 2,
        "created_at": "2026-01-01T00:00:00Z",
        "topics": ["developer-tools"],
        "license": {"spdx_id": "MIT"},
        "html_url": f"https://github.com/{full_name}",
    }


class MetadataEnrichmentIntegrationTests(unittest.TestCase):
    def test_main_persists_verified_metadata_and_retries_legacy_missing_readme(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            ranking = [{"repo": "o/new"}, {"repo": "o/old"}, {"repo": "o/checked"}]
            (data / "ranking-2026-10-01.json").write_text(json.dumps(ranking))
            legacy = {
                "o/old": {"full_name": "o/old", "description": "cached description"},
                "o/checked": {"full_name": "o/checked", "readme_checked_at": "2026-10-01T00:00:00Z"},
            }
            (data / "metadata.json").write_text(json.dumps(legacy))
            calls = []

            def api_get(path, deadline, token):
                calls.append(path)
                if path == "/rate_limit":
                    return {"resources": {"core": {"remaining": 100, "limit": 60}}}
                if path == "/repos/o/new":
                    return fake_repo("o/new")
                if path == "/repos/o/new/readme":
                    return b"# New\n\nA project README with practical information."
                if path == "/repos/o/old":
                    return fake_repo("o/old")
                if path == "/repos/o/old/readme":
                    return None
                self.fail(f"unexpected GitHub request: {path}")

            with patch.object(fetch_metadata, "DATA", data), \
                 patch.object(fetch_metadata, "META_PATH", data / "metadata.json"), \
                 patch.object(fetch_metadata, "RANKING_PATH", data / "ranking-2026-10-01.json"), \
                 patch.object(fetch_metadata, "api_get", side_effect=api_get):
                result = fetch_metadata.main(["fetch_metadata.py", "2026-10-01", "--limit", "2"])

            actual = json.loads((data / "metadata.json").read_text())
            self.assertEqual(result, 0)
            self.assertIn("/repos/o/new/readme", calls)
            self.assertIn("/repos/o/old/readme", calls)
            self.assertNotIn("/repos/o/checked", calls)
            # o/new fetched a README successfully, so it gets a v2 summary and
            # never exposes the unversioned raw preview as the summary.
            self.assertIn("Summary: A project README", actual["o/new"]["readme_summary"])
            self.assertEqual(actual["o/new"]["readme_summary_version"], fetch_metadata.README_SUMMARY_VERSION)
            self.assertEqual(actual["o/old"]["description"], "A source-backed developer tool.")
            self.assertIsNone(actual["o/old"]["readme_summary"])
            self.assertEqual(actual["o/old"]["readme_summary_version"], fetch_metadata.README_SUMMARY_VERSION)
            self.assertTrue((data / "metadata.json").read_text().endswith("\n"))

    def test_main_stops_without_overwriting_metadata_when_source_data_is_corrupt(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            ranking = data / "ranking-2026-10-01.json"
            ranking.write_text(json.dumps([{"repo": "o/r"}]))
            meta_path = data / "metadata.json"
            meta_path.write_text("not json")
            with patch.object(fetch_metadata, "DATA", data), \
                 patch.object(fetch_metadata, "META_PATH", data / "metadata.json"), \
                 patch.object(fetch_metadata, "RANKING_PATH", data / "ranking-2026-10-01.json"), \
                 patch.object(fetch_metadata, "check_rate_limit", return_value=20):
                result = fetch_metadata.main(["fetch_metadata.py", "2026-10-01"])
            self.assertEqual(result, 1)
            self.assertEqual(meta_path.read_text(), "not json")


if __name__ == "__main__":
    unittest.main()
