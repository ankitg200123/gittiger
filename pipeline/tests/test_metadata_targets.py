import unittest

import fetch_metadata


class MetadataTargetSelectionTests(unittest.TestCase):
    def test_refetches_legacy_metadata_without_readme_and_skips_completed_entries(self):
        ranking = [{"repo": repo} for repo in ("o/readme", "o/legacy", "o/stale", "o/checked", "o/missing")]
        metadata = {
            "o/readme": {"readme_summary": "Summary: A source project.", "readme_checked_at": "2026-10-01T00:00:00Z", "readme_summary_version": fetch_metadata.README_SUMMARY_VERSION},
            "o/legacy": {"description": "Has a description but predates README fetching."},
            "o/stale": {"description": "Old metadata", "readme_preview": "Raw quoted README excerpt", "readme_checked_at": "2026-10-01T00:00:00Z", "readme_preview_version": 1},
            "o/checked": {"description": "No README exists.", "readme_checked_at": "2026-10-01T00:00:00Z", "readme_summary_version": fetch_metadata.README_SUMMARY_VERSION},
        }
        selected = fetch_metadata.select_targets(ranking, metadata, limit=2)
        self.assertEqual([row["repo"] for row in selected], ["o/legacy", "o/stale"])

    def test_limit_applies_to_items_that_need_work_not_already_cached_rows(self):
        ranking = [{"repo": "o/cached"}, {"repo": "o/legacy"}, {"repo": "o/missing"}]
        metadata = {
            "o/cached": {"readme_preview": "# Source", "readme_checked_at": "2026-10-01T00:00:00Z", "readme_summary_version": fetch_metadata.README_SUMMARY_VERSION},
            "o/legacy": {"description": "old metadata"},
        }
        selected = fetch_metadata.select_targets(ranking, metadata, limit=1)
        self.assertEqual([row["repo"] for row in selected], ["o/legacy"])


if __name__ == "__main__":
    unittest.main()
