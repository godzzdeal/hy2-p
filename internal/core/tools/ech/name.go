package ech

import "golang.org/x/crypto/cryptobyte"

const Version = 0xfe0d

// PublicName reads only ECHConfigList metadata defined in RFC 9849, section 4.
func PublicName(payload []byte) string {
	input := cryptobyte.String(payload)
	var list cryptobyte.String
	if !input.ReadUint16LengthPrefixed(&list) || !input.Empty() {
		return ""
	}
	result := ""
	for !list.Empty() {
		var version uint16
		var contents cryptobyte.String
		if !list.ReadUint16(&version) || !list.ReadUint16LengthPrefixed(&contents) {
			return ""
		}
		if version != Version {
			continue
		}
		var key, suites, name, extensions cryptobyte.String
		if !contents.Skip(3) || !contents.ReadUint16LengthPrefixed(&key) || !contents.ReadUint16LengthPrefixed(&suites) || !contents.Skip(1) || !contents.ReadUint8LengthPrefixed(&name) || !contents.ReadUint16LengthPrefixed(&extensions) || !contents.Empty() {
			return ""
		}
		if result != "" && result != string(name) {
			return ""
		}
		result = string(name)
	}
	return result
}
