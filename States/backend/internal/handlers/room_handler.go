package handlers

import (
	"net/http"

	"hospital-backend/internal/models"
	"hospital-backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RoomHandler struct {
	roomRepo *repository.RoomRepository
}

func NewRoomHandler(roomRepo *repository.RoomRepository) *RoomHandler {
	return &RoomHandler{roomRepo: roomRepo}
}

// GET /api/rooms
func (h *RoomHandler) List(c *gin.Context) {
	status := c.Query("status")
	roomType := c.Query("type")
	page, limit := parsePage(c)

	rooms, total, err := h.roomRepo.List(status, roomType, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  rooms,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// POST /api/rooms
func (h *RoomHandler) Create(c *gin.Context) {
	var room models.Room
	if err := c.ShouldBindJSON(&room); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	room.ID = uuid.New()
	if room.Status == "" {
		room.Status = "free"
	}
	if err := h.roomRepo.Create(&room); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create room"})
		return
	}

	c.JSON(http.StatusCreated, room)
}

// GET /api/rooms/:id
func (h *RoomHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	room, err := h.roomRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	c.JSON(http.StatusOK, room)
}

// PUT /api/rooms/:id
func (h *RoomHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	room, err := h.roomRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	if err := c.ShouldBindJSON(room); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	room.ID = id

	if err := h.roomRepo.Update(room); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update room"})
		return
	}

	c.JSON(http.StatusOK, room)
}

// DELETE /api/rooms/:id
func (h *RoomHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	if err := h.roomRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Room deleted successfully"})
}

// GET /api/rooms/stats
func (h *RoomHandler) Stats(c *gin.Context) {
	stats, err := h.roomRepo.CountByStatus()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch room stats"})
		return
	}

	total, _ := h.roomRepo.CountTotal()
	occupied, _ := h.roomRepo.CountOccupied()

	occupancyRate := 0.0
	if total > 0 {
		occupancyRate = float64(occupied) / float64(total) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"by_status":      stats,
		"total":          total,
		"occupied":       occupied,
		"occupancy_rate": occupancyRate,
	})
}
