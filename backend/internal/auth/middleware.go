package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header must be: Bearer <token>",
			})
			c.Abort()
			return
		}

		claims, err := ValidateToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		c.Set("user_id", claims["user_id"])
		c.Set("role", claims["role"])

		c.Next()
	}
}

func RoleMiddleware(requiredRole string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		k, ok := ctx.Get("role")

		if !ok {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error": "No session found, access denied",
			})
			ctx.Abort()
			return
		}

		role, ok := k.(string)

		if !ok {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"error": "No session found, access denied",
			})
			ctx.Abort()
			return
		}

		if requiredRole != role {
			ctx.JSON(http.StatusForbidden, gin.H{
				"error": "Forbidden, access denied",
			})
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}
