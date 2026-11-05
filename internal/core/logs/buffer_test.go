package logs

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestSplitUnicodeAndTerminalCodes(t *testing.T) {
	var buffer Buffer
	text := "\x1b[34mINFO\x1b[0m\tСертификат обновлён ✓\r\n\x1b]0;title\x07"
	for _, value := range []byte(text) {
		buffer.Write([]byte{value})
	}
	if got := buffer.Read(); got != "INFO\tСертификат обновлён ✓\n" {
		t.Fatalf("%q", got)
	}
	buffer.Write([]byte("\x1b[3"))
	if strings.Contains(buffer.Read(), "[3") {
		t.Fatal("partial terminal command leaked")
	}
}
func TestBoundedUnicodeClearAndNewWrites(t *testing.T) {
	var buffer Buffer
	buffer.Write([]byte(strings.Repeat("Привет ✓\n", Capacity)))
	result := buffer.Read()
	if !utf8.ValidString(result) || len(result) > Capacity {
		t.Fatal("invalid bounded text")
	}
	buffer.Clear()
	if buffer.Read() != "" {
		t.Fatal("clear failed")
	}
	buffer.Write([]byte("новая запись"))
	if buffer.Read() != "новая запись" {
		t.Fatal("writes after clear failed")
	}
}
