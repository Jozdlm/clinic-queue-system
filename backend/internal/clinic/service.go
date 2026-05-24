package clinic

import "github.com/jozdlm/hospital-system/internal/db"

func ListClinics() []db.Clinic {
	var clinics []db.Clinic
	db.DB.Find(&clinics)
	return clinics
}
