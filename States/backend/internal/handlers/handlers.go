package handlers

import (
	"hospital-backend/internal/repository"
)

type Handlers struct {
	Auth         *AuthHandler
	Dashboard    *DashboardHandler
	Patient      *PatientHandler
	Staff        *StaffHandler
	Nurse        *NurseHandler
	Room         *RoomHandler
	Appointment  *AppointmentHandler
	Finance      *FinanceHandler
	Warehouse    *WarehouseHandler
	Notification *NotificationHandler
	Salary       *SalaryHandler
	Report       *ReportHandler
	Chat         *ChatHandler
}

func NewHandlers(repos *repository.Repositories) *Handlers {
	chatHub := NewChatHub()
	go chatHub.Run()

	return &Handlers{
		Auth:         NewAuthHandler(repos.User),
		Dashboard:    NewDashboardHandler(repos),
		Patient:      NewPatientHandler(repos.Patient, repos.Appointment),
		Staff:        NewStaffHandler(repos.Staff),
		Nurse:        NewNurseHandler(repos.Nurse),
		Room:         NewRoomHandler(repos.Room),
		Appointment:  NewAppointmentHandler(repos.Appointment, repos.Staff),
		Finance:      NewFinanceHandler(repos.Income, repos.Expense),
		Warehouse:    NewWarehouseHandler(repos.Warehouse),
		Notification: NewNotificationHandler(repos.Notification),
		Salary:       NewSalaryHandler(repos.Salary, repos.Staff),
		Report:       NewReportHandler(repos),
		Chat:         NewChatHandler(repos.Message, repos.User, chatHub),
	}
}
