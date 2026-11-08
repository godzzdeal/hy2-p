import os
import socket
import socketserver
from http.server import HTTPServer
from pathlib import Path
from handler import Handler

class UnixServer(HTTPServer):
    address_family = socket.AF_UNIX

    def server_bind(self):
        socketserver.TCPServer.server_bind(self)
        self.server_name, self.server_port = "localhost", 0

if __name__ == "__main__":
    os.umask(0o077)
    path = Path(os.environ["HY2_INSTALL_DIR"]) / "firewall" / "control.sock"
    path.unlink(missing_ok=True)
    with UnixServer(str(path), Handler) as server:
        os.chmod(path, 0o600)
        server.serve_forever()
