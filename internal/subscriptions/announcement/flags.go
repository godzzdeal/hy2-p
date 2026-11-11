package announcement

import "strings"

func validFlag(value string) bool {
	if value == "" {
		return true
	}
	letters := []rune(value)
	return len(letters) == 2 && regional(letters[0]) && regional(letters[1])
}

func applyFlag(name, fallback string) string {
	letters := []rune(name)
	if fallback == "" || (len(letters) >= 2 && regional(letters[0]) && regional(letters[1])) {
		return name
	}
	return fallback + " " + strings.TrimSpace(name)
}

func regional(letter rune) bool { return letter >= '\U0001F1E6' && letter <= '\U0001F1FF' }
