package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jozdlm/hospital-system/internal/db"
	"github.com/jozdlm/hospital-system/internal/network"
	"github.com/jozdlm/hospital-system/internal/utils"
)

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

func Login(ctx *gin.Context) {
	var input LoginInput

	if err := ctx.ShouldBindJSON(&input); err != nil {
		utils.HandleValidationError(ctx, err)
		return
	}

	var user db.User
	result := db.DB.Where("email = ?", input.Email).First(&user)
	if result.Error != nil {
		network.Error(ctx, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if !CheckPassword(input.Password, user.Password) {
		network.Error(ctx, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	token, err := GenerateToken(user.ID, user.Role)
	if err != nil {
		network.Error(ctx, http.StatusInternalServerError, "Could not generate token")
		return
	}

	network.Success(ctx, http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}
