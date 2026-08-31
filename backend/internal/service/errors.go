package service

import "errors"

// ErrorCode is a stable machine-readable identifier returned in the
// NEO-style error envelope's `error_code` field.
type ErrorCode string

const (
	ErrCodeValidation      ErrorCode = "VALIDATION_ERROR"
	ErrCodeCardDeclined    ErrorCode = "CARD_DECLINED"
	ErrCodeProviderTimeout ErrorCode = "PROVIDER_TIMEOUT"
	ErrCodeDuplicate       ErrorCode = "DUPLICATE_SUBMISSION"
	ErrCodeInternal        ErrorCode = "INTERNAL_ERROR"
)

// FieldError describes a single invalid field, matching the shape the
// frontend's react-hook-form + zod setup already understands.
type FieldError struct {
	Field   string
	Message string
}

// PaymentError is a typed, wrapped error carrying an HTTP-friendly code
// and optional field-level validation detail. Callers use errors.As to
// recover it in the handler layer instead of string-matching messages.
type PaymentError struct {
	Code    ErrorCode
	Message string
	Fields  []FieldError
	cause   error
}

func (e *PaymentError) Error() string {
	if e.cause != nil {
		return e.Message + ": " + e.cause.Error()
	}
	return e.Message
}

func (e *PaymentError) Unwrap() error {
	return e.cause
}

// NewValidationError builds a PaymentError for one or more invalid fields.
func NewValidationError(fields ...FieldError) *PaymentError {
	return &PaymentError{
		Code:    ErrCodeValidation,
		Message: "ข้อมูลการชำระเงินไม่ถูกต้อง",
		Fields:  fields,
	}
}

// NewDeclinedError builds a PaymentError for a provider decline outcome.
func NewDeclinedError() *PaymentError {
	return &PaymentError{
		Code:    ErrCodeCardDeclined,
		Message: "บัตรถูกปฏิเสธโดยผู้ให้บริการ กรุณาตรวจสอบข้อมูลหรือใช้บัตรอื่น",
	}
}

// NewProviderTimeoutError builds a PaymentError for a simulated network timeout.
func NewProviderTimeoutError() *PaymentError {
	return &PaymentError{
		Code:    ErrCodeProviderTimeout,
		Message: "หมดเวลาเชื่อมต่อผู้ให้บริการชำระเงิน กรุณาลองใหม่อีกครั้ง",
	}
}

// NewDuplicateError builds a PaymentError for a detected duplicate submission.
func NewDuplicateError() *PaymentError {
	return &PaymentError{
		Code:    ErrCodeDuplicate,
		Message: "ตรวจพบการส่งคำสั่งซื้อซ้ำ คำสั่งซื้อนี้ได้รับการดำเนินการไปแล้ว",
	}
}

// AsPaymentError recovers a *PaymentError from a wrapped error chain.
func AsPaymentError(err error) (*PaymentError, bool) {
	var pe *PaymentError
	if errors.As(err, &pe) {
		return pe, true
	}
	return nil, false
}
