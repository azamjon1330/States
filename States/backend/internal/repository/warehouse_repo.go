package repository

import (
	"hospital-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WarehouseRepository struct {
	db *gorm.DB
}

func NewWarehouseRepository(db *gorm.DB) *WarehouseRepository {
	return &WarehouseRepository{db: db}
}

func (r *WarehouseRepository) Create(item *models.WarehouseItem) error {
	return r.db.Create(item).Error
}

func (r *WarehouseRepository) FindByID(id uuid.UUID) (*models.WarehouseItem, error) {
	var item models.WarehouseItem
	err := r.db.Where("id = ?", id).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *WarehouseRepository) List(search, category string, page, limit int) ([]models.WarehouseItem, int64, error) {
	var items []models.WarehouseItem
	var total int64

	q := r.db.Model(&models.WarehouseItem{})
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("name ILIKE ? OR supplier ILIKE ?", like, like)
	}
	if category != "" {
		q = q.Where("category = ?", category)
	}

	q.Count(&total)
	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("name ASC").Find(&items).Error
	return items, total, err
}

func (r *WarehouseRepository) Update(item *models.WarehouseItem) error {
	return r.db.Save(item).Error
}

func (r *WarehouseRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.WarehouseItem{}, "id = ?", id).Error
}

func (r *WarehouseRepository) GetLowStock() ([]models.WarehouseItem, error) {
	var items []models.WarehouseItem
	err := r.db.Where("quantity <= min_stock").Order("quantity ASC").Find(&items).Error
	return items, err
}

func (r *WarehouseRepository) AddStock(id uuid.UUID, qty int) error {
	return r.db.Model(&models.WarehouseItem{}).
		Where("id = ?", id).
		UpdateColumn("quantity", gorm.Expr("quantity + ?", qty)).Error
}
