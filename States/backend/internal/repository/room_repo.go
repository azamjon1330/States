package repository

import (
	"hospital-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoomRepository struct {
	db *gorm.DB
}

func NewRoomRepository(db *gorm.DB) *RoomRepository {
	return &RoomRepository{db: db}
}

func (r *RoomRepository) Create(room *models.Room) error {
	return r.db.Create(room).Error
}

func (r *RoomRepository) FindByID(id uuid.UUID) (*models.Room, error) {
	var room models.Room
	err := r.db.Where("id = ?", id).First(&room).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *RoomRepository) List(status, roomType string, page, limit int) ([]models.Room, int64, error) {
	var rooms []models.Room
	var total int64

	q := r.db.Model(&models.Room{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if roomType != "" {
		q = q.Where("type = ?", roomType)
	}

	q.Count(&total)
	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("floor ASC, number ASC").Find(&rooms).Error
	return rooms, total, err
}

func (r *RoomRepository) Update(room *models.Room) error {
	return r.db.Save(room).Error
}

func (r *RoomRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Room{}, "id = ?", id).Error
}

type RoomStatusStats struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

func (r *RoomRepository) CountByStatus() ([]RoomStatusStats, error) {
	var stats []RoomStatusStats
	err := r.db.Model(&models.Room{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&stats).Error
	return stats, err
}

func (r *RoomRepository) CountOccupied() (int64, error) {
	var count int64
	err := r.db.Model(&models.Room{}).Where("status = ?", "occupied").Count(&count).Error
	return count, err
}

func (r *RoomRepository) CountTotal() (int64, error) {
	var count int64
	err := r.db.Model(&models.Room{}).Count(&count).Error
	return count, err
}
