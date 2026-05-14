package handlers

import (
	"net/http"
	"strconv"
	"time"

	"hospital-backend/internal/models"
	"hospital-backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AppointmentHandler struct {
	appointmentRepo *repository.AppointmentRepository
	staffRepo       *repository.StaffRepository
}

func NewAppointmentHandler(appointmentRepo *repository.AppointmentRepository, staffRepo *repository.StaffRepository) *AppointmentHandler {
	return &AppointmentHandler{appointmentRepo: appointmentRepo, staffRepo: staffRepo}
}

// GET /api/appointments
func (h *AppointmentHandler) List(c *gin.Context) {
	page, limit := parsePage(c)

	var dateFrom, dateTo time.Time
	if df := c.Query("date_from"); df != "" {
		dateFrom, _ = time.Parse("2006-01-02", df)
	}
	if dt := c.Query("date_to"); dt != "" {
		dateTo, _ = time.Parse("2006-01-02", dt)
		dateTo = dateTo.Add(24*time.Hour - time.Second)
	}

	filter := repository.AppointmentFilter{
		StaffID:   c.Query("staff_id"),
		PatientID: c.Query("patient_id"),
		Status:    c.Query("status"),
		DateFrom:  dateFrom,
		DateTo:    dateTo,
		Page:      page,
		Limit:     limit,
	}

	appointments, total, err := h.appointmentRepo.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  appointments,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// POST /api/appointments
func (h *AppointmentHandler) Create(c *gin.Context) {
	var a models.Appointment
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	a.ID = uuid.New()
	if a.Status == "" {
		a.Status = "scheduled"
	}
	if a.Duration == 0 {
		a.Duration = 30
	}

	if err := h.appointmentRepo.Create(&a); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create appointment"})
		return
	}

	// Increment staff appointment count
	h.staffRepo.IncrementAppointments(a.StaffID)

	// Re-fetch with relations
	created, err := h.appointmentRepo.FindByID(a.ID)
	if err != nil {
		c.JSON(http.StatusCreated, a)
		return
	}

	c.JSON(http.StatusCreated, created)
}

// GET /api/appointments/:id
func (h *AppointmentHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	a, err := h.appointmentRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	c.JSON(http.StatusOK, a)
}

// PUT /api/appointments/:id
func (h *AppointmentHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	a, err := h.appointmentRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	if err := c.ShouldBindJSON(a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	a.ID = id

	if err := h.appointmentRepo.Update(a); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment"})
		return
	}

	c.JSON(http.StatusOK, a)
}

// DELETE /api/appointments/:id
func (h *AppointmentHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	if err := h.appointmentRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete appointment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment deleted successfully"})
}

// PUT /api/appointments/:id/complete
func (h *AppointmentHandler) Complete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	a, err := h.appointmentRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	var req struct {
		Diagnosis string  `json:"diagnosis"`
		Treatment string  `json:"treatment"`
		Notes     string  `json:"notes"`
		Payment   float64 `json:"payment"`
	}
	c.ShouldBindJSON(&req)

	a.Status = "completed"
	if req.Diagnosis != "" {
		a.Diagnosis = req.Diagnosis
	}
	if req.Treatment != "" {
		a.Treatment = req.Treatment
	}
	if req.Notes != "" {
		a.Notes = req.Notes
	}
	if req.Payment > 0 {
		a.Payment = req.Payment
	}

	if err := h.appointmentRepo.Update(a); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete appointment"})
		return
	}

	c.JSON(http.StatusOK, a)
}

// PUT /api/appointments/:id/start
func (h *AppointmentHandler) Start(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	a, err := h.appointmentRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	a.Status = "active"
	if err := h.appointmentRepo.Update(a); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start appointment"})
		return
	}

	c.JSON(http.StatusOK, a)
}

// GET /api/appointments/today
func (h *AppointmentHandler) Today(c *gin.Context) {
	appointments, err := h.appointmentRepo.GetToday()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch today's appointments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  appointments,
		"total": len(appointments),
	})
}

// GET /api/appointments/calendar?month=&year=
func (h *AppointmentHandler) Calendar(c *gin.Context) {
	yearStr := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))
	monthStr := c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month())))

	year, _ := strconv.Atoi(yearStr)
	month, _ := strconv.Atoi(monthStr)

	if year == 0 {
		year = time.Now().Year()
	}
	if month == 0 {
		month = int(time.Now().Month())
	}

	appointments, err := h.appointmentRepo.GetByMonth(year, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch calendar appointments"})
		return
	}

	// Group by date
	calendar := make(map[string][]models.Appointment)
	for _, a := range appointments {
		dateKey := a.DateTime.Format("2006-01-02")
		calendar[dateKey] = append(calendar[dateKey], a)
	}

	c.JSON(http.StatusOK, gin.H{
		"year":     year,
		"month":    month,
		"calendar": calendar,
		"total":    len(appointments),
	})
}
