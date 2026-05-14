package repository

import (
	"hospital-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StaffRepository struct {
	db *gorm.DB
}

func NewStaffRepository(db *gorm.DB) *StaffRepository {
	return &StaffRepository{db: db}
}

func (r *StaffRepository) Create(s *models.Staff) error {
	return r.db.Create(s).Error
}

func (r *StaffRepository) FindByID(id uuid.UUID) (*models.Staff, error) {
	var s models.Staff
	err := r.db.Where("id = ?", id).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *StaffRepository) FindByUserID(userID uuid.UUID) (*models.Staff, error) {
	var s models.Staff
	err := r.db.Where("user_id = ?", userID).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *StaffRepository) List(search string, page, limit int) ([]models.Staff, int64, error) {
	var staff []models.Staff
	var total int64

	q := r.db.Model(&models.Staff{})
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("full_name ILIKE ? OR specialization ILIKE ? OR department ILIKE ?", like, like, like)
	}

	q.Count(&total)
	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("created_at DESC").Find(&staff).Error
	return staff, total, err
}

func (r *StaffRepository) Update(s *models.Staff) error {
	return r.db.Save(s).Error
}

func (r *StaffRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Staff{}, "id = ?", id).Error
}

func (r *StaffRepository) GetTopByAppointments(limit int) ([]models.Staff, error) {
	var staff []models.Staff
	err := r.db.Where("active = true").
		Order("appointments_count DESC, rating DESC").
		Limit(limit).
		Find(&staff).Error
	return staff, err
}

func (r *StaffRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.Staff{}).Where("active = true").Count(&count).Error
	return count, err
}

func (r *StaffRepository) IncrementAppointments(id uuid.UUID) error {
	return r.db.Model(&models.Staff{}).
		Where("id = ?", id).
		UpdateColumn("appointments_count", gorm.Expr("appointments_count + 1")).Error
}
