// Package model holds domain entities. These never leave the
// repository/service layers directly — handlers always return dto types.
package model

import "time"

// PaymentStatus enumerates the outcome of a processed payment.
type PaymentStatus string

const (
	PaymentStatusApproved PaymentStatus = "approved"
	PaymentStatusDeclined PaymentStatus = "declined"
)

// CardBrand enumerates supported card networks for this release.
type CardBrand string

const (
	CardBrandVisa       CardBrand = "visa"
	CardBrandMastercard CardBrand = "mastercard"
	CardBrandUnknown    CardBrand = "unknown"
)

// Payment is the domain record of a processed payment attempt.
type Payment struct {
	ID        string
	OrderID   string
	Amount    float64
	Email     string
	CardBrand CardBrand
	CardLast4 string
	Status    PaymentStatus
	CreatedAt time.Time
}
