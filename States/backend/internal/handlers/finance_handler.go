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

type FinanceHandler struct {
	incomeRepo  *repository.IncomeRepository
	expenseRepo *repository.ExpenseRepository
}

func NewFinanceHandler(incomeRepo *repository.IncomeRepository, expenseRepo *repository.ExpenseRepository) *FinanceHandler {
	return &FinanceHandler{incomeRepo: incomeRepo, expenseRepo: expenseRepo}
}

// GET /api/finance/income
func (h *FinanceHandler) ListIncome(c *gin.Context) {
	page, limit := parsePage(c)
	incomes, total, err := h.incomeRepo.List(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch income records"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  incomes,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// POST /api/finance/income
func (h *FinanceHandler) CreateIncome(c *gin.Context) {
	var inc models.Income
	if err := c.ShouldBindJSON(&inc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	inc.ID = uuid.New()
	if inc.Date.IsZero() {
		inc.Date = time.Now()
	}

	if err := h.incomeRepo.Create(&inc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create income record"})
		return
	}

	c.JSON(http.StatusCreated, inc)
}

// GET /api/finance/expenses
func (h *FinanceHandler) ListExpenses(c *gin.Context) {
	page, limit := parsePage(c)
	expenses, total, err := h.expenseRepo.List(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expense records"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  expenses,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// POST /api/finance/expenses
func (h *FinanceHandler) CreateExpense(c *gin.Context) {
	var exp models.Expense
	if err := c.ShouldBindJSON(&exp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	exp.ID = uuid.New()
	if exp.Date.IsZero() {
		exp.Date = time.Now()
	}

	if err := h.expenseRepo.Create(&exp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create expense record"})
		return
	}

	c.JSON(http.StatusCreated, exp)
}

// GET /api/finance/summary
func (h *FinanceHandler) Summary(c *gin.Context) {
	totalRevenue, err := h.incomeRepo.GetTotal()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch revenue total"})
		return
	}

	totalExpenses, err := h.expenseRepo.GetTotal()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expense total"})
		return
	}

	// Current month
	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	monthEnd := monthStart.AddDate(0, 1, 0).Add(-time.Second)

	monthRevenue, _ := h.incomeRepo.GetTotalByPeriod(monthStart, monthEnd)
	monthExpenses, _ := h.expenseRepo.GetTotalByPeriod(monthStart, monthEnd)

	c.JSON(http.StatusOK, gin.H{
		"total_revenue":    totalRevenue,
		"total_expenses":   totalExpenses,
		"total_profit":     totalRevenue - totalExpenses,
		"month_revenue":    monthRevenue,
		"month_expenses":   monthExpenses,
		"month_profit":     monthRevenue - monthExpenses,
	})
}

// GET /api/finance/chart?period=7|30|90
func (h *FinanceHandler) Chart(c *gin.Context) {
	periodStr := c.DefaultQuery("period", "30")
	days, err := strconv.Atoi(periodStr)
	if err != nil || days <= 0 {
		days = 30
	}

	dailyIncome, err := h.incomeRepo.GetDailyByPeriod(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chart data"})
		return
	}

	dailyExpenses, err := h.expenseRepo.GetDailyByPeriod(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chart data"})
		return
	}

	// Build a unified timeline
	incomeMap := make(map[string]float64)
	for _, d := range dailyIncome {
		incomeMap[d.Date] = d.Amount
	}
	expenseMap := make(map[string]float64)
	for _, d := range dailyExpenses {
		expenseMap[d.Date] = d.Amount
	}

	// Generate date series
	type ChartPoint struct {
		Date    string  `json:"date"`
		Revenue float64 `json:"revenue"`
		Expense float64 `json:"expense"`
		Profit  float64 `json:"profit"`
	}

	var chartData []ChartPoint
	for i := days - 1; i >= 0; i-- {
		date := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
		rev := incomeMap[date]
		exp := expenseMap[date]
		chartData = append(chartData, ChartPoint{
			Date:    date,
			Revenue: rev,
			Expense: exp,
			Profit:  rev - exp,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"period": days,
		"data":   chartData,
	})
}

// GET /api/finance/expense-breakdown
func (h *FinanceHandler) ExpenseBreakdown(c *gin.Context) {
	breakdown, err := h.expenseRepo.GetByCategory()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expense breakdown"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": breakdown})
}
