// Package dto holds request/response structs for the payment API.
// These are the only shapes exposed over HTTP — internal/model structs
// never leak directly to clients.
package dto

// CardPaymentRequest mirrors the card payment form on the frontend
// (src/lib/payment/schema.ts). All fields are required per the form's
// validation rules; server-side validation re-checks everything since
// the client cannot be trusted.
type CardPaymentRequest struct {
	OrderID    string  `json:"orderId" binding:"required"`
	Amount     float64 `json:"amount" binding:"required,gt=0"`
	Email      string  `json:"email" binding:"required,email"`
	CardName   string  `json:"cardName" binding:"required,min=2,max=60"`
	CardNumber string  `json:"cardNumber" binding:"required"`
	// Expiry is "MM / YY" or "MM/YY" to match the frontend's formatted input.
	Expiry   string `json:"expiry" binding:"required"`
	CVV      string `json:"cvv" binding:"required,len=3,numeric"`
	Country  string `json:"country" binding:"required,oneof=TH SG GB US"`
	Postal   string `json:"postal" binding:"required,max=10"`
	SaveCard bool   `json:"saveCard"`
}

// PaymentResponseData is the `data` payload returned on a successful payment.
type PaymentResponseData struct {
	PaymentID     string  `json:"paymentId"`
	OrderID       string  `json:"orderId"`
	Amount        float64 `json:"amount"`
	ReceiptSentTo string  `json:"receiptSentTo"`
	PaidAt        string  `json:"paidAt"`
	CardBrand     string  `json:"cardBrand"`
	CardLast4     string  `json:"cardLast4"`
}
