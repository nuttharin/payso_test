# REFERENCE — Go+Gin layer templates

All templates below use `<Resource>` (PascalCase, e.g. `Order`), `<resource>`
(camelCase, e.g. `order`), `<resources>` (plural route segment, e.g. `orders`),
and `<module>` (the `go.mod` module path, e.g. `paymentapi`). Replace before
writing files. Field names/types in these templates are illustrative — always
adapt them to what the user actually asked for.

## 1. `internal/model/<resource>.go`

```go
// Package model holds domain entities. These never leave the
// repository/service layers directly — handlers always return dto types.
package model

import "time"

// <Resource>Status enumerates the lifecycle states of a <resource>.
type <Resource>Status string

const (
	<Resource>StatusPending <Resource>Status = "pending"
	<Resource>StatusActive  <Resource>Status = "active"
)

// <Resource> is the domain record for a <resource>.
type <Resource> struct {
	ID        string
	// ...domain fields...
	Status    <Resource>Status
	CreatedAt time.Time
}
```

## 2. `internal/dto/<resource>_dto.go`

```go
// Package dto holds request/response structs for the <resource> API.
package dto

// Create<Resource>Request is the request body for POST /v1/<resources>.
type Create<Resource>Request struct {
	Name string `json:"name" binding:"required,min=2,max=120"`
	// ...other fields with binding tags...
}

// <Resource>ResponseData is the `data` payload returned for a <resource>.
type <Resource>ResponseData struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
}
```

If the request needs field-level Thai/localized messages, extend the shared
`tagMessages` map in `internal/dto/validation.go` — do not duplicate the map.

## 3. `internal/repository/<resource>_repository.go`

```go
// Package repository provides data access for <resource> records.
package repository

import (
	"context"
	"fmt"
	"sync"

	"<module>/internal/model"
)

// <Resource>Repository defines persistence operations for <resources>.
type <Resource>Repository interface {
	Save(ctx context.Context, r model.<Resource>) error
	FindByID(ctx context.Context, id string) (*model.<Resource>, bool, error)
}

type inMemory<Resource>Repository struct {
	mu   sync.RWMutex
	byID map[string]model.<Resource>
}

// NewInMemory<Resource>Repository creates a thread-safe, process-local store.
// Swap for a Postgres-backed implementation (gorm/sqlx) when persistence is needed.
func NewInMemory<Resource>Repository() <Resource>Repository {
	return &inMemory<Resource>Repository{byID: make(map[string]model.<Resource>)}
}

func (r *inMemory<Resource>Repository) Save(_ context.Context, item model.<Resource>) error {
	if item.ID == "" {
		return fmt.Errorf("save <resource>: id is required")
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.byID[item.ID] = item
	return nil
}

func (r *inMemory<Resource>Repository) FindByID(_ context.Context, id string) (*model.<Resource>, bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	item, ok := r.byID[id]
	if !ok {
		return nil, false, nil
	}
	return &item, true, nil
}
```

If the project already uses GORM/sqlx for other resources, follow that
implementation's pattern instead of the in-memory map above — check
`internal/repository/*.go` for the established style first (Step 1 of workflow).

## 4. `internal/service/<resource>_service.go`

```go
// Package service contains business logic for the <resource> API.
package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"<module>/internal/dto"
	"<module>/internal/model"
	"<module>/internal/repository"
)

// <Resource>Service processes <resource> business logic.
type <Resource>Service interface {
	Create(ctx context.Context, req dto.Create<Resource>Request) (*dto.<Resource>ResponseData, error)
}

type <resource>Service struct {
	repo repository.<Resource>Repository
	now  func() time.Time
}

// New<Resource>Service wires a <Resource>Service against the given repository.
func New<Resource>Service(repo repository.<Resource>Repository) <Resource>Service {
	return &<resource>Service{repo: repo, now: time.Now}
}

// Create validates business rules the DTO binding tags cannot express,
// then persists the new <resource>.
func (s *<resource>Service) Create(ctx context.Context, req dto.Create<Resource>Request) (*dto.<Resource>ResponseData, error) {
	// ...business validation beyond binding tags -> return NewValidationError(fields...) if any...

	item := model.<Resource>{
		ID:        uuid.NewString(),
		Status:    model.<Resource>StatusPending,
		CreatedAt: s.now(),
	}

	if err := s.repo.Save(ctx, item); err != nil {
		return nil, fmt.Errorf("save <resource>: %w", err)
	}

	return &dto.<Resource>ResponseData{
		ID:        item.ID,
		Status:    string(item.Status),
		CreatedAt: item.CreatedAt.Format(time.RFC3339),
	}, nil
}
```

