import api from './api'

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentAppointments: () => api.get('/dashboard/recent-appointments'),
  getNewPatients: () => api.get('/dashboard/new-patients'),
  getReminders: () => api.get('/dashboard/reminders'),
  getChartData: (days) => api.get(`/dashboard/chart?days=${days || 30}`),
}

// ─── Patients ─────────────────────────────────────────────────────────────────
export const patientsAPI = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  getAppointments: (id) => api.get(`/patients/${id}/appointments`),
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  getToday: () => api.get('/appointments/today'),
  getCalendar: (params) => api.get('/appointments/calendar', { params }),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
  complete: (id, data) => api.put(`/appointments/${id}/complete`, data),
  start: (id) => api.put(`/appointments/${id}/start`),
}

// ─── Staff ─────────────────────────────────────────────────────────────────
export const staffAPI = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  getTop: () => api.get('/staff/top'),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
}

// ─── Nurses ─────────────────────────────────────────────────────────────────
export const nursesAPI = {
  getAll: (params) => api.get('/nurses', { params }),
  getById: (id) => api.get(`/nurses/${id}`),
  create: (data) => api.post('/nurses', data),
  update: (id, data) => api.put(`/nurses/${id}`, data),
  delete: (id) => api.delete(`/nurses/${id}`),
}

// ─── Rooms ─────────────────────────────────────────────────────────────────
export const roomsAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  getStats: () => api.get('/rooms/stats'),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
}

// ─── Finance ─────────────────────────────────────────────────────────────────
export const financeAPI = {
  getSummary: (params) => api.get('/finance/summary', { params }),
  getIncome: (params) => api.get('/finance/income', { params }),
  getExpenses: (params) => api.get('/finance/expenses', { params }),
  addIncome: (data) => api.post('/finance/income', data),
  addExpense: (data) => api.post('/finance/expenses', data),
  getChart: (params) => api.get('/finance/chart', { params }),
  getExpenseBreakdown: () => api.get('/finance/expense-breakdown'),
  deleteIncome: (id) => api.delete(`/finance/income/${id}`),
  deleteExpense: (id) => api.delete(`/finance/expenses/${id}`),
}

// ─── Salaries ─────────────────────────────────────────────────────────────────
export const salariesAPI = {
  getAll: (params) => api.get('/salaries', { params }),
  create: (data) => api.post('/salaries', data),
  pay: (id) => api.put(`/salaries/${id}/pay`),
}

// ─── Warehouse ─────────────────────────────────────────────────────────────────
export const warehouseAPI = {
  getAll: (params) => api.get('/warehouse', { params }),
  getById: (id) => api.get(`/warehouse/${id}`),
  getLowStock: () => api.get('/warehouse/low-stock'),
  create: (data) => api.post('/warehouse', data),
  update: (id, data) => api.put(`/warehouse/${id}`, data),
  delete: (id) => api.delete(`/warehouse/${id}`),
  restock: (id, quantity) => api.post('/warehouse/restock', { item_id: id, quantity }),
}

// ─── Notifications ─────────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

// ─── Chat ─────────────────────────────────────────────────────────────────
export const chatAPI = {
  getConversations: () => api.get('/chat/rooms'),
  getMessages: (roomId, params) => api.get('/chat/messages', { params: { room: roomId, ...params } }),
  getUsers: () => api.get('/chat/users'),
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsAPI = {
  getAttendance: (params) => api.get('/reports/attendance', { params }),
  getRevenue: (params) => api.get('/reports/revenue', { params }),
  getPopularTreatments: () => api.get('/reports/popular-treatments'),
  getStaffPerformance: () => api.get('/reports/staff-performance'),
  // aliases used by Reports.jsx
  getVisits: (params) => api.get('/reports/attendance', { params }),
  getIncome: (params) => api.get('/reports/revenue', { params }),
  getExpenses: (params) => api.get('/reports/revenue', { params }),
  getPopularity: (params) => api.get('/reports/popular-treatments', { params }),
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsAPI = {
  getHospital: () => Promise.resolve({ data: null }),
  updateHospital: () => Promise.resolve({ data: null }),
  getUsers: (params) => api.get('/users', { params }),
  createUser: (data) => api.post('/auth/register', data),
  updateUser: (id, data) => api.put(`/auth/profile`, data),
  deleteUser: (id) => api.put(`/users/${id}/toggle`),
  getDepartments: () => Promise.resolve({ data: [] }),
  createDepartment: () => Promise.resolve({ data: null }),
  deleteDepartment: () => Promise.resolve({ data: null }),
}
