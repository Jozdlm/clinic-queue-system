package db

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Email     string    `gorm:"unique;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	Role      string    `gorm:"not null;default:'staff'" json:"role"` // admin or staff
	CreatedAt time.Time `json:"created_at"`
}

type Clinic struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	Tickets     []Ticket  `gorm:"foreignKey:ClinicID" json:"-"`
	CreatedAt   time.Time `json:"created_at"`
}

type Patient struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Ticket struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Code      string    `gorm:"unique;not null" json:"code"`
	Status    string    `gorm:"not null;default:'WAITING'" json:"status"` // WAITING, IN_ATTENTION, ATTENDED, CANCELLED
	ClinicID  uint      `gorm:"not null" json:"clinic_id"`
	Clinic    Clinic    `json:"clinic"`
	PatientID uint      `gorm:"not null" json:"patient_id"`
	Patient   Patient   `json:"patient"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type QueueEntry struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TicketID  uint      `gorm:"not null" json:"ticket_id"`
	Ticket    Ticket    `json:"ticket"`
	ClinicID  uint      `gorm:"not null" json:"clinic_id"`
	Clinic    Clinic    `json:"clinic"`
	Position  int       `gorm:"not null" json:"position"`
	CreatedAt time.Time `json:"created_at"`
}
