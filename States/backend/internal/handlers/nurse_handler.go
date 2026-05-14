package handlers

import (
	"net/http"

	"hospital-backend/internal/models"
	"hospital-backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NurseHandler struct {
	nurseRepo *repository.NurseRepository
}

func NewNurseHandler(nurseRepo *repository.NurseRepository) *NurseHandler {
	return &NurseHandler{nurseRepo: nurseRepo}
}

// GET /api/nurses
func (h *NurseHandler) List(c *gin.Context) {
	search := c.Query("search")
	page, limit := parsePage(c)

	nurses, total, err := h.nurseRepo.List(search, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nurses"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  nurses,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// POST /api/nurses
func (h *NurseHandler) Create(c *gin.Context) {
	var n models.Nurse
	if err := c.ShouldBindJSON(&n); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	n.ID = uuid.New()
	n.Active = true
	if err := h.nurseRepo.Create(&n); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create nurse"})
		return
	}

	c.JSON(http.StatusCreated, n)
}

// GET /api/nurses/:id
func (h *NurseHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nurse ID"})
		return
	}

	n, err := h.nurseRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nurse not found"})
		return
	}

	c.JSON(http.StatusOK, n)
}

// PUT /api/nurses/:id
func (h *NurseHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nurse ID"})
		return
	}

	n, err := h.nurseRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nurse not found"})
		return
	}

	if err := c.ShouldBindJSON(n); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	n.ID = id

	if err := h.nurseRepo.Update(n); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update nurse"})
		return
	}

	c.JSON(http.StatusOK, n)
}

// DELETE /api/nurses/:id
func (h *NurseHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nurse ID"})
		return
	}

	if err := h.nurseRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete nurse"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Nurse deleted successfully"})
}
