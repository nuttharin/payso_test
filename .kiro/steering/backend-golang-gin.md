---
inclusion: always
---

# Backend Standards: Golang + Gin

## Stack
- Framework: Gin (`github.com/gin-gonic/gin`)
- Language: Go (ใช้ Go version ล่าสุดที่ stable, ระบุใน `go.mod`)
- Config: environment variables ผ่าน `.env` + `github.com/joho/godotenv` หรือ `viper`
- Validation: `github.com/go-playground/validator/v10` (มาพร้อม Gin binding อยู่แล้ว)
- ORM/DB: `gorm.io/gorm` (ถ้าต้องใช้ ORM) หรือ `database/sql` + `sqlx` สำหรับ raw query — เลือกอย่างใดอย่างหนึ่งให้สม่ำเสมอทั้งโปรเจกต์
- Logging: `log/slog` (standard library structured logging) หรือ `zap` ถ้าต้องการ performance สูง

## Project Structure
```
cmd/
  api/
    main.go              # entrypoint: setup router, DI, graceful shutdown
internal/
  handler/               # HTTP handlers (Gin) — รับ request, เรียก service, return response
    <resource>_handler.go
  service/               # business logic
    <resource>_service.go
  repository/            # data access layer (DB queries)
    <resource>_repository.go
  model/                 # DB entities / domain structs
  dto/                   # request/response structs (input validation, output shape)
  middleware/            # auth, logging, recovery, CORS
  router/                # route registration, grouped by version (/v1)
pkg/                     # reusable packages ที่อาจแยกไป module อื่นได้ในอนาคต
config/                  # config loading
go.mod
go.sum
```

- Layer เรียกกันทางเดียว: `handler → service → repository`. **ห้าม** handler เรียก repository ตรง หรือ repository เรียก service กลับ

## Routing Convention
- Group route ตาม version: `/v1/...`
- ชื่อ resource เป็น plural, kebab/lowercase: `/v1/users`, `/v1/user-orders`
- REST convention มาตรฐาน:
  - `GET /v1/users` — list
  - `GET /v1/users/:id` — get one
  - `POST /v1/users` — create
  - `PUT /v1/users/:id` — full update
  - `PATCH /v1/users/:id` — partial update
  - `DELETE /v1/users/:id` — delete

## Response Format (NEO-style envelope)
ทุก endpoint ต้อง return response format เดียวกันทั้งโปรเจกต์:

```json
{
  "status": "success",
  "data": { },
  "message": ""
}
```

Error case:
```json
{
  "status": "error",
  "data": null,
  "message": "human readable message",
  "error_code": "USER_NOT_FOUND"
}
```

- สร้าง helper กลางที่ `internal/handler/response.go` เช่น `response.Success(c, data)`, `response.Error(c, httpStatus, code, message)` — ห้าม handler เขียน `c.JSON(...)` ตรงๆกระจายทุกที่
- HTTP status code ต้องสื่อความหมายจริง (`400` validation, `401` unauthorized, `403` forbidden, `404` not found, `409` conflict, `500` internal error) — ไม่ return `200` แล้วซ่อน error ไว้ใน body

## Request Validation
- ใช้ DTO struct พร้อม binding tag: `` `json:"email" binding:"required,email"` ``
- Bind ด้วย `c.ShouldBindJSON(&dto)` แล้ว return `400` ทันทีถ้า error พร้อม field-level message
- ห้ามใช้ DB model (`internal/model`) เป็น request/response struct ตรงๆ — ต้องผ่าน DTO เพื่อกัน field รั่ว (เช่น password hash)

## Error Handling
- ใช้ custom error type ที่ wrap ด้วย `errors.Is`/`errors.As` ได้ (Go 1.13+ error wrapping)
- Service layer return error พร้อม context (`fmt.Errorf("get user: %w", err)`) ไม่ return error ดิบจาก DB driver ขึ้นไปให้ handler
- Panic recovery ต้องเปิดผ่าน Gin middleware (`gin.Recovery()` เป็นอย่างน้อย) และ log stack trace

## Middleware
- ลำดับ middleware มาตรฐาน: `Recovery → Logger → CORS → Auth (ถ้ามี) → RateLimit (ถ้ามี)`
- Auth middleware ตรวจ JWT/token แล้ว inject `userID` ลง `c.Set("userID", id)` ให้ handler ดึงใช้ ห้าม parse token ซ้ำใน handler

## Database
- ทุก query ที่รับ input จาก user **ต้องใช้ parameterized query** (`?` placeholder หรือ GORM's built-in binding) ห้าม string concat SQL เด็ดขาด (ป้องกัน SQL injection)
- Migration: ใช้ `golang-migrate/migrate` หรือ GORM AutoMigrate เฉพาะ dev/local ไม่ใช้ AutoMigrate ใน production
- Repository return domain model + error เท่านั้น ไม่ leak `*sql.Rows`/GORM query builder ออกไปนอก repository

## Testing
- Unit test: standard `testing` package + `testify/assert`
- Mock dependency ด้วย interface (repository/service เป็น interface เสมอเพื่อ mock ได้)
- ไม่ต้องเขียนเทสถ้า user ไม่ได้ขอ แต่ถ้ามี test อยู่แล้วในโปรเจกต์ ให้เขียน test คู่กับ feature ใหม่เสมอ

## Naming & Code Style
- รันผ่าน `gofmt`/`goimports` เสมอก่อน commit, แนะนำให้ตั้ง `golangci-lint` เป็น CI gate
- Package name: lowercase สั้นๆ ไม่มี underscore (`handler` ไม่ใช่ `http_handler`)
- Exported identifier: `PascalCase` พร้อม doc comment ที่ขึ้นต้นด้วยชื่อ identifier นั้น
- Unexported: `camelCase`
- Interface ที่มี method เดียว ลงท้ายด้วย `-er` เช่น `UserRepository`, `TokenGenerator`
