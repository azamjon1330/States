package repository

import (
	"time"

	"hospital-backend/internal/models"

	"gorm.io/gorm"
)

type IncomeRepository struct {
	db *gorm.DB
}

func NewIncomeRepository(db *gorm.DB) *IncomeRepository {
	return &IncomeRepository{db: db}
}

func (r *IncomeRepository) Create(inc *models.Income) error {
	return r.db.Create(inc).Error
}

func (r *IncomeRepository) List(page, limit int) ([]models.Income, int64, error) {
	var incomes []models.Income
	var total int64

	r.db.Model(&models.Income{}).Count(&total)
	offset := (page - 1) * limit
	err := r.db.Offset(offset).Limit(limit).Order("date DESC").Find(&incomes).Error
	return incomes, total, err
}

func (r *IncomeRepository) GetTotal() (float64, error) {
	var total float64
	err := r.db.Model(&models.Income{}).Select("COALESCE(SUM(amount), 0)").Scan(&total).Error
	return total, err
}

func (r *IncomeRepository) GetTotalByPeriod(from, to time.Time) (float64, error) {
	var total float64
	err := r.db.Model(&models.Income{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("date >= ? AND date <= ?", from, to).
		Scan(&total).Error
	return total, err
}

type SourceBreakdown struct {
	Source  string  `json:"source"`
	Total   float64 `json:"total"`
	Percent float64 `json:"percent"`
}

func (r *IncomeRepository) GetBySource() ([]SourceBreakdown, error) {
	var results []SourceBreakdown
	err := r.db.Raw(`
		SELECT source,
		       COALESCE(SUM(amount), 0) as total,
		       ROUND(COALESCE(SUM(amount), 0) * 100.0 / NULLIF((SELECT SUM(amount) FROM incomes), 0), 2) as percent
		FROM incomes
		GROUP BY source
		ORDER BY total DESC
	`).Scan(&results).Error
	return results, err
}

type DailyIncome struct {
	Date   string  `json:"date"`
	Amount float64 `json:"amount"`
}

func (r *IncomeRepository) GetDailyByPeriod(days int) ([]DailyIncome, error) {
	var results []DailyIncome
	from := time.Now().AddDate(0, 0, -days)
	err := r.db.Raw(`
		SELECT TO_CHAR(date, 'YYYY-MM-DD') as date,
		       COALESCE(SUM(amount), 0) as amount
		FROM incomes
		WHERE date >= ?
		GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
		ORDER BY date ASC
	`, from).Scan(&results).Error
	return results, err
}
