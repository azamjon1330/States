package main

import (
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"hospital-backend/internal/config"
	"hospital-backend/internal/handlers"
	"hospital-backend/internal/middleware"
	"hospital-backend/internal/models"
	"hospital-backend/internal/repository"
)

func main() {
	// Load .env file if present
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := db.AutoMigrate(
		&models.User{},
		&models.Patient{},
		&models.Staff{},
		&models.Nurse{},
		&models.Room{},
		&models.Appointment{},
		&models.Income{},
		&models.Expense{},
		&models.WarehouseItem{},
		&models.Notification{},
		&models.ChatMessage{},
		&models.PatientReminder{},
		&models.Salary{},
	); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

	seedInitialData(db)

	repos := repository.NewRepositories(db)
	h := handlers.NewHandlers(repos)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")

	// Auth routes (public)
	auth := api.Group("/auth")
	{
		auth.POST("/login", h.Auth.Login)
		auth.POST("/register", h.Auth.Register)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/auth/me", h.Auth.Me)
		protected.PUT("/auth/profile", h.Auth.UpdateProfile)

		// Dashboard
		protected.GET("/dashboard/stats", h.Dashboard.GetStats)
		protected.GET("/dashboard/recent-appointments", h.Dashboard.GetRecentAppointments)
		protected.GET("/dashboard/new-patients", h.Dashboard.GetNewPatients)
		protected.GET("/dashboard/reminders", h.Dashboard.GetReminders)
		protected.GET("/dashboard/chart", h.Dashboard.GetChartData)

		// Patients
		protected.GET("/patients", h.Patient.List)
		protected.POST("/patients", h.Patient.Create)
		protected.GET("/patients/stats", h.Patient.Stats)
		protected.GET("/patients/:id", h.Patient.GetByID)
		protected.PUT("/patients/:id", h.Patient.Update)
		protected.DELETE("/patients/:id", h.Patient.Delete)
		protected.GET("/patients/:id/appointments", h.Patient.GetAppointments)

		// Staff
		protected.GET("/staff", h.Staff.List)
		protected.POST("/staff", h.Staff.Create)
		protected.GET("/staff/top", h.Staff.GetTop)
		protected.GET("/staff/:id", h.Staff.GetByID)
		protected.PUT("/staff/:id", h.Staff.Update)
		protected.DELETE("/staff/:id", h.Staff.Delete)

		// Nurses
		protected.GET("/nurses", h.Nurse.List)
		protected.POST("/nurses", h.Nurse.Create)
		protected.GET("/nurses/:id", h.Nurse.GetByID)
		protected.PUT("/nurses/:id", h.Nurse.Update)
		protected.DELETE("/nurses/:id", h.Nurse.Delete)

		// Rooms
		protected.GET("/rooms", h.Room.List)
		protected.POST("/rooms", h.Room.Create)
		protected.GET("/rooms/stats", h.Room.Stats)
		protected.GET("/rooms/:id", h.Room.GetByID)
		protected.PUT("/rooms/:id", h.Room.Update)
		protected.DELETE("/rooms/:id", h.Room.Delete)

		// Appointments
		protected.GET("/appointments", h.Appointment.List)
		protected.POST("/appointments", h.Appointment.Create)
		protected.GET("/appointments/today", h.Appointment.Today)
		protected.GET("/appointments/calendar", h.Appointment.Calendar)
		protected.GET("/appointments/:id", h.Appointment.GetByID)
		protected.PUT("/appointments/:id", h.Appointment.Update)
		protected.DELETE("/appointments/:id", h.Appointment.Delete)
		protected.PUT("/appointments/:id/complete", h.Appointment.Complete)
		protected.PUT("/appointments/:id/start", h.Appointment.Start)

		// Finance
		protected.GET("/finance/income", h.Finance.ListIncome)
		protected.POST("/finance/income", h.Finance.CreateIncome)
		protected.GET("/finance/expenses", h.Finance.ListExpenses)
		protected.POST("/finance/expenses", h.Finance.CreateExpense)
		protected.GET("/finance/summary", h.Finance.Summary)
		protected.GET("/finance/chart", h.Finance.Chart)
		protected.GET("/finance/expense-breakdown", h.Finance.ExpenseBreakdown)

		// Warehouse
		protected.GET("/warehouse", h.Warehouse.List)
		protected.POST("/warehouse", h.Warehouse.Create)
		protected.GET("/warehouse/low-stock", h.Warehouse.LowStock)
		protected.GET("/warehouse/:id", h.Warehouse.GetByID)
		protected.PUT("/warehouse/:id", h.Warehouse.Update)
		protected.DELETE("/warehouse/:id", h.Warehouse.Delete)
		protected.POST("/warehouse/restock", h.Warehouse.Restock)

		// Notifications
		protected.GET("/notifications", h.Notification.List)
		protected.POST("/notifications", h.Notification.Create)
		protected.PUT("/notifications/read-all", h.Notification.MarkAllRead)
		protected.GET("/notifications/unread-count", h.Notification.UnreadCount)
		protected.PUT("/notifications/:id/read", h.Notification.MarkRead)
		protected.DELETE("/notifications/:id", h.Notification.Delete)

		// Salaries
		protected.GET("/salaries", h.Salary.List)
		protected.POST("/salaries", h.Salary.Create)
		protected.PUT("/salaries/:id/pay", h.Salary.Pay)

		// Reports
		protected.GET("/reports/attendance", h.Report.GetAttendance)
		protected.GET("/reports/revenue", h.Report.GetRevenue)
		protected.GET("/reports/popular-treatments", h.Report.GetPopularTreatments)
		protected.GET("/reports/staff-performance", h.Report.GetStaffPerformance)

		// Chat REST
		protected.GET("/chat/messages", h.Chat.GetMessages)
		protected.GET("/chat/rooms", h.Chat.GetRooms)
		protected.GET("/chat/users", h.Chat.GetUsers)

		// Users (admin)
		protected.GET("/users", h.Auth.ListUsers)
		protected.PUT("/users/:id/toggle", h.Auth.ToggleUser)
	}

	// WebSocket endpoint
	r.GET("/api/chat/ws", middleware.AuthMiddleware(), h.Chat.WebSocket)

	log.Printf("Hospital Management System API starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func seedInitialData(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		return
	}

	log.Println("Seeding initial data...")

	// Create superadmin
	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	admin := models.User{
		Email:    "admin@hospital.com",
		Password: string(hash),
		Role:     "superadmin",
		Name:     "Super Administrator",
		Phone:    "+1 800 000-0000",
		Active:   true,
	}
	db.Create(&admin)

	// Create doctor users and staff records
	doctors := []struct {
		name   string
		spec   string
		email  string
		phone  string
		rating float64
		salary float64
		dept   string
		appts  int
	}{
		{"Dr. Ivan Petrov", "Surgery", "doctor1@hospital.com", "+1 999 123-4567", 4.9, 8000, "Surgery", 24},
		{"Dr. Anna Smirnova", "Therapy", "doctor2@hospital.com", "+1 999 234-5678", 4.8, 6500, "General Medicine", 20},
		{"Dr. Dmitry Volkov", "Cardiology", "doctor3@hospital.com", "+1 999 345-6789", 4.7, 7000, "Cardiology", 16},
		{"Dr. Alexey Kuznetsov", "Neurology", "doctor4@hospital.com", "+1 999 456-7890", 4.6, 6000, "Neurology", 12},
		{"Dr. Maria Ivanova", "Ophthalmology", "doctor5@hospital.com", "+1 999 567-8901", 4.5, 5500, "Ophthalmology", 8},
		{"Dr. Sergey Popov", "Urology", "doctor6@hospital.com", "+1 999 678-9012", 4.3, 5800, "Urology", 6},
	}

	for _, d := range doctors {
		pw, _ := bcrypt.GenerateFromPassword([]byte("doctor123"), bcrypt.DefaultCost)
		user := models.User{
			Email:    d.email,
			Password: string(pw),
			Role:     "doctor",
			Name:     d.name,
			Phone:    d.phone,
			Active:   true,
		}
		db.Create(&user)
		staff := models.Staff{
			UserID:            user.ID,
			FullName:          d.name,
			Specialization:    d.spec,
			Phone:             d.phone,
			Email:             d.email,
			Rating:            d.rating,
			AppointmentsCount: d.appts,
			Salary:            d.salary,
			Department:        d.dept,
			Active:            true,
		}
		db.Create(&staff)
	}

	// Create nurses
	nurses := []struct {
		name  string
		dept  string
		email string
		phone string
	}{
		{"Natalie Johnson", "Surgery", "nurse1@hospital.com", "+1 999 111-2233"},
		{"Elena Williams", "Cardiology", "nurse2@hospital.com", "+1 999 222-3344"},
		{"Maria Davis", "Neurology", "nurse3@hospital.com", "+1 999 333-4455"},
		{"Anna Brown", "Ophthalmology", "nurse4@hospital.com", "+1 999 444-5566"},
		{"Tatiana Miller", "Urology", "nurse5@hospital.com", "+1 999 555-6677"},
	}

	for _, n := range nurses {
		pw, _ := bcrypt.GenerateFromPassword([]byte("nurse123"), bcrypt.DefaultCost)
		user := models.User{
			Email:    n.email,
			Password: string(pw),
			Role:     "nurse",
			Name:     n.name,
			Phone:    n.phone,
			Active:   true,
		}
		db.Create(&user)
		nurse := models.Nurse{
			UserID:     user.ID,
			FullName:   n.name,
			Department: n.dept,
			Phone:      n.phone,
			Email:      n.email,
			Active:     true,
		}
		db.Create(&nurse)
	}

	// Create rooms
	rooms := []struct {
		number string
		name   string
		rtype  string
		floor  int
		cap    int
		status string
	}{
		{"101", "Therapy Room 1", "therapy", 1, 1, "free"},
		{"102", "Surgery Room", "surgery", 1, 1, "occupied"},
		{"103", "Ultrasound Room", "uzi", 1, 1, "free"},
		{"104", "Ophthalmology", "ophthalmology", 1, 1, "occupied"},
		{"105", "Neurology Room", "neurology", 1, 1, "free"},
		{"201", "Therapy Room 2", "therapy", 2, 1, "free"},
		{"202", "Operating Room 1", "surgery", 2, 1, "occupied"},
		{"203", "Cardiology", "cardiology", 2, 1, "free"},
		{"204", "Ultrasound Room 2", "uzi", 2, 1, "maintenance"},
		{"205", "Urology", "urology", 2, 1, "free"},
		{"301", "Ward 1", "ward", 3, 4, "occupied"},
		{"302", "Ward 2", "ward", 3, 4, "free"},
	}

	for _, rm := range rooms {
		room := models.Room{
			Number:   rm.number,
			Name:     rm.name,
			Type:     rm.rtype,
			Floor:    rm.floor,
			Capacity: rm.cap,
			Status:   rm.status,
		}
		db.Create(&room)
	}

	// Create patients
	now := time.Now()
	patientsData := []struct {
		name      string
		phone     string
		dob       time.Time
		gender    string
		blood     string
		allergies string
	}{
		{"Sergey Ivanov", "+1 999 123-4567", time.Date(1985, 5, 15, 0, 0, 0, 0, time.UTC), "male", "II+", "None"},
		{"Alexey Petrov", "+1 999 234-5678", time.Date(1990, 3, 22, 0, 0, 0, 0, time.UTC), "male", "I+", "Penicillin"},
		{"Mikhail Sidorov", "+1 999 345-6789", time.Date(1975, 8, 10, 0, 0, 0, 0, time.UTC), "male", "III+", "None"},
		{"Anna Kozlova", "+1 999 456-7890", time.Date(1995, 11, 5, 0, 0, 0, 0, time.UTC), "female", "I-", "Aspirin"},
		{"Oleg Vasiliev", "+1 999 567-8901", time.Date(1988, 2, 28, 0, 0, 0, 0, time.UTC), "male", "IV+", "None"},
		{"Andrey Smirnov", "+1 999 111-2222", time.Date(1992, 7, 14, 0, 0, 0, 0, time.UTC), "male", "II-", "None"},
		{"Olga Kuznetsova", "+1 999 222-3333", time.Date(1987, 4, 19, 0, 0, 0, 0, time.UTC), "female", "III-", "None"},
		{"Dmitry Popov", "+1 999 333-4444", time.Date(1998, 9, 3, 0, 0, 0, 0, time.UTC), "male", "I+", "None"},
		{"Elena Vorobyova", "+1 999 444-5555", time.Date(1983, 12, 25, 0, 0, 0, 0, time.UTC), "female", "II+", "None"},
		{"Igor Sokolov", "+1 999 555-6666", time.Date(2000, 6, 8, 0, 0, 0, 0, time.UTC), "male", "IV-", "None"},
	}

	createdPatients := make([]models.Patient, 0)
	for _, p := range patientsData {
		patient := models.Patient{
			FullName:    p.name,
			Phone:       p.phone,
			DateOfBirth: p.dob,
			Gender:      p.gender,
			BloodType:   p.blood,
			Allergies:   p.allergies,
		}
		db.Create(&patient)
		createdPatients = append(createdPatients, patient)
	}

	// Create appointments
	var staffList []models.Staff
	db.Find(&staffList)

	problems := []string{"Back pain", "High blood pressure", "Heart palpitations", "Headache", "Vision check", "Consultation", "Knee pain", "Stomach ache"}
	statuses := []string{"completed", "completed", "completed", "scheduled", "scheduled", "cancelled"}
	payments := []float64{150, 120, 200, 100, 90, 110, 180, 95}

	for i := 0; i < 20; i++ {
		patient := createdPatients[i%len(createdPatients)]
		staff := staffList[i%len(staffList)]
		dt := now.Add(-time.Duration(i*2) * time.Hour)
		if i < 5 {
			dt = now.Add(time.Duration(i+1) * time.Hour)
		}
		status := statuses[i%len(statuses)]
		payment := payments[i%len(payments)]
		if status == "scheduled" || status == "cancelled" {
			payment = 0
		}
		appt := models.Appointment{
			PatientID: patient.ID,
			StaffID:   staff.ID,
			DateTime:  dt,
			Duration:  30,
			Problem:   problems[i%len(problems)],
			Payment:   payment,
			Status:    status,
		}
		db.Create(&appt)

		// Add corresponding income for completed appointments
		if status == "completed" {
			income := models.Income{
				Source:    "appointment",
				Amount:    payment,
				PatientID: &patient.ID,
				StaffID:   &staff.ID,
				Date:      dt,
				Notes:     appt.Problem,
			}
			db.Create(&income)
		}
	}

	// Create expense records for last 3 months
	expenseCategories := []struct {
		cat    string
		amount float64
	}{
		{"salary", 25000},
		{"rent", 8000},
		{"electricity", 2500},
		{"water", 1200},
		{"internet", 800},
		{"other", 3450},
	}
	for _, e := range expenseCategories {
		for m := 0; m < 3; m++ {
			expense := models.Expense{
				Category: e.cat,
				Amount:   e.amount,
				Date:     now.AddDate(0, -m, 0),
			}
			db.Create(&expense)
		}
	}

	// Create warehouse items
	items := []struct {
		name     string
		cat      string
		qty      int
		price    float64
		supplier string
		minStock int
		unit     string
	}{
		{"Syringes 5ml", "consumable", 250, 0.50, "MedSupply LLC", 50, "pcs"},
		{"Medical Gloves (M)", "consumable", 300, 0.15, "MedSupply LLC", 100, "pcs"},
		{"Face Masks", "consumable", 200, 0.60, "MedSupply LLC", 50, "pcs"},
		{"Hand Sanitizer 500ml", "medicine", 100, 8.00, "MedSupply LLC", 20, "bottle"},
		{"Adhesive Bandage", "consumable", 200, 0.12, "MedSupply LLC", 30, "pcs"},
		{"Ibuprofen 200mg", "medicine", 150, 0.25, "PharmaDist", 30, "tab"},
		{"Digital Blood Pressure Monitor", "equipment", 5, 350.00, "MedTech Corp", 2, "pcs"},
		{"Stethoscope Professional", "equipment", 8, 250.00, "MedTech Corp", 3, "pcs"},
		{"Thermometer Digital", "consumable", 15, 12.00, "MedSupply LLC", 5, "pcs"},
		{"Cotton Wool 500g", "consumable", 8, 3.50, "MedSupply LLC", 10, "pack"},
	}

	expiry := now.AddDate(2, 0, 0)
	for _, item := range items {
		wi := models.WarehouseItem{
			Name:         item.name,
			Category:     item.cat,
			Quantity:     item.qty,
			Unit:         item.unit,
			Price:        item.price,
			Supplier:     item.supplier,
			PurchaseDate: now.AddDate(0, -1, 0),
			ExpiryDate:   &expiry,
			MinStock:     item.minStock,
		}
		db.Create(&wi)
	}

	// Create salary records for current staff
	for _, s := range staffList {
		salary := models.Salary{
			StaffID: s.ID,
			Amount:  s.Salary,
			Month:   time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC),
			Paid:    false,
		}
		db.Create(&salary)
	}

	// Create notifications for admin
	notifications := []struct {
		title string
		body  string
		ntype string
	}{
		{"New Appointment", "Sergey Ivanov scheduled an appointment with Dr. Petrov", "info"},
		{"Payment Received", "$150 payment received from Alexey Petrov", "success"},
		{"Low Stock Alert", "Hand Sanitizer below minimum stock level", "warning"},
		{"Expense Added", "Electricity bill — $2,500", "info"},
		{"System Ready", "Hospital Management System is fully operational", "success"},
	}
	for _, n := range notifications {
		notif := models.Notification{
			UserID: admin.ID,
			Title:  n.title,
			Body:   n.body,
			Type:   n.ntype,
		}
		db.Create(&notif)
	}

	// Create patient reminders
	remindersData := []struct {
		problem  string
		reminder string
	}{
		{"Back pain", "Follow-up appointment needed"},
		{"Hypertension", "Blood pressure check required"},
		{"Vision problems", "Eye examination due"},
		{"Heart palpitations", "Treatment monitoring required"},
	}
	for i, rem := range remindersData {
		if i >= len(createdPatients) {
			break
		}
		dueDate := now.AddDate(0, 0, 7)
		last := now.AddDate(0, 0, -14)
		reminder := models.PatientReminder{
			PatientID:       createdPatients[i].ID,
			LastAppointment: last,
			Problem:         rem.problem,
			Reminder:        rem.reminder,
			DueDate:         dueDate,
		}
		db.Create(&reminder)
	}

	log.Println("Initial data seeded successfully")
	log.Printf("Admin login: admin@hospital.com / admin123")
	log.Printf("Doctor login: doctor1@hospital.com / doctor123")
	log.Printf("Nurse login: nurse1@hospital.com / nurse123")
}
