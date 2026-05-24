package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/jozdlm/hospital-system/internal/auth"
	"github.com/jozdlm/hospital-system/internal/clinic"
	"github.com/jozdlm/hospital-system/internal/db"
	"github.com/jozdlm/hospital-system/internal/network"
	"github.com/jozdlm/hospital-system/internal/queue"
	"github.com/jozdlm/hospital-system/internal/reports"
	"github.com/jozdlm/hospital-system/internal/ticket"
	websockets "github.com/jozdlm/hospital-system/internal/websocket"
)

func main() {
	// Load .env file
	godotenv.Load()

	// Removed this for now to avoid errors when deploying to Railway
	//if err != nil {
	//	log.Fatal("Error loading .env file")
	//}

	// Connect to database
	db.Connect()

	// Auto migrate
	db.DB.AutoMigrate(
		&db.User{},
		&db.Clinic{},
		&db.Patient{},
		&db.Ticket{},
		&db.QueueEntry{},
	)

	// Seed the database
	db.Seed()

	// Set up Gin router
	r := gin.Default()

	// Set up WebSocket hub
	hub := websockets.NewHub()
	go hub.Run()

	// Set up queue handler
	queueHandler := queue.NewQueueHandler(hub)

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4200", "https://*.railway.app", "*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false, // must be false when using wildcard
	}))

	// Health check route
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Hospital system is running!",
		})
	})

	// Public routes
	public := r.Group("/api")
	{
		public.POST("/auth/login", auth.Login)
		public.GET("/clinics", clinic.GetClinics)
		public.POST("/tickets/emit", queueHandler.EmitTicket)
		// Kiosk route (WebSocket)
		public.GET("/waiting-room", func(c *gin.Context) {
			websockets.HandleWebSocket(hub, c)
		})
		public.GET("/waiting-room/state", queue.GetClinicState)
	}

	// Protected routes
	protected := r.Group("/api")
	protected.Use(auth.JWTMiddleware())
	{
		protected.GET("/me", func(ctx *gin.Context) {
			network.Success(ctx, http.StatusOK, gin.H{
				"user_id": ctx.MustGet("user_id"),
				"role":    ctx.MustGet("role"),
			})
		})
		protected.GET("/queue/:clinicId", queue.GetQueue)
		protected.PUT("/queue/:clinicId/call-next", queueHandler.CallNext)
		protected.PUT("/tickets/:ticketId/cancel", queueHandler.CancelTicket)
		protected.PUT("/tickets/:ticketId/attend", queueHandler.MarkAttended)
		protected.GET("/tickets", ticket.GetTickets)
		// Admin routes
		adminRoutes := protected.Group("/admin")
		adminRoutes.Use(auth.RoleMiddleware("admin"))
		{
			adminRoutes.GET("/reports/by-clinic", reports.GetTicketsByClinic)
			adminRoutes.GET("/reports/by-status", reports.GetTicketsByStatus)
			adminRoutes.POST("/users", auth.CreateUser)
		}
	}

	// Start server on port 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Server running on http://localhost:" + port)
	r.Run(":" + port)
}
