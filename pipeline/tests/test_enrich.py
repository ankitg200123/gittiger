import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import enrich
import store


BODY = "# Overview\n\n" + ("This project provides a focused tool for developers. " * 4)
FAQ = [
    {"q": "What does it do?", "a": "It provides a focused tool for developers."},
    {"q": "How do I get started?", "a": "See the repository README for documented setup steps."},
    {"q": "What license does it use?", "a": "The supplied metadata does not specify a license."},
]


def valid_payload():
    return {"body_markdown": BODY.strip(), "faq_json": FAQ}


def candidate(repo):
    return {
        "repo": repo,
        "ranking": {"repo": repo, "rank": 1},
        "classification": {"topic": "devtools", "tags": ["cli"], "confidence": 0.8, "flags": [], "needs_review": False},
        "metadata": {"description": "A focused developer tool.", "readme_summary": "Summary: A focused developer tool; Features: command-line interface", "readme_summary_version": 2, "language": "Python", "topics": [], "license": None},
    }


class CandidateSelectionTests(unittest.TestCase):
    def test_select_candidates_applies_publish_gates_and_limit_after_filtering(self):
        repos = ["o/good", "o/review", "o/off-niche", "o/no-evidence", "o/done", "o/second"]
        ranking = [{"repo": repo, "rank": i + 1} for i, repo in enumerate(repos)]
        classifications = {
            repo: {"topic": "devtools", "confidence": 0.8, "flags": [], "needs_review": False}
            for repo in repos
        }
        classifications["o/review"]["needs_review"] = True
        classifications["o/off-niche"]["flags"] = ["off_niche"]
        metadata = {
            repo: {"description": "A developer tool description.", "readme_summary": "Summary: A developer tool; Features: Command line functionality.", "readme_summary_version": 2}
            for repo in repos
        }
        metadata["o/no-evidence"] = {"description": "", "readme_summary": None, "readme_summary_version": 2}
        selected = enrich.select_candidates(
            ranking,
            classifications,
            metadata,
            existing={"o/done"},
            reviewed=set(),
            limit=2,
        )
        self.assertEqual([item["repo"] for item in selected], ["o/good", "o/second"])

    def test_select_candidates_does_not_generate_for_missing_or_uncertain_classifications(self):
        repo = "o/review"
        selected = enrich.select_candidates(
            [{"repo": repo}],
            {repo: {"topic": None, "needs_review": True, "flags": []}},
            {repo: {"description": "A description."}},
            existing=set(),
            reviewed=set(),
            limit=10,
        )
        self.assertEqual(selected, [])


class WriteupValidationTests(unittest.TestCase):
    def test_validate_writeup_keeps_only_schema_fields(self):
        payload = valid_payload() | {"unsupported": "discard me"}
        self.assertEqual(
            enrich.validate_writeup(payload),
            {"body_markdown": BODY.strip(), "faq_json": FAQ},
        )

    def test_validate_writeup_rejects_empty_body_and_malformed_faq(self):
        for payload in (
            {"body_markdown": " ", "faq_json": FAQ},
            {"body_markdown": BODY, "faq_json": [{"q": "", "a": "Answer"}]},
            {"body_markdown": BODY, "faq_json": "not a list"},
        ):
            with self.subTest(payload=payload):
                with self.assertRaises(enrich.LLMInvalidResponse):
                    enrich.validate_writeup(payload)

    def test_parse_cli_output_unwraps_claude_json_envelope(self):
        raw = json.dumps({
            "type": "result",
            "subtype": "success",
            "model": "claude-sonnet-test",
            "result": json.dumps(valid_payload()),
        })
        payload, model = enrich.parse_cli_output(raw)
        self.assertEqual(enrich.validate_writeup(payload), valid_payload())
        self.assertEqual(model, "claude-sonnet-test")

    def test_parse_cli_output_rejects_cli_error_envelope(self):
        with self.assertRaises(enrich.LLMInvalidResponse):
            enrich.parse_cli_output(json.dumps({"type": "result", "is_error": True, "result": "failed"}))


class EnrichmentBatchTests(unittest.TestCase):
    def test_invalid_output_retries_once_marks_review_and_continues(self):
        class Client:
            model = "sonnet"

            def __init__(self):
                self.calls = 0

            def generate(self, prompt, timeout):
                self.calls += 1
                if self.calls <= 2:
                    raise enrich.LLMInvalidResponse("bad schema")
                return valid_payload(), "claude-sonnet-test"

        client = Client()
        saved = []
        reviewed = []
        summary = enrich.enrich_batch(
            [candidate("o/bad"), candidate("o/good")],
            client=client,
            default_model="sonnet",
            save=lambda repo, data: saved.append((repo, data)),
            mark_review=lambda repo, reason: reviewed.append((repo, reason)),
            deadline=enrich.Deadline(20),
        )
        self.assertEqual(client.calls, 3)
        self.assertEqual([repo for repo, _ in saved], ["o/good"])
        self.assertEqual(reviewed, [("o/bad", "invalid_response_after_retry")])
        self.assertEqual(summary.generated, 1)
        self.assertEqual(summary.needs_review, 1)
        self.assertFalse(summary.stopped)
        self.assertEqual(saved[0][1]["model"], "claude-sonnet-test")
        self.assertIn("generated_at", saved[0][1])

    def test_unreachable_llm_stops_remaining_candidates(self):
        class Client:
            model = "sonnet"

            def generate(self, prompt, timeout):
                raise enrich.LLMUnavailable("CLI unavailable")

        saved = []
        summary = enrich.enrich_batch(
            [candidate("o/first"), candidate("o/second")],
            client=Client(),
            default_model="sonnet",
            save=lambda repo, data: saved.append(repo),
            mark_review=lambda repo, reason: None,
            deadline=enrich.Deadline(20),
        )
        self.assertEqual(saved, [])
        self.assertTrue(summary.stopped)
        self.assertIn("CLI unavailable", summary.stop_reason)

    def test_store_round_trips_writeups_in_json_fallback(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(store, "DATA", Path(tmp)), patch.object(store, "postgres_available", return_value=False):
                store.save_writeup("o/repo", {"body_markdown": BODY, "faq_json": FAQ, "model": "sonnet", "generated_at": "2026-10-02T00:00:00+00:00"})
                self.assertEqual(store.load_writeups()["o/repo"]["faq_json"], FAQ)
                self.assertTrue((Path(tmp) / "writeups.json").exists())

    def test_postgres_missing_repo_falls_back_to_file_without_losing_generated_writeup(self):
        class CursorContext:
            def __enter__(self):
                self.cur = type("Cursor", (), {"rowcount": 0, "execute": lambda *args, **kwargs: None})()
                return self.cur

            def __exit__(self, exc_type, exc, tb):
                return False

        writeup = {
            "body_markdown": BODY,
            "faq_json": FAQ,
            "model": "sonnet",
            "generated_at": "2026-10-02T00:00:00+00:00",
        }
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(store, "DATA", Path(tmp)):
                with patch.object(store, "postgres_available", return_value=True):
                    with patch.object(store, "cursor", return_value=CursorContext()):
                        store.save_writeup("o/not-seeded", writeup)
                        self.assertEqual(store.load_writeups()["o/not-seeded"], writeup)

    def test_unreadable_review_ledger_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "reviews.json"
            path.write_text("not json")
            with self.assertRaises(enrich.ReviewLedgerError):
                enrich.load_review_ledger(path)


if __name__ == "__main__":
    unittest.main()
