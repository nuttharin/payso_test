package service

import (
	"regexp"
	"strconv"
	"strings"
	"time"

	"paymentapi/internal/model"
)

var digitsOnly = regexp.MustCompile(`\D`)

func onlyDigits(value string) string {
	return digitsOnly.ReplaceAllString(value, "")
}

// luhnCheck validates a 16-digit card number against the Luhn checksum.
// Mirrors src/lib/payment/validators.ts (luhnCheck) on the frontend so
// both layers agree on what counts as a structurally valid card number.
func luhnCheck(cardNumber string) bool {
	digits := onlyDigits(cardNumber)
	if len(digits) != 16 {
		return false
	}

	sum := 0
	for i := 0; i < len(digits); i++ {
		// Walk from the rightmost digit; double every second digit.
		pos := len(digits) - 1 - i
		d, err := strconv.Atoi(string(digits[pos]))
		if err != nil {
			return false
		}
		if i%2 == 1 {
			d *= 2
			if d > 9 {
				d -= 9
			}
		}
		sum += d
	}

	return sum%10 == 0
}

var (
	visaPattern       = regexp.MustCompile(`^4\d{15}$`)
	mastercardPattern = regexp.MustCompile(`^(5[1-5]\d{14}|2(2[2-9][1-9]|2[3-9]\d{2}|[3-6]\d{3}|7[01]\d{2}|720\d)\d{10})$`)
)

// detectCardBrand mirrors src/lib/payment/validators.ts (detectCardBrand).
func detectCardBrand(cardNumber string) model.CardBrand {
	digits := onlyDigits(cardNumber)
	switch {
	case visaPattern.MatchString(digits):
		return model.CardBrandVisa
	case mastercardPattern.MatchString(digits):
		return model.CardBrandMastercard
	default:
		return model.CardBrandUnknown
	}
}

func isSupportedCard(cardNumber string) bool {
	return detectCardBrand(cardNumber) != model.CardBrandUnknown
}

func cardLast4(cardNumber string) string {
	digits := onlyDigits(cardNumber)
	if len(digits) < 4 {
		return digits
	}
	return digits[len(digits)-4:]
}

var expiryPattern = regexp.MustCompile(`^(0[1-9]|1[0-2])\s*/\s*(\d{2})$`)

// isValidExpiry mirrors src/lib/payment/validators.ts (isValidExpiry):
// expects "MM / YY" (or "MM/YY") and rejects dates already in the past.
func isValidExpiry(value string, now time.Time) bool {
	match := expiryPattern.FindStringSubmatch(strings.TrimSpace(value))
	if match == nil {
		return false
	}

	month, err := strconv.Atoi(match[1])
	if err != nil {
		return false
	}
	year := 2000 + mustAtoi(match[2])

	if year > now.Year() {
		return true
	}
	return year == now.Year() && month >= int(now.Month())
}

func mustAtoi(s string) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return n
}

var postalRules = map[string]*regexp.Regexp{
	"TH": regexp.MustCompile(`^\d{5}$`),
	"SG": regexp.MustCompile(`^\d{6}$`),
	"GB": regexp.MustCompile(`(?i)^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$`),
	"US": regexp.MustCompile(`^\d{5}(-\d{4})?$`),
}

// isValidPostalCode mirrors src/lib/payment/validators.ts (isValidPostalCode).
func isValidPostalCode(value string, country string) bool {
	rule, ok := postalRules[country]
	trimmed := strings.TrimSpace(value)
	if !ok {
		return len(trimmed) >= 3
	}
	return rule.MatchString(trimmed)
}
