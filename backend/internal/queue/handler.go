package queue

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jozdlm/hospital-system/internal/clinic"
	"github.com/jozdlm/hospital-system/internal/common"
	"github.com/jozdlm/hospital-system/internal/db"
	"github.com/jozdlm/hospital-system/internal/network"
	"github.com/jozdlm/hospital-system/internal/utils"
	websockets "github.com/jozdlm/hospital-system/internal/websocket"
)

type QueueHandler struct {
	hub *websockets.Hub
}

func NewQueueHandler(hub *websockets.Hub) *QueueHandler {
	return &QueueHandler{hub: hub}
}

type NewTicket struct {
	ClinicID uint `json:"clinic_id" binding:"required,min=1"`
}

func (h *QueueHandler) EmitTicket(ctx *gin.Context) {
	var input NewTicket

	if err := ctx.ShouldBindJSON(&input); err != nil {
		utils.HandleValidationError(ctx, err)
		return
	}

	// Verify clinic exists
	var clinic db.Clinic
	if err := db.DB.First(&clinic, input.ClinicID).Error; err != nil {
		network.Error(ctx, http.StatusNotFound, "Clinic not found")
		return
	}

	// Create patient
	patient := db.Patient{Name: "Paciente"}
	db.DB.Create(&patient)

	// Generate ticket code e.g. MG-014
	var count int64
	db.DB.Model(&db.Ticket{}).Where("clinic_id = ?", input.ClinicID).Count(&count)
	code := fmt.Sprintf("%s-%03d", clinic.Name[:2], count+1)

	// Create ticket
	ticket := db.Ticket{
		Code:      code,
		Status:    "WAITING",
		ClinicID:  input.ClinicID,
		PatientID: patient.ID,
	}
	db.DB.Create(&ticket)

	// Get current max position in queue
	var maxPosition int64
	db.DB.Model(&db.QueueEntry{}).Where("clinic_id = ?", input.ClinicID).Count(&maxPosition)

	// Add to queue
	entry := db.QueueEntry{
		TicketID: ticket.ID,
		ClinicID: input.ClinicID,
		Position: int(maxPosition) + 1,
	}
	db.DB.Create(&entry)

	// Broadcast AFTER everything is consistent
	h.broadcastClinicState(ticket.ClinicID)

	network.Success(ctx, http.StatusCreated, gin.H{
		"ticket":   ticket,
		"position": entry.Position,
	})
}

func GetQueue(ctx *gin.Context) {
	clinicID := ctx.Param("clinicId")

	var entries []db.QueueEntry
	db.DB.Where("clinic_id = ?", clinicID).
		Preload("Ticket").
		Preload("Ticket.Patient").
		Order("position asc").
		Find(&entries)

	network.Success(ctx, http.StatusOK, gin.H{
		"queue": entries,
		"count": len(entries),
	})
}

func GetClinicState(ctx *gin.Context) {
	clinics := clinic.ListClinics()

	var states []common.ClinicState
	for _, clinic := range clinics {
		state := common.BuildClinicState(clinic.ID, clinic.Name)
		states = append(states, state)
	}

	network.Success(ctx, http.StatusOK, gin.H{"clinics": states})
}

func (h *QueueHandler) CallNext(ctx *gin.Context) {
	clinicID := ctx.Param("clinicId")

	// Get all waiting entries for this clinic ordered by position
	var entries []db.QueueEntry
	db.DB.Where("clinic_id = ?", clinicID).
		Preload("Ticket").
		Preload("Ticket.Patient").
		Order("position asc").
		Find(&entries)

	// Find the first one with WAITING status
	var entry db.QueueEntry
	found := false
	for _, e := range entries {
		if e.Ticket.Status == "WAITING" {
			entry = e
			found = true
			break
		}
	}

	if !found {
		network.Error(ctx, http.StatusNotFound, "No waiting tickets in this queue")
		return
	}

	// Update ticket status
	db.DB.Model(&entry.Ticket).Update("status", "IN_ATTENTION")

	// Recalculate positions
	recalculateTicketPosition(clinicID)

	// Preload relationships before broadcasting
	db.DB.Preload("Clinic").Preload("Patient").First(&entry.Ticket, entry.Ticket.ID)

	// Broadcast AFTER everything is consistent
	h.broadcastClinicState(entry.ClinicID)

	// Respond to the HTTP request
	network.Success(ctx, http.StatusOK, gin.H{"ticket": entry.Ticket})
}

func (h *QueueHandler) MarkAttended(ctx *gin.Context) {
	ticketID := ctx.Param("ticketId")

	var ticket db.Ticket
	if err := db.DB.First(&ticket, ticketID).Error; err != nil {
		network.Error(ctx, http.StatusNotFound, "Ticket not found")
		return
	}

	db.DB.Model(&ticket).Update("status", "ATTENDED")

	// Remove from queue
	db.DB.Where("ticket_id = ?", ticket.ID).Delete(&db.QueueEntry{})

	// Recalculate positions for remaining WAITING tickets
	recalculateTicketPosition(fmt.Sprint(ticket.ClinicID))

	// Broadcast AFTER everything is consistent
	h.broadcastClinicState(ticket.ClinicID)

	network.Success(ctx, http.StatusOK, gin.H{
		"message": "Ticket attended successfully",
		"ticket":  ticket,
	})
}

func (h *QueueHandler) CancelTicket(ctx *gin.Context) {
	ticketID := ctx.Param("ticketId")

	var ticket db.Ticket
	if err := db.DB.First(&ticket, ticketID).Error; err != nil {
		network.Error(ctx, http.StatusNotFound, "Ticket not found")
		return
	}

	if ticket.Status != "WAITING" && ticket.Status != "IN_ATTENTION" {
		network.Error(ctx, http.StatusBadRequest, "Only waiting or in-attention tickets can be cancelled")
		return
	}

	db.DB.Model(&ticket).Update("status", "CANCELLED")

	// Remove from queue
	db.DB.Where("ticket_id = ?", ticket.ID).Delete(&db.QueueEntry{})

	// Recalculate positions for remaining WAITING tickets
	recalculateTicketPosition(fmt.Sprint(ticket.ClinicID))

	// Broadcast AFTER everything is consistent
	h.broadcastClinicState(ticket.ClinicID)

	network.Success(ctx, http.StatusOK, gin.H{
		"message": "Ticket cancelled successfully",
		"ticket":  ticket,
	})
}
