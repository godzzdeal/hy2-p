import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

os.environ.setdefault("HY2_INSTALL_DIR", "/unused-test-installation")
source = Path(__file__).resolve().parents[1] / "firewall" / "handler.py"
spec = importlib.util.spec_from_file_location("firewall_policy", source)
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)

class FirewallPolicyTest(unittest.TestCase):
    def setUp(self):
        self.data = tempfile.TemporaryDirectory()
        self.addCleanup(self.data.cleanup)
        root = Path(self.data.name)
        (root / "firewall").mkdir()
        (root / "firewall" / "protected.json").write_text(json.dumps([22, 2222]))
        (root / ".env").write_text("PANEL_PORT=9443\n")
        self.root = patch.object(policy, "ROOT", root)
        self.root.start()
        self.addCleanup(self.root.stop)

    def test_protected_ports_cannot_be_blocked_or_made_public(self):
        with patch.object(policy, "command") as command:
            for port in (22, 2222, 9443):
                for action in ("allow", "deny"):
                    with self.assertRaises(ValueError):
                        policy.change_rule({"port": port, "protocol": "tcp", "action": action})
            command.assert_not_called()

    def test_docker_published_ports_are_not_reported_as_blocked(self):
        with patch.object(policy.shutil, "which", return_value="/usr/bin/docker"), patch.object(policy, "command", return_value="0.0.0.0:61254->8443/udp") as command:
            with self.assertRaisesRegex(ValueError, "Docker"):
                policy.change_rule({"port": 61254, "protocol": "udp", "action": "deny"})
            self.assertEqual(command.call_count, 1)

    def test_inactive_ufw_never_changes_rules(self):
        with patch.object(policy, "command", return_value="Status: inactive") as command:
            with self.assertRaisesRegex(ValueError, "UFW"):
                policy.change_rule({"port": 8088, "protocol": "tcp", "action": "allow"})
            self.assertEqual(command.call_count, 1)

    def test_exact_rules_replaced_in_descending_order(self):
        rules = "[ 1] 8088/tcp ALLOW IN Anywhere # old\n[ 4] 8088/tcp (v6) DENY IN Anywhere (v6) # HY2-P\n[ 5] 9000/tcp ALLOW IN Anywhere\n"
        def run(*args):
            return rules if "numbered" in args else "Status: active"
        with patch.object(policy, "command", side_effect=run) as command:
            policy.change_rule({"port": 8088, "protocol": "tcp", "action": "allow"})
            deleted = [call.args[-1] for call in command.call_args_list if "delete" in call.args]
            self.assertEqual(deleted, ["4", "1"])
            self.assertIn(unittest.mock.call("/usr/sbin/ufw", "insert", "1", "allow", "8088/tcp", "comment", "HY2-P"), command.call_args_list)

    def test_invalid_input_never_executes_commands(self):
        with patch.object(policy, "command") as command:
            for value in ({"port": True, "protocol": "tcp", "action": "allow"}, {"port": 80, "protocol": "tcp;id", "action": "allow"}, {"port": 80, "protocol": "tcp", "action": "reset"}, []):
                with self.assertRaises(ValueError):
                    policy.change_rule(value)
            command.assert_not_called()

if __name__ == "__main__":
    unittest.main()
