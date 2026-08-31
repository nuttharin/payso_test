// Package repository provides data access for payment records.
// This in-memory implementation stands in for a real database and is
// safe for concurrent use. Swap for a Postgres-backed implementation
// (gorm or sqlx per steering: backend-golang-gin) when persistence is needed.
package repository

import (
	"context"
	"fmt"
	"sync"

	"paymentapi/internal/model"
)

// PaymentRepository defines persistence operations for payments.
type PaymentRepository interface {
	Save(ctx context.Context, payment model.Payment) error
	FindByOrderID(ctx context.Context, orderID string) (*model.Payment, bool, error)
}

type inMemoryPaymentRepository struct {
	mu      sync.RWMutex
	byOrder map[string]model.Payment
}

// NewInMemoryPaymentRepository creates a thread-safe, process-local
// payment store keyed by order ID (used to detect duplicate submissions).
func NewInMemoryPaymentRepository() PaymentRepository {
	return &inMemoryPaymentRepository{
		byOrder: make(map[string]model.Payment),
	}
}

func (r *inMemoryPaymentRepository) Save(_ context.Context, payment model.Payment) error {
	if payment.OrderID == "" {
		return fmt.Errorf("save payment: order id is required")
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.byOrder[payment.OrderID] = payment
	return nil
}

func (r *inMemoryPaymentRepository) FindByOrderID(_ context.Context, orderID string) (*model.Payment, bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	payment, ok := r.byOrder[orderID]
	if !ok {
		return nil, false, nil
	}
	return &payment, true, nil
}
