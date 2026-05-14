package handlers

import (
	"net/http"

	"hospital-backend/internal/models"
	"hospital-backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SalaryHandler struct {
	salaryRepo *repository.SalaryRepository
	staffRepo  *repository.StaffRepository
}

func NewSalaryHandler(salaryRepo *repository.SalaryRepository, staffRepo *repository.StaffRepository) *SalaryHandler {
	return &SalaryHandler{salaryRepo: salaryRepo, staffRepo: staffRepo}
}

// GET /api/salaries
func (h *SalaryHandler) List(c *gin.Context) {
	page, limit := parsePage(c)
	salaries, total, err := h.salaryRepo.List(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch salaries"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  salaries,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// POST /api/salaries
func (h *SalaryHandler) Create(c *gin.Context) {
	var salary models.Salary
	if err := c.ShouldBindJSON(&salary); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	salary.ID = uuid.New()
	if err := h.salaryRepo.Create(&salary); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create salary record"})
		return
	}

	c.JSON(http.StatusCreated, salary)
}

// PUT /api/salaries/:id/pay
func (h *SalaryHandler) Pay(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid salary ID"})
		return
	}

	if err := h.salaryRepo.MarkPaid(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark salary as paid"})
		return
	}

	salary, _ := h.salaryRepo.FindByID(id)
	c.JSON(http.StatusOK, gin.H{
		"message": "Salary marked as paid",
		"salary":  salary,
	})
}
