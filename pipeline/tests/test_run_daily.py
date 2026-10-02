import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import run_daily


class DailyRunnerEnrichmentTests(unittest.TestCase):
    def test_successful_classification_runs_enrichment_and_leaves_digest_pending(self):
        calls = []
        statuses = []

        def fake_run(script, args, job, argument):
            calls.append((script, args, job, argument))
            return 0

        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(run_daily, "RUNS_FILE", Path(tmp) / "runs.jsonl"), \
                 patch.object(run_daily, "run", side_effect=fake_run), \
                 patch.object(run_daily, "record", side_effect=lambda *args: statuses.append(args[:4])):
                result = run_daily.main(["run_daily.py", "--date", "2026-10-01"])

        self.assertEqual(result, 0)
        jobs = [call[2] for call in calls]
        self.assertEqual(jobs[-3:], ["classify", "enrich", "sync_content"])
        self.assertIn(("enrich.py", ["2026-10-01", "--limit", "20"], "enrich", "2026-10-01"), calls)
        self.assertTrue(any(item[:3] == ("digests", "2026-10-01", "skipped") for item in statuses))

    def test_failed_classification_skips_enrichment(self):
        calls = []

        def fake_run(script, args, job, argument):
            calls.append(job)
            return 1 if job == "classify" else 0

        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(run_daily, "RUNS_FILE", Path(tmp) / "runs.jsonl"), \
                 patch.object(run_daily, "run", side_effect=fake_run), \
                 patch.object(run_daily, "record"):
                result = run_daily.main(["run_daily.py", "--date", "2026-10-01"])

        self.assertEqual(result, 1)
        self.assertNotIn("enrich", calls)

    def test_real_runner_subprocess_invokes_enrich_and_records_actual_result(self):
        events = []

        def fake_run_process(cmd, **kwargs):
            script = Path(cmd[1]).name
            job = script.removesuffix(".py")
            events.append(job)
            stdout = (
                "[OK] 2026-10-01: generated 12, needs human review 2, skipped 0, cached total 20\n"
                if job == "enrich"
                else "[OK] smoke test\n"
            )
            return type("Completed", (), {"returncode": 0, "stdout": stdout, "stderr": ""})()

        with tempfile.TemporaryDirectory() as tmp:
            ledger = Path(tmp) / "pipeline_runs.jsonl"
            with patch.object(run_daily, "RUNS_FILE", ledger), \
                 patch.object(run_daily.subprocess, "run", side_effect=fake_run_process):
                result = run_daily.main(["run_daily.py", "--date", "2026-10-01"])

            records = [json.loads(line) for line in ledger.read_text().splitlines()]

        self.assertEqual(result, 0)
        self.assertEqual(events[-3:], ["classify", "enrich", "sync_content"])
        enrich_record = next(row for row in records if row["job"] == "enrich")
        self.assertEqual(enrich_record["status"], "ok")
        self.assertEqual(enrich_record["rows_affected"], 12)
        self.assertEqual(enrich_record["argument"], "2026-10-01")


if __name__ == "__main__":
    unittest.main()
