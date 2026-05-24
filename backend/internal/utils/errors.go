package utils

import (
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/jozdlm/hospital-system/internal/network"
)

func HandleValidationError(ctx *gin.Context, err error) {
	var fieldErrors []network.FieldError

	for _, e := range err.(validator.ValidationErrors) {
		fieldErrors = append(fieldErrors, network.FieldError{
			Field:   e.Field(),
			Message: validationMessage(e),
		})
	}

	network.ValidationError(ctx, fieldErrors)
}

func validationMessage(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return e.Field() + " is required"
	case "email":
		return "Invalid email format"
	case "min":
		return e.Field() + " must be at least " + e.Param() + " characters"
	case "max":
		return e.Field() + " must not exceed " + e.Param() + " characters"
	default:
		return e.Field() + " is invalid"
	}
}
