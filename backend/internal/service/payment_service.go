// Package service contains business logic for the payment API.
// Handlers call into this layer; this layer calls the repository layer.
// Neither direction is ever reversed (see steering: backend-golang-gin).
package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"paymentapi/internal/dto"
	"paymentapi/internal/model"
	"paymentapi/internal/repository"
)

// PaymentService processes card payments: validates input, simulates a
// provider call, and persists the outcome.
type PaymentService interface {
	SubmitCardPayment(ctx context.Context, req dto.CardPaymentRequest) (*dto.PaymentResponseData, error)
}

type paymentService struct {
	repo repository.PaymentRepository
	now  func() time.Time
}

// NewPaymentService wires a PaymentService against the given repository.
func NewPaymentService(repo repository.PaymentRepository) PaymentService {
	return &paymentService{repo: repo, now: time.Now}
}

// SubmitCardPayment re-validates business rules the DTO binding tags
// cannot express (Luhn/brand check, expiry, postal-per-country), checks
// for a duplicate order submission, then "processes" the payment.
//
// There is no real payment provider here — every request that passes
// validation and isn't a duplicate is approved.
func (s *paymentService) SubmitCardPayment(ctx context.Context, req dto.CardPaymentRequest) (*dto.PaymentResponseData, error) {
	if fields := s.validateBusinessRules(req); len(fields) > 0 {
		return nil, NewValidationError(fields...)
	}

	if existing, found, err := s.repo.FindByOrderID(ctx, req.OrderID); err != nil {
		return nil, fmt.Errorf("check duplicate order: %w", err)
	} else if found && existing.Status == model.PaymentStatusApproved {
		return nil, NewDuplicateError()
	}

	brand := detectCardBrand(req.CardNumber)
	payment := model.Payment{
		ID:        uuid.NewString(),
		OrderID:   req.OrderID,
		Amount:    req.Amount,
		Email:     req.Email,
		CardBrand: brand,
		CardLast4: cardLast4(req.CardNumber),
		Status:    model.PaymentStatusApproved,
		CreatedAt: s.now(),
	}

	if err := s.repo.Save(ctx, payment); err != nil {
		return nil, fmt.Errorf("save payment: %w", err)
	}

	return &dto.PaymentResponseData{
		PaymentID:     payment.ID,
		OrderID:       payment.OrderID,
		Amount:        payment.Amount,
		ReceiptSentTo: payment.Email,
		PaidAt:        payment.CreatedAt.Format(time.RFC3339),
		CardBrand:     string(payment.CardBrand),
		CardLast4:     payment.CardLast4,
	}, nil
}

// validateBusinessRules re-checks everything the frontend's zod schema
// (src/lib/payment/schema.ts) validates, since client-side checks must
// never be trusted as the source of truth.
func (s *paymentService) validateBusinessRules(req dto.CardPaymentRequest) []FieldError {
	var fields []FieldError

	if !luhnCheck(req.CardNumber) || !isSupportedCard(req.CardNumber) {
		fields = append(fields, FieldError{
			Field:   "cardNumber",
			Message: "กรุณากรอกหมายเลขบัตร Visa หรือ Mastercard ที่ถูกต้อง",
		})
	}

	if !isValidExpiry(req.Expiry, s.now()) {
		fields = append(fields, FieldError{
			Field:   "expiry",
			Message: "กรุณากรอกวันในอนาคตตามรูปแบบ MM / YY",
		})
	}

	if !isValidPostalCode(req.Postal, req.Country) {
		fields = append(fields, FieldError{
			Field:   "postal",
			Message: "กรุณากรอกรหัสไปรษณีย์ให้ถูกต้องตามประเทศที่เลือก",
		})
	}

	return fields
}
