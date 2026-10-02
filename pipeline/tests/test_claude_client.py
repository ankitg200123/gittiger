import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import enrich


class ClaudeCliClientTests(unittest.TestCase):
    def test_validates_tool_free_safe_mode_cli_flags_and_model_identity(self):
        payload = {
            "body_markdown": "# Repo\n\n" + ("Grounded description. " * 9),
            "faq_json": [
                {"q": "What does the description state?", "a": "It describes a grounded developer tool."},
                {"q": "How is it installed?", "a": "No installation steps were supplied in the evidence."},
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            executable = Path(tmp) / "claude"
            executable.write_text("#!/bin/sh\nexit 0\n")
            executable.chmod(0o755)
            client = enrich.ClaudeCliClient("sonnet", executable=str(executable))
            import json

            def fake_run(args, **kwargs):
                if "--json-schema" in args:
                    stdout = json.dumps({
                        "type": "result",
                        "subtype": "success",
                        "result": json.dumps(payload),
                        "modelUsage": {"sonnet": {"canonicalModel": "claude-sonnet-5"}},
                    })
                else:
                    stdout = json.dumps({"type": "result", "subtype": "success", "result": "OK"})
                return type("Completed", (), {"returncode": 0, "stdout": stdout, "stderr": ""})()

            with patch.object(enrich.subprocess, "run", side_effect=fake_run) as run:
                client.health_check()
                result, model = client.generate("prompt", 10)

            self.assertEqual(result, enrich.validate_writeup(payload))
            self.assertEqual(model, "claude-sonnet-5")
            self.assertEqual(run.call_count, 2)
            for call in run.call_args_list:
                command = call.args[0]
                for flag in ("--tools", "", "--permission-mode", "dontAsk", "--safe-mode", "--no-session-persistence"):
                    self.assertIn(flag, command)

    def test_health_probe_rejects_json_envelopes_with_error_payload(self):
        with tempfile.TemporaryDirectory() as tmp:
            executable = Path(tmp) / "claude"
            executable.write_text("#!/bin/sh\nexit 0\n")
            executable.chmod(0o755)
            client = enrich.ClaudeCliClient("sonnet", executable=str(executable))
            failed = type("Completed", (), {"returncode": 0, "stdout": '{"type":"result","is_error":true,"result":"OK"}', "stderr": ""})()
            with patch.object(enrich.subprocess, "run", return_value=failed):
                with self.assertRaises(enrich.LLMUnavailable):
                    client.health_check()


if __name__ == "__main__":
    unittest.main()
