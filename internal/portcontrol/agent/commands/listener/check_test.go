package listener

import (
	"hy2-panel/internal/records"
	"hy2-panel/internal/websettings"
	"net"
	"os"
	"path/filepath"
	"testing"
)

func TestBusyPanelPortRejectedBeforeRestart(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	port := listener.Addr().(*net.TCPAddr).Port
	root, data := t.TempDir(), t.TempDir()
	if err = os.WriteFile(filepath.Join(root, ".env"), []byte("PANEL_PORT=8080\n"), 0600); err != nil {
		t.Fatal(err)
	}
	if err = records.Write(filepath.Join(data, "web"), "web", websettings.Config{Host: "127.0.0.1", Port: port}); err != nil {
		t.Fatal(err)
	}
	if Check(root, data) == nil {
		t.Fatal("occupied port accepted")
	}
	listener.Close()
	if err = Check(root, data); err != nil {
		t.Fatal(err)
	}
}
