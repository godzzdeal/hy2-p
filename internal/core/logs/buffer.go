package logs

import (
	"regexp"
	"strings"
	"sync"
	"unicode/utf8"
)

const Capacity = 64000

var ansi = regexp.MustCompile("\\x1b(?:\\[[0-?]*[ -/]*[@-~]|\\][^\\x07\\x1b]*(?:\\x07|\\x1b\\\\))")
var incomplete = regexp.MustCompile("\\x1b(?:\\[[0-?]*[ -/]*|\\][^\\x07\\x1b]*)?$")

// Buffer accepts split UTF-8 writes and exposes plain text, never terminal commands.
type Buffer struct {
	mu      sync.Mutex
	data    string
	pending []byte
}

func (buffer *Buffer) Write(payload []byte) (int, error) {
	buffer.mu.Lock()
	defer buffer.mu.Unlock()
	buffer.pending = append(buffer.pending, payload...)
	var text strings.Builder
	for utf8.FullRune(buffer.pending) {
		character, size := utf8.DecodeRune(buffer.pending)
		text.WriteRune(character)
		buffer.pending = buffer.pending[size:]
	}
	buffer.data += text.String()
	if len(buffer.data) > Capacity {
		start := len(buffer.data) - Capacity
		for start < len(buffer.data) && !utf8.RuneStart(buffer.data[start]) {
			start++
		}
		buffer.data = buffer.data[start:]
	}
	return len(payload), nil
}
func (buffer *Buffer) Read() string {
	buffer.mu.Lock()
	defer buffer.mu.Unlock()
	text := ansi.ReplaceAllString(buffer.data, "")
	text = incomplete.ReplaceAllString(text, "")
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = strings.ReplaceAll(text, "\r", "\n")
	return strings.Map(func(character rune) rune {
		if character < 32 && character != '\n' && character != '\t' {
			return -1
		}
		return character
	}, text)
}
func (buffer *Buffer) Clear() {
	buffer.mu.Lock()
	defer buffer.mu.Unlock()
	buffer.data = ""
	buffer.pending = nil
}
