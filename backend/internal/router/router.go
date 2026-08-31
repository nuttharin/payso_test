// Package router registers all HTTP routes, grouped by version.
package router

import (
	"github.com/gin-gonic/gin"

	"paymentapi/internal/handler"
	"paymentapi/internal/middleware"
)

// Deps carries the handlers the router wires up. Add more handlers here
// as the API grows.
type Deps struct {
	PaymentHandler *handler.PaymentHandler
	AllowedOrigins []string
}

// New builds the Gin engine with standard middleware
// (Recovery -> Logger -> CORS) and versioned route groups.
func New(deps Deps) *gin.Engine {
	engine := gin.New()
	engine.Use(gin.Recovery(), gin.Logger())
	engine.Use(middleware.CORS(deps.AllowedOrigins))

	engine.GET("/healthz", func(c *gin.Context) {
		handler.Success(c, gin.H{"status": "ok"}, "")
	})

	v1 := engine.Group("/v1")
	{
		payments := v1.Group("/payments")
		{
			payments.POST("/card", deps.PaymentHandler.SubmitCardPayment)
		}
	}

	return engine
}
