package repository

import (
	"hospital-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NurseRepository struct {
	db *gorm.DB
}

func NewNurseRepository(db *gorm.DB) *NurseRepository {
	return &NurseRepository{db: db}
}

func (r *NurseRepository) Create(n *models.Nurse) error {
	return r.db.Create(n).Error
}

func (r *NurseRepository) FindByID(id uuid.UUID) (*models.Nurse, error) {
	var n models.Nurse
	err := r.db.Where("id = ?", id).First(&n).Error
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *NurseRepository) List(search string, page, limit int) ([]models.Nurse, int64, error) {
	var nurses []models.Nurse
	var total int64

	q := r.db.Model(&models.Nurse{})
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("full_name ILIKE ? OR department ILIKE ?", like, like)
	}

	q.Count(&total)
	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("created_at DESC").Find(&nurses).Error
	return nurses, total, err
}

func (r *NurseRepository) Update(n *models.Nurse) error {
	return r.db.Save(n).Error
}

func (r *NurseRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Nurse{}, "id = ?", id).Error
}

func (r *NurseRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.Nurse{}).Where("active = true").Count(&count).Error
	return count, err
}
