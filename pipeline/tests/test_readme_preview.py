import html
import unittest

import fetch_metadata


class ReadmePreviewTests(unittest.TestCase):
    def test_extracts_section_headings_and_summary_without_quoting_full_body(self):
        raw = (
            "# VoiceStudio\n\n"
            "An open-source, fully-local speech toolkit for dubbing and transcription.\n\n"
            "## Features\n"
            "- Voice cloning\n"
            "- Video dubbing\n"
            "- Dictation and transcription\n\n"
            "## Installation\n"
            "npm install\n"
        ).encode("utf-8")
        text = fetch_metadata.readme_preview_text(raw)
        self.assertIn("Summary:", text)
        self.assertIn("VoiceStudio", text)
        self.assertIn("Features:", text)
        self.assertIn("voice cloning", text.lower())
        self.assertNotIn("npm install", text.lower())
        self.assertNotEqual(text, " ".join(raw.decode("utf-8").split())[:600])

    def test_removes_badges_links_html_and_normalizes_unicode(self):
        raw = (
            "<p align=\"center\"><img src=\"badge.svg\"></p>\n"
            "# Project &amp; Tool\n"
            "[![Build](https://example.test/badge.svg)](https://example.test)\n"
            "## Features\n"
            "- Local-first \u2014 private and fast.\n"
        ).encode("utf-8")
        text = fetch_metadata.readme_preview_text(raw)
        self.assertIn("Project & Tool", text)
        self.assertIn("Local-first - private and fast.", text)
        self.assertNotIn("badge.svg", text)
        self.assertNotIn("https://", text)

    def test_ignores_badges_and_volatile_star_counts_and_does_not_promote_installation_to_features(self):
        raw = (
            "[![Build](https://example.test/badge.svg)](https://example.test)\n"
            "⭐ 5.2k stars\n"
            "# Project\n"
            "A local tool that helps developers inspect source code.\n"
            "## Installation\n"
            "Install via `npm install project-cli` and run `project`.\n"
            "## Features\n"
            "- The CLI searches local source files.\n"
            "- It returns matching code with context.\n"
        ).encode("utf-8")
        text = fetch_metadata.readme_preview_text(raw)
        self.assertIn("Summary: A local tool", text)
        self.assertNotIn("5.2k stars", text)
        self.assertNotIn("npm install", text)
        self.assertIn("searches local source files", text)

    def test_empty_or_oversized_readme_produces_no_preview(self):
        self.assertIsNone(fetch_metadata.readme_preview_text(b"  "))
        self.assertIsNone(fetch_metadata.readme_preview_text(b"x" * (fetch_metadata.README_MAX_BYTES + 1)))


if __name__ == "__main__":
    unittest.main()
