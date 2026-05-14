package repository

import (
	"hospital-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) Create(n *models.Notification) error {
	return r.db.Create(n).Error
}

func (r *NotificationRepository) List(userID uuid.UUID, page, limit int) ([]models.Notification, int64, error) {
	var notifications []models.Notification
	var total int64

	q := r.db.Model(&models.Notification{}).Where("user_id = ?", userID)
	q.Count(&total)

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("created_at DESC").Find(&notifications).Error
	return notifications, total, err
}

func (r *NotificationRepository) MarkRead(id uuid.UUID) error {
	return r.db.Model(&models.Notification{}).
		Where("id = ?", id).
		Update("read", true).Error
}

func (r *NotificationRepository) MarkAllRead(userID uuid.UUID) error {
	return r.db.Model(&models.Notification{}).
		Where("user_id = ? AND read = false", userID).
		Update("read", true).Error
}

func (r *NotificationRepository) CountUnread(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Notification{}).
		Where("user_id = ? AND read = false", userID).
		Count(&count).Error
	return count, err
}

func (r *NotificationRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Notification{}, "id = ?", id).Error
}
