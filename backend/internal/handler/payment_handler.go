package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"paymentapi/internal/dto"
	"paymentapi/internal/service"
)

// PaymentHandler exposes HTTP endpoints for submitting payments.
// It only binds/validates input and shapes output — all business logic
// lives in service.PaymentService.
type PaymentHandler struct {
	service service.PaymentService
}

// NewPaymentHandler wires a PaymentHandler against the given service.
func NewPaymentHandler(svc service.PaymentService) *PaymentHandler {
	return &PaymentHandler{service: svc}
}

// SubmitCardPayment handles POST /v1/payments/card.
func (h *PaymentHandler) SubmitCardPayment(c *gin.Context) {
	var req dto.CardPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fields := dto.FormatValidationErrors(err, req)
		c.JSON(http.StatusBadRequest, gin.H{
			"status":     "error",
			"data":       nil,
			"message":    "ข้อมูลที่ส่งมาไม่ถูกต้อง",
			"error_code": "VALIDATION_ERROR",
			"fields":     fields,
		})
		return
	}

	data, err := h.service.SubmitCardPayment(c.Request.Context(), req)
	if err != nil {
		h.respondError(c, err)
		return
	}

	Success(c, data, "การชำระเงินสำเร็จ")
}

func (h *PaymentHandler) respondError(c *gin.Context, err error) {
	paymentErr, ok := service.AsPaymentError(err)
	if !ok {
		Error(c, http.StatusInternalServerError, string(service.ErrCodeInternal), "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง")
		return
	}

	switch paymentErr.Code {
	case service.ErrCodeValidation:
		fields := make([]dto.FieldErrorOut, 0, len(paymentErr.Fields))
		for _, f := range paymentErr.Fields {
			fields = append(fields, dto.FieldErrorOut{Field: f.Field, Message: f.Message})
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"status":     "error",
			"data":       nil,
			"message":    paymentErr.Message,
			"error_code": string(paymentErr.Code),
			"fields":     fields,
		})
	case service.ErrCodeCardDeclined:
		Error(c, http.StatusUnprocessableEntity, string(paymentErr.Code), paymentErr.Message)
	case service.ErrCodeDuplicate:
		Error(c, http.StatusConflict, string(paymentErr.Code), paymentErr.Message)
	case service.ErrCodeProviderTimeout:
		Error(c, http.StatusGatewayTimeout, string(paymentErr.Code), paymentErr.Message)
	default:
		Error(c, http.StatusInternalServerError, string(service.ErrCodeInternal), "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง")
	}
}
