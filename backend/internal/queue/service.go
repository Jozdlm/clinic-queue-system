package queue

import (
	"encoding/json"

	"github.com/jozdlm/hospital-system/internal/common"
	"github.com/jozdlm/hospital-system/internal/db"
)

func recalculateTicketPosition(clinicID string) {
	var remainingEntries []db.QueueEntry
	db.DB.Where("clinic_id = ?", clinicID).
		Preload("Ticket").
		Order("position asc").
		Find(&remainingEntries)

	for i, e := range remainingEntries {
		if e.Ticket.Status == "WAITING" {
			db.DB.Model(&e).Update("position", i+1)
		}
	}
}

func (h *QueueHandler) broadcastClinicState(clinicID uint) {
	// Prepare the state before broadcast
	var clinic db.Clinic
	db.DB.First(&clinic, clinicID)
	state := common.BuildClinicState(clinicID, clinic.Name)

	// Broadcast AFTER everything is consistent
	message, _ := json.Marshal(state)
	h.hub.Broadcast <- message
}
