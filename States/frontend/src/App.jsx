import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Patients from './pages/patients/Patients'
import Appointments from './pages/appointments/Appointments'
import Rooms from './pages/rooms/Rooms'
import Staff from './pages/staff/Staff'
import Nurses from './pages/nurses/Nurses'
import Finance from './pages/finance/Finance'
import Warehouse from './pages/warehouse/Warehouse'
import Reports from './pages/reports/Reports'
import Notifications from './pages/notifications/Notifications'
import Chat from './pages/chat/Chat'
import Settings from './pages/settings/Settings'
import SuperAdminPanel from './pages/dashboard/SuperAdminPanel'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="staff" element={<Staff />} />
        <Route path="nurses" element={<Nurses />} />
        <Route path="finance" element={<Finance />} />
        <Route path="warehouse" element={<Warehouse />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="chat" element={<Chat />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<SuperAdminPanel />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
