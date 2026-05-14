package handlers

import (
	"net/http"
	"time"

	"hospital-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	repos *repository.Repositories
}

func NewDashboardHandler(repos *repository.Repositories) *DashboardHandler {
	return &DashboardHandler{repos: repos}
}

// GET /api/dashboard/stats
func (h *DashboardHandler) GetStats(c *gin.Context) {
	now := time.Now()

	patientsToday, _ := h.repos.Patient.CountToday()
	totalPatients, _ := h.repos.Patient.Count()

	apptToday, _ := h.repos.Appointment.CountToday()
	totalAppt, _ := h.repos.Appointment.Count()

	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	monthEnd := monthStart.AddDate(0, 1, 0).Add(-time.Second)

	revenueMonth, _ := h.repos.Income.GetTotalByPeriod(monthStart, monthEnd)
	expenseMonth, _ := h.repos.Expense.GetTotalByPeriod(monthStart, monthEnd)
	totalRevenue, _ := h.repos.Income.GetTotal()
	totalExpenses, _ := h.repos.Expense.GetTotal()

	totalStaff, _ := h.repos.Staff.Count()
	totalNurses, _ := h.repos.Nurse.Count()

	roomStats, _ := h.repos.Room.CountByStatus()
	totalRooms, _ := h.repos.Room.CountTotal()
	occupiedRooms, _ := h.repos.Room.CountOccupied()

	occupancyRate := 0.0
	if totalRooms > 0 {
		occupancyRate = float64(occupiedRooms) / float64(totalRooms) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"patients_today":  patientsToday,
		"total_patients":  totalPatients,
		"appointments_today": apptToday,
		"total_appointments": totalAppt,
		"revenue_month":   revenueMonth,
		"expense_month":   expenseMonth,
		"profit_month":    revenueMonth - expenseMonth,
		"total_revenue":   totalRevenue,
		"total_expenses":  totalExpenses,
		"total_profit":    totalRevenue - totalExpenses,
		"total_staff":     totalStaff,
		"total_nurses":    totalNurses,
		"room_stats":      roomStats,
		"total_rooms":     totalRooms,
		"occupied_rooms":  occupiedRooms,
		"occupancy_rate":  occupancyRate,
	})
}

// GET /api/dashboard/recent-appointments
func (h *DashboardHandler) GetRecentAppointments(c *gin.Context) {
	appointments, err := h.repos.Appointment.GetRecent(10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recent appointments"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": appointments})
}

// GET /api/dashboard/new-patients
func (h *DashboardHandler) GetNewPatients(c *gin.Context) {
	patients, err := h.repos.Patient.GetRecent(10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch new patients"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": patients})
}

// GET /api/dashboard/reminders
func (h *DashboardHandler) GetReminders(c *gin.Context) {
	reminders, err := h.repos.Reminder.GetUpcoming(10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reminders"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": reminders})
}

// GET /api/dashboard/chart?days=7|30|90
func (h *DashboardHandler) GetChartData(c *gin.Context) {
	days := 30
	switch c.DefaultQuery("days", "30") {
	case "7":
		days = 7
	case "90":
		days = 90
	}

	stats, err := h.repos.Appointment.GetDailyStats(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chart data"})
		return
	}

	topStaff, _, err := h.repos.Staff.List("", 1, 5)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch top staff"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"daily_stats": stats,
		"top_staff":   topStaff,
	})
}
