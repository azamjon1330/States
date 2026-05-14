package repository

import (
	"hospital-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PatientRepository struct {
	db *gorm.DB
}

func NewPatientRepository(db *gorm.DB) *PatientRepository {
	return &PatientRepository{db: db}
}

func (r *PatientRepository) Create(p *models.Patient) error {
	return r.db.Create(p).Error
}

func (r *PatientRepository) FindByID(id uuid.UUID) (*models.Patient, error) {
	var p models.Patient
	err := r.db.Where("id = ?", id).First(&p).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PatientRepository) List(search string, page, limit int) ([]models.Patient, int64, error) {
	var patients []models.Patient
	var total int64

	q := r.db.Model(&models.Patient{})
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("full_name ILIKE ? OR phone ILIKE ? OR email ILIKE ?", like, like, like)
	}

	q.Count(&total)
	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("created_at DESC").Find(&patients).Error
	return patients, total, err
}

func (r *PatientRepository) Update(p *models.Patient) error {
	return r.db.Save(p).Error
}

func (r *PatientRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Patient{}, "id = ?", id).Error
}

func (r *PatientRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.Patient{}).Count(&count).Error
	return count, err
}

func (r *PatientRepository) CountToday() (int64, error) {
	var count int64
	err := r.db.Model(&models.Patient{}).
		Where("DATE(created_at) = CURRENT_DATE").Count(&count).Error
	return count, err
}

func (r *PatientRepository) GetRecent(limit int) ([]models.Patient, error) {
	var patients []models.Patient
	err := r.db.Order("created_at DESC").Limit(limit).Find(&patients).Error
	return patients, err
}
