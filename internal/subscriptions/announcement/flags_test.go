package announcement

import "testing"

func TestDefaultFlagDoesNotReplaceIndividualFlagsOrEmoji(t *testing.T) {
	for _, entry := range []struct{ name, expected string }{
		{"Phone", "🇳🇱 Phone"}, {"🚀 Phone", "🇳🇱 🚀 Phone"}, {"🇩🇪 Phone", "🇩🇪 Phone"},
	} {
		if actual := applyFlag(entry.name, "🇳🇱"); actual != entry.expected {
			t.Fatalf("%q != %q", actual, entry.expected)
		}
		if applyFlag(entry.name, "") != entry.name {
			t.Fatal("empty default modified the name")
		}
	}
	for _, value := range []string{"🇳🇱", "🇩🇪", ""} {
		if !validFlag(value) {
			t.Fatal("valid flag rejected")
		}
	}
	for _, value := range []string{"NL", "🚀", "🇳", "🇳🇱 extra", "\n"} {
		if validFlag(value) {
			t.Fatal("invalid flag accepted")
		}
	}
}
