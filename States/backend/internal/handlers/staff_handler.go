package handlers

import (
	"net/http"

	"hospital-backend/internal/models"
	"hospital-backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StaffHandler struct {
	staffRepo *repository.StaffRepository
}

func NewStaffHandler(staffRepo *repository.StaffRepository) *StaffHandler {
	return &StaffHandler{staffRepo: staffRepo}
}

// GET /api/staff
func (h *StaffHandler) List(c *gin.Context) {
	search := c.Query("search")
	page, limit := parsePage(c)

	staff, total, err := h.staffRepo.List(search, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch staff"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  staff,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// POST /api/staff
func (h *StaffHandler) Create(c *gin.Context) {
	var s models.Staff
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s.ID = uuid.New()
	s.Active = true
	if err := h.staffRepo.Create(&s); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create staff"})
		return
	}

	c.JSON(http.StatusCreated, s)
}

// GET /api/staff/:id
func (h *StaffHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid staff ID"})
		return
	}

	s, err := h.staffRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Staff not found"})
		return
	}

	c.JSON(http.StatusOK, s)
}

// PUT /api/staff/:id
func (h *StaffHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid staff ID"})
		return
	}

	s, err := h.staffRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Staff not found"})
		return
	}

	if err := c.ShouldBindJSON(s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	s.ID = id

	if err := h.staffRepo.Update(s); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update staff"})
		return
	}

	c.JSON(http.StatusOK, s)
}

// DELETE /api/staff/:id
func (h *StaffHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid staff ID"})
		return
	}

	if err := h.staffRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete staff"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Staff deleted successfully"})
}

// GET /api/staff/top
func (h *StaffHandler) GetTop(c *gin.Context) {
	limit := 5
	staff, err := h.staffRepo.GetTopByAppointments(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch top staff"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": staff})
}
