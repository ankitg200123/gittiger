import json
import unittest

import enrich


class ClaudeOutputParsingTests(unittest.TestCase):
    def test_reads_canonical_model_from_claude_usage_envelope(self):
        stdout = json.dumps({
            "type": "result",
            "subtype": "success",
            "result": json.dumps({"body_markdown": "body", "faq_json": []}),
            "modelUsage": {
                "sonnet": {
                    "canonicalModel": "claude-sonnet-5",
                    "provider": "firstParty",
                }
            },
        })
        _, model = enrich.parse_cli_output(stdout)
        self.assertEqual(model, "claude-sonnet-5")


if __name__ == "__main__":
    unittest.main()
