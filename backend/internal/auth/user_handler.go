package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jozdlm/hospital-system/internal/db"
	"github.com/jozdlm/hospital-system/internal/network"
	"github.com/jozdlm/hospital-system/internal/utils"
)

type UserInput struct {
	Name     string `json:"name" binding:"required,min=6"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required"`
}

func CreateUser(ctx *gin.Context) {
	var input UserInput

	if err := ctx.ShouldBindJSON(&input); err != nil {
		utils.HandleValidationError(ctx, err)
		return
	}

	var existingUser db.User
	result := db.DB.Where("email = ?", input.Email).First(&existingUser)
	if result.Error == nil {
		network.Error(ctx, http.StatusConflict, "The email is already taken")
		return
	}

	hashedPassword, err := HashPassword(input.Password)
	if err != nil {
		network.Error(ctx, http.StatusInternalServerError, "Could not hash the password")
		return
	}

	user := db.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: hashedPassword,
		Role:     input.Role,
	}
	db.DB.Create(&user)

	network.Success(ctx, http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user":    user,
	})
}
