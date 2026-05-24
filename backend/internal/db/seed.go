package db

import (
	"log"

	"golang.org/x/crypto/bcrypt"
)

func Seed() {
	seedClinics()
	seedAdminUser()
	seedStaffUser()
}

func seedClinics() {
	clinics := []Clinic{
		{Name: "Medicina General", Description: "Atención médica general"},
		{Name: "Oculista", Description: "Atención oftalmológica básica"},
		{Name: "Dermatología", Description: "Atención de enfermedades de la piel"},
		{Name: "Oftalmología", Description: "Atención especializada de los ojos"},
		{Name: "Cardiología", Description: "Atención especializada del corazón"},
	}

	for _, clinic := range clinics {
		DB.FirstOrCreate(&clinic, Clinic{Name: clinic.Name})
	}
	log.Println("Clinics seeded successfully!")
}

func seedAdminUser() {
	var adminUser User
	result := DB.Where("email = ?", "admin@hospital.com").First(&adminUser)
	if result.Error != nil {
		bytes, err := bcrypt.GenerateFromPassword([]byte("admin123"), 14)
		if err != nil {
			log.Fatal("Could not hash admin password:", err)
		}
		DB.Create(&User{
			Name:     "Admin",
			Email:    "admin@hospital.com",
			Password: string(bytes),
			Role:     "admin",
		})
		log.Println("Admin user seeded successfully!")
	}
}

func seedStaffUser() {
	var staffUser User
	result := DB.Where("email = ?", "frontdesk@hospital.com").First(&staffUser)
	if result.Error != nil {
		bytes, err := bcrypt.GenerateFromPassword([]byte("staff123"), 14)
		if err != nil {
			log.Fatal("Could not hash staff password:", err)
		}
		DB.Create(&User{
			Name:     "Front Desk",
			Email:    "frontdesk@hospital.com",
			Password: string(bytes),
			Role:     "staff",
		})
		log.Println("Staff user seeded successfully!")
	}
}
