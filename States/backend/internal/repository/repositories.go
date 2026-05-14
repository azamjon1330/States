package repository

import "gorm.io/gorm"

type Repositories struct {
	User         *UserRepository
	Patient      *PatientRepository
	Staff        *StaffRepository
	Nurse        *NurseRepository
	Room         *RoomRepository
	Appointment  *AppointmentRepository
	Income       *IncomeRepository
	Expense      *ExpenseRepository
	Warehouse    *WarehouseRepository
	Notification *NotificationRepository
	Message      *MessageRepository
	Reminder     *ReminderRepository
	Salary       *SalaryRepository
}

func NewRepositories(db *gorm.DB) *Repositories {
	return &Repositories{
		User:         NewUserRepository(db),
		Patient:      NewPatientRepository(db),
		Staff:        NewStaffRepository(db),
		Nurse:        NewNurseRepository(db),
		Room:         NewRoomRepository(db),
		Appointment:  NewAppointmentRepository(db),
		Income:       NewIncomeRepository(db),
		Expense:      NewExpenseRepository(db),
		Warehouse:    NewWarehouseRepository(db),
		Notification: NewNotificationRepository(db),
		Message:      NewMessageRepository(db),
		Reminder:     NewReminderRepository(db),
		Salary:       NewSalaryRepository(db),
	}
}
