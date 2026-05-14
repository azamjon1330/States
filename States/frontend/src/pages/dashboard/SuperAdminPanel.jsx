import { useQuery } from '@tanstack/react-query'
import { Shield, Users, Activity, Server, Database, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'

const mockMetrics = {
  total_users: 42,
  active_sessions: 18,
  db_size: '2.4 GB',
  uptime: '99.8%',
  requests_today: 12847,
  errors_today: 3,
}

const mockActivityLog = [
  { id: 1, user: 'admin@hospital.com', action: 'Вход в систему', ip: '192.168.1.10', time: '14:32', status: 'success' },
  { id: 2, user: 'doctor1@hospital.com', action: 'Создан приём #3421', ip: '192.168.1.15', time: '14:18', status: 'success' },
  { id: 3, user: 'nurse2@hospital.com', action: 'Обновлён пациент #882', ip: '192.168.1.22', time: '13:55', status: 'success' },
  { id: 4, user: 'unknown', action: 'Неудачный вход', ip: '82.147.33.12', time: '13:40', status: 'error' },
  { id: 5, user: 'accountant@hospital.com', action: 'Экспорт финансового отчёта', ip: '192.168.1.18', time: '13:22', status: 'success' },
  { id: 6, user: 'admin@hospital.com', action: 'Добавлен новый врач', ip: '192.168.1.10', time: '12:50', status: 'success' },
]

const mockUsers = [
  { id: 1, name: 'Администратор', email: 'admin@hospital.com', role: 'admin', status: 'active', last_login: '14:32 сегодня' },
  { id: 2, name: 'Акбаров Тимур', email: 'akbarov@hospital.com', role: 'doctor', status: 'active', last_login: '11:20 сегодня' },
  { id: 3, name: 'Садыкова Гулноза', email: 'sadykova@hospital.com', role: 'doctor', status: 'active', last_login: '09:45 сегодня' },
  { id: 4, name: 'Иванова Мария', email: 'ivanova@hospital.com', role: 'nurse', status: 'inactive', last_login: '2 дня назад' },
  { id: 5, name: 'Бухгалтер Зойир', email: 'zoir@hospital.com', role: 'accountant', status: 'active', last_login: '13:22 сегодня' },
]

const roleLabels = {
  admin: { label: 'Администратор', variant: 'blue' },
  super_admin: { label: 'Суперадмин', variant: 'purple' },
  doctor: { label: 'Врач', variant: 'green' },
  nurse: { label: 'Медсестра', variant: 'mint' },
  accountant: { label: 'Бухгалтер', variant: 'yellow' },
  receptionist: { label: 'Регистратор', variant: 'gray' },
}

export default function SuperAdminPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Shield size={22} className="text-purple-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Панель суперадмина</h1>
          <p className="text-sm text-medical-text-secondary">Системная аналитика и управление пользователями</p>
        </div>
      </div>

      {/* System metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { icon: Users, label: 'Всего пользователей', value: mockMetrics.total_users, bg: '#ede9fe', color: '#7c3aed' },
          { icon: Activity, label: 'Активных сессий', value: mockMetrics.active_sessions, bg: '#d1fae5', color: '#10b981' },
          { icon: Database, label: 'Размер БД', value: mockMetrics.db_size, bg: '#dbeafe', color: '#2563EB' },
          { icon: Server, label: 'Аптайм', value: mockMetrics.uptime, bg: '#fef3c7', color: '#f59e0b' },
          { icon: TrendingUp, label: 'Запросов сегодня', value: mockMetrics.requests_today.toLocaleString(), bg: '#f0fdf4', color: '#16a34a' },
          { icon: AlertTriangle, label: 'Ошибок сегодня', value: mockMetrics.errors_today, bg: '#fee2e2', color: '#ef4444' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-4 shadow-card">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: m.bg }}>
              <m.icon size={18} style={{ color: m.color }} />
            </div>
            <div className="text-2xl font-bold text-medical-text-primary">{m.value}</div>
            <div className="text-xs text-medical-text-secondary mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* User management */}
        <Card title="Пользователи системы">
          <div className="space-y-2">
            {mockUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                <Avatar name={u.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-medical-text-primary">{u.name}</p>
                  <p className="text-xs text-medical-text-secondary">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={roleLabels[u.role]?.variant || 'gray'}>
                    {roleLabels[u.role]?.label || u.role}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-400' : 'bg-gray-300'}`} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity log */}
        <Card title="Журнал активности">
          <div className="space-y-2">
            {mockActivityLog.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  log.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {log.status === 'success' ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <AlertTriangle size={14} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-medical-text-primary">{log.action}</p>
                  <p className="text-xs text-medical-text-secondary">{log.user} · IP: {log.ip}</p>
                </div>
                <span className="text-xs text-medical-text-secondary flex-shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* System health */}
      <Card title="Состояние системы">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'API Backend', status: 'running', latency: '24ms' },
            { label: 'База данных PostgreSQL', status: 'running', latency: '8ms' },
            { label: 'Redis Cache', status: 'running', latency: '2ms' },
            { label: 'WebSocket сервер', status: 'running', latency: '—' },
            { label: 'Nginx', status: 'running', latency: '—' },
            { label: 'Email сервис', status: 'warning', latency: '—' },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  s.status === 'running' ? 'bg-green-400 animate-pulse' :
                  s.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                <span className="text-sm font-medium text-medical-text-primary">{s.label}</span>
              </div>
              <div className="text-right">
                <Badge variant={s.status === 'running' ? 'green' : s.status === 'warning' ? 'yellow' : 'red'}>
                  {s.status === 'running' ? 'Работает' : s.status === 'warning' ? 'Предупреждение' : 'Ошибка'}
                </Badge>
                {s.latency !== '—' && <p className="text-xs text-medical-text-secondary mt-0.5">{s.latency}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
