package models

import (
	"time"

	"github.com/google/uuid"
)

// User is the base auth model
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	Role      string    `gorm:"not null" json:"role"` // superadmin, doctor, nurse, patient
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Avatar    string    `json:"avatar"`
	Active    bool      `gorm:"default:true" json:"active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Patient model
type Patient struct {
	ID              uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID          *uuid.UUID `gorm:"type:uuid" json:"user_id,omitempty"`
	FullName        string     `gorm:"not null" json:"full_name"`
	Phone           string     `json:"phone"`
	Email           string     `json:"email"`
	DateOfBirth     time.Time  `json:"date_of_birth"`
	Gender          string     `json:"gender"`
	Address         string     `json:"address"`
	BloodType       string     `json:"blood_type"`
	Allergies       string     `json:"allergies"`
	ChronicDiseases string     `json:"chronic_diseases"`
	Insurance       string     `json:"insurance"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// Staff (Doctor) model
type Staff struct {
	ID                uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID            uuid.UUID `gorm:"type:uuid" json:"user_id"`
	FullName          string    `gorm:"not null" json:"full_name"`
	Specialization    string    `json:"specialization"`
	Phone             string    `json:"phone"`
	Email             string    `json:"email"`
	Rating            float64   `gorm:"default:0" json:"rating"`
	AppointmentsCount int       `gorm:"default:0" json:"appointments_count"`
	Salary            float64   `json:"salary"`
	Department        string    `json:"department"`
	Active            bool      `gorm:"default:true" json:"active"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// Nurse model
type Nurse struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid" json:"user_id"`
	FullName   string    `gorm:"not null" json:"full_name"`
	Department string    `json:"department"`
	Phone      string    `json:"phone"`
	Email      string    `json:"email"`
	Active     bool      `gorm:"default:true" json:"active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// Room model
type Room struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Number    string    `gorm:"uniqueIndex;not null" json:"number"`
	Name      string    `json:"name"`
	Type      string    `json:"type"` // therapy, surgery, uzi, etc.
	Floor     int       `json:"floor"`
	Capacity  int       `json:"capacity"`
	Status    string    `gorm:"default:'free'" json:"status"` // free, occupied, maintenance
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Appointment model
type Appointment struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	PatientID uuid.UUID  `gorm:"type:uuid;not null" json:"patient_id"`
	Patient   Patient    `gorm:"foreignKey:PatientID" json:"patient,omitempty"`
	StaffID   uuid.UUID  `gorm:"type:uuid;not null" json:"staff_id"`
	Staff     Staff      `gorm:"foreignKey:StaffID" json:"staff,omitempty"`
	RoomID    *uuid.UUID `gorm:"type:uuid" json:"room_id,omitempty"`
	Room      *Room      `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	DateTime  time.Time  `json:"date_time"`
	Duration  int        `gorm:"default:30" json:"duration"` // minutes
	Problem   string     `json:"problem"`
	Notes     string     `json:"notes"`
	Diagnosis string     `json:"diagnosis"`
	Treatment string     `json:"treatment"`
	Payment   float64    `json:"payment"`
	Status    string     `gorm:"default:'scheduled'" json:"status"` // scheduled, active, completed, cancelled
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// Income model
type Income struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Source    string     `json:"source"` // appointment, operation, diagnostics, other
	Amount    float64    `gorm:"not null" json:"amount"`
	PatientID *uuid.UUID `gorm:"type:uuid" json:"patient_id,omitempty"`
	StaffID   *uuid.UUID `gorm:"type:uuid" json:"staff_id,omitempty"`
	Date      time.Time  `json:"date"`
	Notes     string     `json:"notes"`
	CreatedAt time.Time  `json:"created_at"`
}

// Expense model
type Expense struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Category  string     `json:"category"` // salary, rent, electricity, water, internet, other
	Amount    float64    `gorm:"not null" json:"amount"`
	StaffID   *uuid.UUID `gorm:"type:uuid" json:"staff_id,omitempty"`
	Date      time.Time  `json:"date"`
	Notes     string     `json:"notes"`
	CreatedAt time.Time  `json:"created_at"`
}

// WarehouseItem model
type WarehouseItem struct {
	ID           uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name         string     `gorm:"not null" json:"name"`
	Category     string     `json:"category"` // consumable, medicine, equipment
	Quantity     int        `gorm:"default:0" json:"quantity"`
	Unit         string     `json:"unit"`
	Price        float64    `json:"price"`
	Supplier     string     `json:"supplier"`
	PurchaseDate time.Time  `json:"purchase_date"`
	ExpiryDate   *time.Time `json:"expiry_date,omitempty"`
	MinStock     int        `gorm:"default:10" json:"min_stock"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// Notification model
type Notification struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Type      string    `json:"type"` // info, warning, success, error
	Read      bool      `gorm:"default:false" json:"read"`
	CreatedAt time.Time `json:"created_at"`
}

// ChatMessage model
type ChatMessage struct {
	ID         uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	SenderID   uuid.UUID  `gorm:"type:uuid;not null" json:"sender_id"`
	Sender     User       `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	ReceiverID *uuid.UUID `gorm:"type:uuid" json:"receiver_id,omitempty"`
	RoomName   string     `json:"room_name"` // group chat room name, empty = direct message
	Content    string     `gorm:"not null" json:"content"`
	Read       bool       `gorm:"default:false" json:"read"`
	CreatedAt  time.Time  `json:"created_at"`
}

// PatientReminder model
type PatientReminder struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	PatientID       uuid.UUID `gorm:"type:uuid;not null" json:"patient_id"`
	Patient         Patient   `gorm:"foreignKey:PatientID" json:"patient,omitempty"`
	LastAppointment time.Time `json:"last_appointment"`
	Problem         string    `json:"problem"`
	Reminder        string    `json:"reminder"`
	DueDate         time.Time `json:"due_date"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Salary model
type Salary struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	StaffID   uuid.UUID  `gorm:"type:uuid;not null" json:"staff_id"`
	Staff     Staff      `gorm:"foreignKey:StaffID" json:"staff,omitempty"`
	Amount    float64    `gorm:"not null" json:"amount"`
	Month     time.Time  `json:"month"`
	Paid      bool       `gorm:"default:false" json:"paid"`
	PaidAt    *time.Time `json:"paid_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
