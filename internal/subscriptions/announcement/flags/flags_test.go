package flags

import "testing"

func TestDefaultFlagDoesNotReplaceIndividualFlagsOrEmoji(t *testing.T) {
	for _, entry := range []struct{ name, expected string }{
		{"Phone", "🇳🇱 Phone"}, {"🚀 Phone", "🇳🇱 🚀 Phone"}, {"🇩🇪 Phone", "🇩🇪 Phone"},
	} {
		if actual := Apply(entry.name, "🇳🇱"); actual != entry.expected {
			t.Fatalf("%q != %q", actual, entry.expected)
		}
		if Apply(entry.name, "") != entry.name {
			t.Fatal("empty default modified the name")
		}
	}
	for _, value := range []string{"🇳🇱", "🇩🇪", ""} {
		if !Valid(value) {
			t.Fatal("valid flag rejected")
		}
	}
	for _, value := range []string{"NL", "🚀", "🇳", "🇳🇱 extra", "\n"} {
		if Valid(value) {
			t.Fatal("invalid flag accepted")
		}
	}
}
