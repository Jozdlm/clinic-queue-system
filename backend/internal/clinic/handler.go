package clinic

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jozdlm/hospital-system/internal/network"
)

func GetClinics(ctx *gin.Context) {
	clinics := ListClinics()
	network.Success(ctx, http.StatusOK, gin.H{"clinics": clinics})
}
