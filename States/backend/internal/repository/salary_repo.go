package repository

import (
	"time"
	"hospital-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SalaryRepository struct {
	db *gorm.DB
}

func NewSalaryRepository(db *gorm.DB) *SalaryRepository {
	return &SalaryRepository{db: db}
}

func (r *SalaryRepository) Create(s *models.Salary) error {
	return r.db.Create(s).Error
}

func (r *SalaryRepository) FindByID(id uuid.UUID) (*models.Salary, error) {
	var s models.Salary
	err := r.db.Preload("Staff").Where("id = ?", id).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SalaryRepository) List(page, limit int) ([]models.Salary, int64, error) {
	var salaries []models.Salary
	var total int64

	r.db.Model(&models.Salary{}).Count(&total)
	offset := (page - 1) * limit
	err := r.db.Preload("Staff").
		Offset(offset).Limit(limit).
		Order("month DESC").
		Find(&salaries).Error
	return salaries, total, err
}

func (r *SalaryRepository) MarkPaid(id uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&models.Salary{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"paid":    true,
			"paid_at": &now,
		}).Error
}

func (r *SalaryRepository) GetTotalPaid() (float64, error) {
	var total float64
	err := r.db.Model(&models.Salary{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("paid = true").
		Scan(&total).Error
	return total, err
}
