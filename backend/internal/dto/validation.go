package dto

import (
	"fmt"
	"reflect"

	"github.com/go-playground/validator/v10"
)

// FieldErrorOut is the field-level detail returned in a 400 validation
// response, keyed by the request's JSON field name so the frontend can
// map it straight back onto the matching form field.
type FieldErrorOut struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// tagMessages holds Thai messages per validator tag, matched against the
// frontend's zod messages in src/lib/payment/schema.ts so both layers
// speak the same language to the user.
var tagMessages = map[string]string{
	"required": "จำเป็นต้องกรอกข้อมูลนี้",
	"email":    "กรุณากรอกอีเมลให้ถูกต้อง",
	"min":      "ข้อมูลสั้นเกินไป",
	"max":      "ข้อมูลยาวเกินไป",
	"len":      "จำนวนตัวอักษรไม่ถูกต้อง",
	"numeric":  "กรุณากรอกตัวเลขเท่านั้น",
	"gt":       "ค่าต้องมากกว่าศูนย์",
	"oneof":    "ค่านี้ไม่อยู่ในรายการที่รองรับ",
}

// FormatValidationErrors converts a validator.ValidationErrors (as
// produced by Gin's ShouldBindJSON) into field-level messages keyed by
// the request struct's `json` tag, so the shape lines up with the
// frontend's react-hook-form field names.
func FormatValidationErrors(err error, target any) []FieldErrorOut {
	validationErrors, ok := err.(validator.ValidationErrors)
	if !ok {
		return []FieldErrorOut{{Field: "_", Message: "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง"}}
	}

	t := reflect.TypeOf(target)
	out := make([]FieldErrorOut, 0, len(validationErrors))

	for _, fe := range validationErrors {
		jsonField := fe.Field()
		if structField, found := t.FieldByName(fe.StructField()); found {
			if tag := structField.Tag.Get("json"); tag != "" && tag != "-" {
				jsonField = tag
				if idx := indexOfComma(tag); idx >= 0 {
					jsonField = tag[:idx]
				}
			}
		}

		message, known := tagMessages[fe.Tag()]
		if !known {
			message = fmt.Sprintf("ข้อมูลไม่ถูกต้อง (%s)", fe.Tag())
		}

		out = append(out, FieldErrorOut{Field: jsonField, Message: message})
	}

	return out
}

func indexOfComma(s string) int {
	for i, c := range s {
		if c == ',' {
			return i
		}
	}
	return -1
}