### Typed errors — reuse the existing pattern

Do not create a new error-handling convention per resource. If
`internal/service/errors.go` (or similarly named file) already defines a
generic `ErrorCode` + `*XxxError` + `AsXxxError`, either:
- reuse it directly if the domain fits (e.g. `NewValidationError`, `NewDuplicateError` are generic enough for most resources), or
- add new `ErrCode*` consts and constructor functions to that same file, following its exact shape (`Code`, `Message`, `Fields`, `cause`, `Error()`, `Unwrap()`).

Only introduce a second error file if the existing one is scoped tightly to
another resource's domain (e.g. named `payment_errors.go` with payment-only
codes) — in that case create `<resource>_errors.go` mirroring the same shape.

## 5. `internal/handler/<resource>_handler.go`

```go
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"<module>/internal/dto"
	"<module>/internal/service"
)

// <Resource>Handler exposes HTTP endpoints for <resources>.
// It only binds/validates input and shapes output — all business logic
// lives in service.<Resource>Service.
type <Resource>Handler struct {
	service service.<Resource>Service
}

// New<Resource>Handler wires a <Resource>Handler against the given service.
func New<Resource>Handler(svc service.<Resource>Service) *<Resource>Handler {
	return &<Resource>Handler{service: svc}
}

// Create handles POST /v1/<resources>.
func (h *<Resource>Handler) Create(c *gin.Context) {
	var req dto.Create<Resource>Request
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

	data, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		h.respondError(c, err)
		return
	}

	SuccessWithStatus(c, http.StatusCreated, data, "สร้าง<resource>สำเร็จ")
}

func (h *<Resource>Handler) respondError(c *gin.Context, err error) {
	svcErr, ok := service.AsPaymentError(err) // reuse the shared typed-error accessor if generic;
	// otherwise call the resource-specific AsXxxError recovered in Step 4.
	if !ok {
		Error(c, http.StatusInternalServerError, string(service.ErrCodeInternal), "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง")
		return
	}

	switch svcErr.Code {
	case service.ErrCodeValidation:
		fields := make([]dto.FieldErrorOut, 0, len(svcErr.Fields))
		for _, f := range svcErr.Fields {
			fields = append(fields, dto.FieldErrorOut{Field: f.Field, Message: f.Message})
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"status":     "error",
			"data":       nil,
			"message":    svcErr.Message,
			"error_code": string(svcErr.Code),
			"fields":     fields,
		})
	case service.ErrCodeDuplicate:
		Error(c, http.StatusConflict, string(svcErr.Code), svcErr.Message)
	default:
		Error(c, http.StatusInternalServerError, string(service.ErrCodeInternal), "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง")
	}
}
```

Only add `case` branches for error codes that actually exist for this
resource — don't copy every case from an unrelated handler.

## 6. Wire into `internal/router/router.go`

```go
type Deps struct {
	PaymentHandler *handler.PaymentHandler
	<Resource>Handler *handler.<Resource>Handler // add this
	AllowedOrigins []string
}

func New(deps Deps) *gin.Engine {
	// ...existing setup...

	v1 := engine.Group("/v1")
	{
		// ...existing groups...

		<resources> := v1.Group("/<resources>")
		{
			<resources>.POST("", deps.<Resource>Handler.Create)
			<resources>.GET("/:id", deps.<Resource>Handler.Get) // only if requested
		}
	}

	return engine
}
```

## 7. Wire into `cmd/api/main.go`

```go
<resource>Repo := repository.NewInMemory<Resource>Repository()
<resource>Service := service.New<Resource>Service(<resource>Repo)
<resource>Handler := handler.New<Resource>Handler(<resource>Service)

engine := router.New(router.Deps{
	PaymentHandler:    paymentHandler,
	<Resource>Handler: <resource>Handler, // add this
	AllowedOrigins:    cfg.AllowedOrigins,
})
```

Construct in dependency order: repository → service → handler, same as the
existing payment wiring, then pass into `router.Deps`.

## Route verb → handler method naming

| REST verb | Route | Handler method |
|-----------|-------|-----------------|
| `GET /v1/<resources>` | list | `List` |
| `GET /v1/<resources>/:id` | get one | `GetByID` |
| `POST /v1/<resources>` | create | `Create` |
| `PUT /v1/<resources>/:id` | full update | `Update` |
| `PATCH /v1/<resources>/:id` | partial update | `PartialUpdate` |
| `DELETE /v1/<resources>/:id` | delete | `Delete` |

Only generate the methods/routes the user actually asked for — don't
scaffold unused CRUD surface.
