import json
import os
import re
import shutil
import subprocess
from http.server import BaseHTTPRequestHandler
from pathlib import Path

ROOT = Path(os.environ["HY2_INSTALL_DIR"])
COMMAND_TIMEOUT = 5
MAX_OUTPUT = 262144

def command(*args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=COMMAND_TIMEOUT, env={**os.environ, "LC_ALL": "C"})
    if result.returncode:
        raise ValueError("Команда firewall не выполнена. Проверьте журнал службы.")
    return result.stdout[:MAX_OUTPUT]

def status():
    output = command("/usr/sbin/ufw", "status", "verbose")
    return {"active": output.startswith("Status: active"), "output": output}

def protected(port):
    guards = json.loads((ROOT / "firewall" / "protected.json").read_text())
    for line in (ROOT / ".env").read_text().splitlines():
        if line.startswith("PANEL_PORT=") and line[11:].isdigit():
            guards.append(int(line[11:]))
    return port in guards or port == 22

def change_rule(data):
    if not isinstance(data, dict) or set(data) != {"port", "protocol", "action"}:
        raise ValueError("Некорректные поля запроса")
    port, protocol, action = data["port"], data["protocol"], data["action"]
    if type(port) is not int or not 1 <= port <= 65535 or protocol not in ("tcp", "udp") or action not in ("allow", "deny"):
        raise ValueError("Некорректный порт, протокол или действие")
    if protocol == "tcp" and protected(port):
        raise ValueError("Изменение защищённого порта SSH или панели запрещено")
    if action == "deny":
        if shutil.which("docker"):
            published = command("docker", "ps", "--format", "{{.Ports}}")
            if re.search(r":" + str(port) + r"->[^\s,]+/" + protocol, published):
                raise ValueError("Порт опубликован Docker. UFW его не блокирует; измените публикацию контейнера.")
    if not status()["active"]:
        raise ValueError("UFW выключен. Сначала настройте и включите firewall на сервере.")
    # Replace exact global rules for this port, otherwise UFW may skip a
    # duplicate allow below an earlier deny and report a misleading success.
    numbered = command("/usr/sbin/ufw", "status", "numbered")
    pattern = r"^\[\s*(\d+)\]\s+" + str(port) + "/" + protocol + r"(?:\s+\(v6\))?\s+(?:ALLOW|DENY)(?:\s+IN)?\s+Anywhere(?:\s+\(v6\))?(?:\s+#.*)?$"
    indices = [int(match.group(1)) for line in numbered.splitlines() if (match := re.match(pattern, line.strip()))]
    if len(indices) > 16:
        raise ValueError("Слишком много правил для одного порта. Проверьте их на сервере.")
    for index in sorted(indices, reverse=True):
        command("/usr/sbin/ufw", "--force", "delete", str(index))
    command("/usr/sbin/ufw", "insert", "1", action, str(port) + "/" + protocol, "comment", "HY2-P")
    return status()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def respond(self, value, code=200):
        payload = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        self.handle_request(False)

    def do_POST(self):
        self.handle_request(True)

    def handle_request(self, mutate):
        if self.path != "/firewall":
            self.respond({"error": "Not found"}, 404)
            return
        try:
            if mutate:
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= 1024:
                    raise ValueError("Некорректный размер запроса")
                result = change_rule(json.loads(self.rfile.read(size)))
            else:
                result = status()
            self.respond(result)
        except (ValueError, OSError, subprocess.TimeoutExpired) as error:
            message = str(error) if isinstance(error, ValueError) else "Помощник firewall не смог выполнить операцию"
            self.respond({"error": message}, 409)
