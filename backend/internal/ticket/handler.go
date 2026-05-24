package ticket

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jozdlm/hospital-system/internal/db"
	"github.com/jozdlm/hospital-system/internal/network"
)

func GetTickets(ctx *gin.Context) {
	status := ctx.Query("status")
	var tickets []db.Ticket
	query := db.DB.Preload("Clinic").Preload("Patient")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Find(&tickets)
	network.Success(ctx, http.StatusOK, gin.H{"tickets": tickets})
}
