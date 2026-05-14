package repository

import (
	"time"
	"hospital-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AppointmentRepository struct {
	db *gorm.DB
}

func NewAppointmentRepository(db *gorm.DB) *AppointmentRepository {
	return &AppointmentRepository{db: db}
}

func (r *AppointmentRepository) Create(a *models.Appointment) error {
	return r.db.Create(a).Error
}

func (r *AppointmentRepository) FindByID(id uuid.UUID) (*models.Appointment, error) {
	var a models.Appointment
	err := r.db.Preload("Patient").Preload("Staff").Preload("Room").
		Where("id = ?", id).First(&a).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

type AppointmentFilter struct {
	StaffID   string
	PatientID string
	Status    string
	DateFrom  time.Time
	DateTo    time.Time
	Page      int
	Limit     int
}

func (r *AppointmentRepository) List(f AppointmentFilter) ([]models.Appointment, int64, error) {
	var appointments []models.Appointment
	var total int64

	q := r.db.Model(&models.Appointment{}).Preload("Patient").Preload("Staff").Preload("Room")

	if f.StaffID != "" {
		q = q.Where("staff_id = ?", f.StaffID)
	}
	if f.PatientID != "" {
		q = q.Where("patient_id = ?", f.PatientID)
	}
	if f.Status != "" {
		q = q.Where("status = ?", f.Status)
	}
	if !f.DateFrom.IsZero() {
		q = q.Where("date_time >= ?", f.DateFrom)
	}
	if !f.DateTo.IsZero() {
		q = q.Where("date_time <= ?", f.DateTo)
	}

	q.Count(&total)
	offset := (f.Page - 1) * f.Limit
	err := q.Offset(offset).Limit(f.Limit).Order("date_time DESC").Find(&appointments).Error
	return appointments, total, err
}

func (r *AppointmentRepository) Update(a *models.Appointment) error {
	return r.db.Save(a).Error
}

func (r *AppointmentRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Appointment{}, "id = ?", id).Error
}

func (r *AppointmentRepository) GetToday() ([]models.Appointment, error) {
	var appointments []models.Appointment
	err := r.db.Preload("Patient").Preload("Staff").Preload("Room").
		Where("DATE(date_time) = CURRENT_DATE").
		Order("date_time ASC").
		Find(&appointments).Error
	return appointments, err
}

func (r *AppointmentRepository) GetRecent(limit int) ([]models.Appointment, error) {
	var appointments []models.Appointment
	err := r.db.Preload("Patient").Preload("Staff").
		Order("created_at DESC").
		Limit(limit).
		Find(&appointments).Error
	return appointments, err
}

func (r *AppointmentRepository) GetByDate(date time.Time) ([]models.Appointment, error) {
	var appointments []models.Appointment
	err := r.db.Preload("Patient").Preload("Staff").Preload("Room").
		Where("DATE(date_time) = ?", date.Format("2006-01-02")).
		Order("date_time ASC").
		Find(&appointments).Error
	return appointments, err
}

func (r *AppointmentRepository) GetByMonth(year, month int) ([]models.Appointment, error) {
	var appointments []models.Appointment
	err := r.db.Preload("Patient").Preload("Staff").
		Where("EXTRACT(YEAR FROM date_time) = ? AND EXTRACT(MONTH FROM date_time) = ?", year, month).
		Order("date_time ASC").
		Find(&appointments).Error
	return appointments, err
}

func (r *AppointmentRepository) GetByPatient(patientID uuid.UUID) ([]models.Appointment, error) {
	var appointments []models.Appointment
	err := r.db.Preload("Staff").Preload("Room").
		Where("patient_id = ?", patientID).
		Order("date_time DESC").
		Find(&appointments).Error
	return appointments, err
}

func (r *AppointmentRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.Appointment{}).Count(&count).Error
	return count, err
}

func (r *AppointmentRepository) CountToday() (int64, error) {
	var count int64
	err := r.db.Model(&models.Appointment{}).
		Where("DATE(date_time) = CURRENT_DATE").Count(&count).Error
	return count, err
}

func (r *AppointmentRepository) CountTodayCompleted() (int64, error) {
	var count int64
	err := r.db.Model(&models.Appointment{}).
		Where("DATE(date_time) = CURRENT_DATE AND status = 'completed'").Count(&count).Error
	return count, err
}

type DailyStats struct {
	Date    string  `json:"date"`
	Count   int64   `json:"count"`
	Revenue float64 `json:"revenue"`
}

func (r *AppointmentRepository) GetDailyStats(days int) ([]DailyStats, error) {
	var stats []DailyStats
	from := time.Now().AddDate(0, 0, -days)
	err := r.db.Raw(`
		SELECT
			TO_CHAR(date_time, 'YYYY-MM-DD') as date,
			COUNT(*) as count,
			COALESCE(SUM(payment), 0) as revenue
		FROM appointments
		WHERE date_time >= ?
		GROUP BY TO_CHAR(date_time, 'YYYY-MM-DD')
		ORDER BY date ASC
	`, from).Scan(&stats).Error
	return stats, err
}
