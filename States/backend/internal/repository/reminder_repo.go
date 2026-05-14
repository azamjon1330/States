package repository

import (
	"hospital-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReminderRepository struct {
	db *gorm.DB
}

func NewReminderRepository(db *gorm.DB) *ReminderRepository {
	return &ReminderRepository{db: db}
}

func (r *ReminderRepository) Create(rem *models.PatientReminder) error {
	return r.db.Create(rem).Error
}

func (r *ReminderRepository) FindByID(id uuid.UUID) (*models.PatientReminder, error) {
	var rem models.PatientReminder
	err := r.db.Preload("Patient").Where("id = ?", id).First(&rem).Error
	if err != nil {
		return nil, err
	}
	return &rem, nil
}

func (r *ReminderRepository) List(page, limit int) ([]models.PatientReminder, int64, error) {
	var reminders []models.PatientReminder
	var total int64

	r.db.Model(&models.PatientReminder{}).Count(&total)
	offset := (page - 1) * limit
	err := r.db.Preload("Patient").
		Offset(offset).Limit(limit).
		Order("due_date ASC").
		Find(&reminders).Error
	return reminders, total, err
}

func (r *ReminderRepository) GetUpcoming(limit int) ([]models.PatientReminder, error) {
	var reminders []models.PatientReminder
	err := r.db.Preload("Patient").
		Where("due_date >= NOW()").
		Order("due_date ASC").
		Limit(limit).
		Find(&reminders).Error
	return reminders, err
}

func (r *ReminderRepository) Update(rem *models.PatientReminder) error {
	return r.db.Save(rem).Error
}

func (r *ReminderRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.PatientReminder{}, "id = ?", id).Error
}
