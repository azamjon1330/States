-- Hospital Management System - Initial Migration
-- Run this if you prefer manual migration over GORM AutoMigrate

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'doctor', 'nurse', 'patient')),
    name VARCHAR(255),
    phone VARCHAR(50),
    avatar TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    date_of_birth TIMESTAMPTZ,
    gender VARCHAR(20),
    address TEXT,
    blood_type VARCHAR(10),
    allergies TEXT,
    chronic_diseases TEXT,
    insurance VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- Staff (Doctors) table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0,
    appointments_count INTEGER DEFAULT 0,
    salary DECIMAL(10,2),
    department VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_specialization ON staff(specialization);
CREATE INDEX IF NOT EXISTS idx_staff_appointments_count ON staff(appointments_count DESC);

-- Nurses table
CREATE TABLE IF NOT EXISTS nurses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nurses_user_id ON nurses(user_id);
CREATE INDEX IF NOT EXISTS idx_nurses_department ON nurses(department);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    type VARCHAR(100),
    floor INTEGER,
    capacity INTEGER,
    status VARCHAR(20) DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'maintenance')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    date_time TIMESTAMPTZ NOT NULL,
    duration INTEGER DEFAULT 30,
    problem TEXT,
    notes TEXT,
    diagnosis TEXT,
    treatment TEXT,
    payment DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(date_time, status);

-- Incomes table
CREATE TABLE IF NOT EXISTS incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100),
    amount DECIMAL(12,2) NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_source ON incomes(source);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100),
    amount DECIMAL(12,2) NOT NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Warehouse items table
CREATE TABLE IF NOT EXISTS warehouse_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(50),
    price DECIMAL(10,2),
    supplier VARCHAR(255),
    purchase_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    min_stock INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_name ON warehouse_items(name);
CREATE INDEX IF NOT EXISTS idx_warehouse_category ON warehouse_items(category);
CREATE INDEX IF NOT EXISTS idx_warehouse_quantity ON warehouse_items(quantity);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    body TEXT,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    room_name VARCHAR(100) DEFAULT '',
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_receiver ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room_name);
CREATE INDEX IF NOT EXISTS idx_chat_conversation ON chat_messages(sender_id, receiver_id, created_at);

-- Patient reminders table
CREATE TABLE IF NOT EXISTS patient_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    last_appointment TIMESTAMPTZ,
    problem TEXT,
    reminder TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_patient_id ON patient_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON patient_reminders(due_date);

-- Salaries table
CREATE TABLE IF NOT EXISTS salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    month TIMESTAMPTZ NOT NULL,
    paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salaries_staff_id ON salaries(staff_id);
CREATE INDEX IF NOT EXISTS idx_salaries_month ON salaries(month);
CREATE INDEX IF NOT EXISTS idx_salaries_paid ON salaries(paid);

-- Helpful views

-- Daily revenue summary view
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT
    DATE(date) as day,
    SUM(amount) as total_income,
    COUNT(*) as transactions
FROM incomes
GROUP BY DATE(date)
ORDER BY day DESC;

-- Room occupancy view
CREATE OR REPLACE VIEW v_room_occupancy AS
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM rooms
GROUP BY status;

-- Staff performance view
CREATE OR REPLACE VIEW v_staff_performance AS
SELECT
    s.id,
    s.full_name,
    s.specialization,
    s.department,
    s.appointments_count,
    s.rating,
    s.salary,
    COALESCE(SUM(a.payment), 0) as total_revenue_generated
FROM staff s
LEFT JOIN appointments a ON a.staff_id = s.id AND a.status = 'completed'
WHERE s.active = true
GROUP BY s.id, s.full_name, s.specialization, s.department, s.appointments_count, s.rating, s.salary
ORDER BY s.appointments_count DESC;
