package handlers

import (
	"net/http"
	"time"

	"hospital-backend/internal/models"
	"hospital-backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type WarehouseHandler struct {
	warehouseRepo *repository.WarehouseRepository
}

func NewWarehouseHandler(warehouseRepo *repository.WarehouseRepository) *WarehouseHandler {
	return &WarehouseHandler{warehouseRepo: warehouseRepo}
}

// GET /api/warehouse
func (h *WarehouseHandler) List(c *gin.Context) {
	search := c.Query("search")
	category := c.Query("category")
	page, limit := parsePage(c)

	items, total, err := h.warehouseRepo.List(search, category, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch warehouse items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// POST /api/warehouse
func (h *WarehouseHandler) Create(c *gin.Context) {
	var item models.WarehouseItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item.ID = uuid.New()
	if item.PurchaseDate.IsZero() {
		item.PurchaseDate = time.Now()
	}

	if err := h.warehouseRepo.Create(&item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create warehouse item"})
		return
	}

	c.JSON(http.StatusCreated, item)
}

// GET /api/warehouse/:id
func (h *WarehouseHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	item, err := h.warehouseRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// PUT /api/warehouse/:id
func (h *WarehouseHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	item, err := h.warehouseRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}

	if err := c.ShouldBindJSON(item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.ID = id

	if err := h.warehouseRepo.Update(item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update item"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// DELETE /api/warehouse/:id
func (h *WarehouseHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	if err := h.warehouseRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item deleted successfully"})
}

// GET /api/warehouse/low-stock
func (h *WarehouseHandler) LowStock(c *gin.Context) {
	items, err := h.warehouseRepo.GetLowStock()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch low stock items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  items,
		"total": len(items),
	})
}

// POST /api/warehouse/restock
func (h *WarehouseHandler) Restock(c *gin.Context) {
	var req struct {
		ItemID   string `json:"item_id" binding:"required"`
		Quantity int    `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := uuid.Parse(req.ItemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	if err := h.warehouseRepo.AddStock(id, req.Quantity); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restock item"})
		return
	}

	item, _ := h.warehouseRepo.FindByID(id)
	c.JSON(http.StatusOK, gin.H{
		"message": "Stock updated successfully",
		"item":    item,
	})
}
