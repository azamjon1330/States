package handlers

import (
	"net/http"
	"time"

	"hospital-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	repos *repository.Repositories
}

func NewReportHandler(repos *repository.Repositories) *ReportHandler {
	return &ReportHandler{repos: repos}
}

// GET /api/reports/attendance?period=&from=&to=
func (h *ReportHandler) GetAttendance(c *gin.Context) {
	from, to := parseDateRange(c)
	filter := repository.AppointmentFilter{
		DateFrom: from,
		DateTo:   to,
		Page:     1,
		Limit:    1000,
	}

	appointments, total, err := h.repos.Appointment.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attendance data"})
		return
	}

	// Group by date
	byDate := make(map[string]int)
	for _, a := range appointments {
		d := a.DateTime.Format("2006-01-02")
		byDate[d]++
	}

	type DayEntry struct {
		Date  string `json:"date"`
		Count int    `json:"count"`
	}
	var dailyData []DayEntry
	for d, cnt := range byDate {
		dailyData = append(dailyData, DayEntry{Date: d, Count: cnt})
	}

	c.JSON(http.StatusOK, gin.H{
		"total":      total,
		"daily_data": dailyData,
		"from":       from.Format("2006-01-02"),
		"to":         to.Format("2006-01-02"),
	})
}

// GET /api/reports/revenue?period=&from=&to=
func (h *ReportHandler) GetRevenue(c *gin.Context) {
	from, to := parseDateRange(c)

	totalRevenue, err := h.repos.Income.GetTotalByPeriod(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch revenue data"})
		return
	}

	totalExpenses, err := h.repos.Expense.GetTotalByPeriod(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expense data"})
		return
	}

	bySource, err := h.repos.Income.GetBySource()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch source breakdown"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_revenue":  totalRevenue,
		"total_expenses": totalExpenses,
		"profit":         totalRevenue - totalExpenses,
		"by_source":      bySource,
		"from":           from.Format("2006-01-02"),
		"to":             to.Format("2006-01-02"),
	})
}

// GET /api/reports/popular-treatments
func (h *ReportHandler) GetPopularTreatments(c *gin.Context) {
	filter := repository.AppointmentFilter{
		Status: "completed",
		Page:   1,
		Limit:  1000,
	}
	appointments, _, err := h.repos.Appointment.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch treatments"})
		return
	}

	// Count occurrences of treatments/problems
	treatmentCount := make(map[string]int)
	for _, a := range appointments {
		if a.Problem != "" {
			treatmentCount[a.Problem]++
		}
		if a.Diagnosis != "" && a.Diagnosis != a.Problem {
			treatmentCount[a.Diagnosis]++
		}
	}

	type TreatmentEntry struct {
		Name  string `json:"name"`
		Count int    `json:"count"`
	}
	var treatments []TreatmentEntry
	for name, cnt := range treatmentCount {
		treatments = append(treatments, TreatmentEntry{Name: name, Count: cnt})
	}

	// Sort by count
	for i := 0; i < len(treatments); i++ {
		for j := i + 1; j < len(treatments); j++ {
			if treatments[j].Count > treatments[i].Count {
				treatments[i], treatments[j] = treatments[j], treatments[i]
			}
		}
	}

	if len(treatments) > 10 {
		treatments = treatments[:10]
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  treatments,
		"total": len(treatments),
	})
}

// GET /api/reports/staff-performance
func (h *ReportHandler) GetStaffPerformance(c *gin.Context) {
	staff, _, err := h.repos.Staff.List("", 1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch staff data"})
		return
	}

	type StaffPerf struct {
		ID                string  `json:"id"`
		FullName          string  `json:"full_name"`
		Specialization    string  `json:"specialization"`
		AppointmentsCount int     `json:"appointments_count"`
		Rating            float64 `json:"rating"`
		Salary            float64 `json:"salary"`
	}

	var result []StaffPerf
	for _, s := range staff {
		result = append(result, StaffPerf{
			ID:                s.ID.String(),
			FullName:          s.FullName,
			Specialization:    s.Specialization,
			AppointmentsCount: s.AppointmentsCount,
			Rating:            s.Rating,
			Salary:            s.Salary,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  result,
		"total": len(result),
	})
}

func parseDateRange(c *gin.Context) (time.Time, time.Time) {
	now := time.Now()
	to := now

	fromStr := c.Query("from")
	toStr := c.Query("to")
	period := c.DefaultQuery("period", "month")

	var from time.Time
	if fromStr != "" {
		from, _ = time.Parse("2006-01-02", fromStr)
	}
	if toStr != "" {
		to, _ = time.Parse("2006-01-02", toStr)
		to = to.Add(24*time.Hour - time.Second)
	}

	if from.IsZero() {
		switch period {
		case "week":
			from = now.AddDate(0, 0, -7)
		case "year":
			from = now.AddDate(-1, 0, 0)
		default:
			from = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		}
	}

	return from, to
}
