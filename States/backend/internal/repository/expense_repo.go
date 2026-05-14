package repository

import (
	"time"

	"hospital-backend/internal/models"

	"gorm.io/gorm"
)

type ExpenseRepository struct {
	db *gorm.DB
}

func NewExpenseRepository(db *gorm.DB) *ExpenseRepository {
	return &ExpenseRepository{db: db}
}

func (r *ExpenseRepository) Create(exp *models.Expense) error {
	return r.db.Create(exp).Error
}

func (r *ExpenseRepository) List(page, limit int) ([]models.Expense, int64, error) {
	var expenses []models.Expense
	var total int64

	r.db.Model(&models.Expense{}).Count(&total)
	offset := (page - 1) * limit
	err := r.db.Offset(offset).Limit(limit).Order("date DESC").Find(&expenses).Error
	return expenses, total, err
}

func (r *ExpenseRepository) GetTotal() (float64, error) {
	var total float64
	err := r.db.Model(&models.Expense{}).Select("COALESCE(SUM(amount), 0)").Scan(&total).Error
	return total, err
}

func (r *ExpenseRepository) GetTotalByPeriod(from, to time.Time) (float64, error) {
	var total float64
	err := r.db.Model(&models.Expense{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("date >= ? AND date <= ?", from, to).
		Scan(&total).Error
	return total, err
}

type CategoryBreakdown struct {
	Category string  `json:"category"`
	Total    float64 `json:"total"`
	Percent  float64 `json:"percent"`
}

func (r *ExpenseRepository) GetByCategory() ([]CategoryBreakdown, error) {
	var results []CategoryBreakdown
	err := r.db.Raw(`
		SELECT category,
		       COALESCE(SUM(amount), 0) as total,
		       ROUND(COALESCE(SUM(amount), 0) * 100.0 / NULLIF((SELECT SUM(amount) FROM expenses), 0), 2) as percent
		FROM expenses
		GROUP BY category
		ORDER BY total DESC
	`).Scan(&results).Error
	return results, err
}

type DailyExpense struct {
	Date   string  `json:"date"`
	Amount float64 `json:"amount"`
}

func (r *ExpenseRepository) GetDailyByPeriod(days int) ([]DailyExpense, error) {
	var results []DailyExpense
	from := time.Now().AddDate(0, 0, -days)
	err := r.db.Raw(`
		SELECT TO_CHAR(date, 'YYYY-MM-DD') as date,
		       COALESCE(SUM(amount), 0) as amount
		FROM expenses
		WHERE date >= ?
		GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
		ORDER BY date ASC
	`, from).Scan(&results).Error
	return results, err
}
