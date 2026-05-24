package common

import "github.com/jozdlm/hospital-system/internal/db"

type ClinicState struct {
	ClinicID      uint   `json:"clinic_id"`
	ClinicName    string `json:"clinic_name"`
	CurrentTicket string `json:"current_clinic"`
	NextTicket    string `json:"next_ticket"`
	WaitingCount  int64  `json:"waiting_count"`
}

func BuildClinicState(clinicID uint, clinicName string) ClinicState {
	// Gets the IN_ATTENTION ticket
	var currTicket db.Ticket
	db.DB.Where("clinic_id = ? AND status = ?", clinicID, "IN_ATTENTION").First(&currTicket)
	curr := currTicket.Code

	// Gets the first WAITING ticket
	var nextTicket db.Ticket
	db.DB.Where("clinic_id = ? AND status = ?", clinicID, "WAITING").First(&nextTicket)
	next := nextTicket.Code

	// Gets the number of waiting tickets by clinicID
	var count int64
	db.DB.Model(&db.Ticket{}).Where("clinic_id = ? AND status = ?", clinicID, "WAITING").Count(&count)

	return ClinicState{
		ClinicID:      clinicID,
		ClinicName:    clinicName,
		CurrentTicket: curr,
		NextTicket:    next,
		WaitingCount:  count,
	}
}
