package model

import (
	"net"
	"net/http"
	"regexp"
	"strings"
	"unicode"
)

const MaxDevices = 100
const MaxMetadata = 160

var HWIDPattern = regexp.MustCompile("^[a-zA-Z0-9=_-]{10,64}$")
var IDPattern = regexp.MustCompile("^[a-f0-9]{32}$")

func Text(value string) string {
	value = strings.Map(func(character rune) rune {
		if unicode.IsControl(character) {
			return -1
		}
		return character
	}, value)
	characters := []rune(strings.TrimSpace(value))
	if len(characters) > MaxMetadata {
		characters = characters[:MaxMetadata]
	}
	return string(characters)
}
func IP(address string) string {
	host, _, err := net.SplitHostPort(address)
	if err == nil {
		address = host
	}
	if net.ParseIP(address) == nil {
		return ""
	}
	return address
}
func Information(request *http.Request) Device {
	return Device{Model: Text(request.Header.Get("x-device-model")), OS: Text(request.Header.Get("x-device-os")), OSVersion: Text(request.Header.Get("x-ver-os")), App: Text(request.UserAgent()), SubscriptionIP: IP(request.RemoteAddr)}
}
