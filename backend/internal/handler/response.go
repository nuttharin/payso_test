// Package handler contains Gin HTTP handlers and the shared NEO-style
// response envelope helpers used by every endpoint in this API.
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// envelope is the NEO-style response shape shared with the frontend.
// See steering: backend-golang-gin.
type envelope struct {
	Status    string `json:"status"`
	Data      any    `json:"data"`
	Message   string `json:"message"`
	ErrorCode string `json:"error_code,omitempty"`
}

// Success writes a 200 NEO-style success envelope.
func Success(c *gin.Context, data any, message string) {
	c.JSON(http.StatusOK, envelope{
		Status:  "success",
		Data:    data,
		Message: message,
	})
}

// SuccessWithStatus writes a NEO-style success envelope with a custom
// HTTP status code (e.g. 201 for resource creation).
func SuccessWithStatus(c *gin.Context, status int, data any, message string) {
	c.JSON(status, envelope{
		Status:  "success",
		Data:    data,
		Message: message,
	})
}

// Error writes a NEO-style error envelope. httpStatus must reflect the
// real outcome (400 validation, 401/403 auth, 404 not found, 409 conflict,
// 422 business rule rejection, 500 internal error) — never 200 with a
// hidden error.
func Error(c *gin.Context, httpStatus int, code string, message string) {
	c.JSON(httpStatus, envelope{
		Status:    "error",
		Data:      nil,
		Message:   message,
		ErrorCode: code,
	})
}
