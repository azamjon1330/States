import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users, Calendar, DollarSign, TrendingDown, Stethoscope, Building2,
  Star, Clock, Package, AlertCircle, Wallet, BarChart2,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { dashboardAPI } from '../../services/endpoints'
import StatCard from '../../components/ui/StatCard'
import Card from '../../components/ui/Card'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Avatar from '../../components/ui/Avatar'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

// ─── Mock / fallback data ─────────────────────────────────────────────────────
const mockStats = {
  patients_today: 47, patients_trend: 12,
  appointments_today: 63, appointments_trend: 8,
  income_today: 284500, income_trend: 15,
  expenses_today: 92300, expenses_trend: -4,
  staff_total: 38, staff_on_shift: 22,
  rooms_occupied: 18, rooms_total: 32, rooms_free: 14,
}

const mockChart = [
  { date: 'Пн', visits: 42, revenue: 180000 },
  { date: 'Вт', visits: 58, revenue: 240000 },
  { date: 'Ср', visits: 51, revenue: 210000 },
  { date: 'Чт', visits: 67, revenue: 290000 },
  { date: 'Пт', visits: 73, revenue: 320000 },
  { date: 'Сб', visits: 38, revenue: 160000 },
  { date: 'Вс', visits: 29, revenue: 120000 },
]

const mockTopStaff = [
  { id: 1, name: 'Акбаров Тимур', specialization: 'Кардиолог', appointments: 124, revenue: 620000, rating: 4.9 },
  { id: 2, name: 'Садыкова Гулноза', specialization: 'Хирург', appointments: 98, revenue: 490000, rating: 4.8 },
  { id: 3, name: 'Рашидов Бобур', specialization: 'Невролог', appointments: 87, revenue: 435000, rating: 4.7 },
  { id: 4, name: 'Камолова Нилуфар', specialization: 'Терапевт', appointments: 76, revenue: 380000, rating: 4.6 },
  { id: 5, name: 'Юсупов Алишер', specialization: 'Педиатр', appointments: 65, revenue: 325000, rating: 4.5 },
]

const mockRooms = [
  { number: '101', name: 'Кардиология', type: 'Лечебная', floor: 1, status: 'occupied' },
  { number: '102', name: 'Хирургия', type: 'Операционная', floor: 1, status: 'free' },
  { number: '201', name: 'Неврология', type: 'Лечебная', floor: 2, status: 'free' },
  { number: '202', name: 'Терапия', type: 'Консультация', floor: 2, status: 'occupied' },
  { number: '301', name: 'Педиатрия', type: 'Лечебная', floor: 3, status: 'maintenance' },
  { number: '302', name: 'УЗИ кабинет', type: 'Диагностика', floor: 3, status: 'free' },
]

const mockNewPatients = [
  { id: 1, name: 'Исмоилов Жамшид', phone: '+998 90 123 4567', created_at: new Date().toISOString() },
  { id: 2, name: 'Назарова Дилноза', phone: '+998 91 234 5678', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, name: 'Каримов Санжар', phone: '+998 93 345 6789', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, name: 'Хасанова Малика', phone: '+998 94 456 7890', created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 5, name: 'Турсунов Бехруз', phone: '+998 95 567 8901', created_at: new Date(Date.now() - 14400000).toISOString() },
]

const mockAppointments = [
  { id: 1, time: '09:00', patient: 'Алиев Улугбек', doctor: 'Акбаров Т.', problem: 'Боль в груди', payment: 85000, status: 'completed' },
  { id: 2, time: '10:30', patient: 'Мирзаева Зебо', doctor: 'Садыкова Г.', problem: 'Консультация', payment: 65000, status: 'active' },
  { id: 3, time: '11:00', patient: 'Ботиров Фаррух', doctor: 'Рашидов Б.', problem: 'Мигрень', payment: 75000, status: 'scheduled' },
  { id: 4, time: '13:30', patient: 'Усмонова Барно', doctor: 'Камолова Н.', problem: 'ОРВИ', payment: 50000, status: 'completed' },
  { id: 5, time: '15:00', patient: 'Қодиров Шерзод', doctor: 'Юсупов А.', problem: 'Плановый осмотр', payment: 40000, status: 'scheduled' },
]

const mockReminders = [
  { id: 1, patient: 'Алиев Улугбек', last_visit: '15.04.2025', problem: 'Гипертония', type: 'Контроль давления' },
  { id: 2, patient: 'Ботирова Шахло', last_visit: '20.04.2025', problem: 'Диабет', type: 'Анализ крови' },
  { id: 3, patient: 'Рустамов Элдор', last_visit: '28.04.2025', problem: 'Астма', type: 'Повторный приём' },
]

const mockFinance = {
  income: 2845000, expenses: 923000, profit: 1922000,
  expense_breakdown: [
    { name: 'Зарплаты', value: 420000, color: '#2563EB' },
    { name: 'Расходные материалы', value: 230000, color: '#10b981' },
    { name: 'Оборудование', value: 150000, color: '#f59e0b' },
    { name: 'Коммунальные', value: 80000, color: '#ef4444' },
    { name: 'Прочие', value: 43000, color: '#8b5cf6' },
  ],
}

const mockSalaries = [
  { name: 'Акбаров Тимур', role: 'Кардиолог', salary: 8500000, paid: true },
  { name: 'Садыкова Гулноза', role: 'Хирург', salary: 9200000, paid: true },
  { name: 'Рашидов Бобур', role: 'Невролог', salary: 7800000, paid: false },
  { name: 'Камолова Нилуфар', role: 'Терапевт', salary: 6500000, paid: false },
]

const mockWarehouse = [
  { id: 1, name: 'Перчатки медицинские', qty: 500, unit: 'пар', status: 'in-stock' },
  { id: 2, name: 'Шприцы 10мл', qty: 200, unit: 'шт', status: 'in-stock' },
  { id: 3, name: 'Маски N95', qty: 15, unit: 'шт', status: 'low-stock' },
  { id: 4, name: 'Парацетамол 500мг', qty: 300, unit: 'табл', status: 'in-stock' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function PeriodTabs({ period, setPeriod }) {
  const tabs = [
    { id: '7d', label: '7 дней' },
    { id: '30d', label: '30 дней' },
    { id: '90d', label: '90 дней' },
  ]
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setPeriod(t.id)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
            period === t.id ? 'bg-white text-medical-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
      <span className="text-xs text-medical-text-secondary ml-1">{value.toFixed(1)}</span>
    </div>
  )
}

function formatMoney(val) {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M ₽`
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K ₽`
  return `${val} ₽`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-medical-text-primary mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === 'revenue' ? formatMoney(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [period, setPeriod] = useState('7d')

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats().then((r) => r.data),
  })

  const { data: chartData } = useQuery({
    queryKey: ['visit-chart', period],
    queryFn: () => dashboardAPI.getVisitChart(period).then((r) => r.data),
  })

  const { data: topStaffData } = useQuery({
    queryKey: ['top-staff'],
    queryFn: () => dashboardAPI.getTopStaff().then((r) => r.data),
  })

  const { data: recentAppts } = useQuery({
    queryKey: ['recent-appointments'],
    queryFn: () => dashboardAPI.getRecentAppointments().then((r) => r.data),
  })

  const { data: newPatientsData } = useQuery({
    queryKey: ['new-patients'],
    queryFn: () => dashboardAPI.getNewPatients().then((r) => r.data),
  })

  const { data: roomsData } = useQuery({
    queryKey: ['room-status-dash'],
    queryFn: () => dashboardAPI.getRoomStatus().then((r) => r.data),
  })

  const { data: remindersData } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => dashboardAPI.getReminders().then((r) => r.data),
  })

  const { data: financeData } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => dashboardAPI.getFinancialSummary().then((r) => r.data),
  })

  const stats = statsData || mockStats
  const chart = chartData?.length ? chartData : mockChart
  const topStaff = topStaffData?.length ? topStaffData : mockTopStaff
  const appointments = recentAppts?.length ? recentAppts : mockAppointments
  const newPatients = newPatientsData?.length ? newPatientsData : mockNewPatients
  const rooms = roomsData?.length ? roomsData : mockRooms
  const reminders = remindersData?.length ? remindersData : mockReminders
  const finance = financeData || mockFinance

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Главная панель</h1>
          <p className="text-sm text-medical-text-secondary mt-0.5">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Система работает
        </div>
      </div>

      {/* ── ROW 1: Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          iconBg="#dbeafe"
          color="#2563EB"
          value={stats.patients_today}
          label="Пациентов сегодня"
          trend={stats.patients_trend}
          trendUp={stats.patients_trend > 0}
        />
        <StatCard
          icon={Calendar}
          iconBg="#ede9fe"
          color="#7c3aed"
          value={stats.appointments_today}
          label="Приёмов сегодня"
          trend={stats.appointments_trend}
          trendUp={stats.appointments_trend > 0}
        />
        <StatCard
          icon={DollarSign}
          iconBg="#d1fae5"
          color="#10b981"
          value={formatMoney(stats.income_today)}
          label="Доход сегодня"
          trend={stats.income_trend}
          trendUp={stats.income_trend > 0}
        />
        <StatCard
          icon={TrendingDown}
          iconBg="#fee2e2"
          color="#ef4444"
          value={formatMoney(stats.expenses_today)}
          label="Расход сегодня"
          trend={Math.abs(stats.expenses_trend)}
          trendUp={stats.expenses_trend < 0}
        />
        <StatCard
          icon={Stethoscope}
          iconBg="#fef3c7"
          color="#f59e0b"
          value={stats.staff_total}
          label="Медработники"
          subtext={`На смене: ${stats.staff_on_shift}`}
        />
        <StatCard
          icon={Building2}
          iconBg="#f0fdf4"
          color="#10b981"
          value={`${stats.rooms_occupied}/${stats.rooms_total}`}
          label="Комнаты заняты"
          subtext={`Свободно: ${stats.rooms_free}`}
        />
      </div>

      {/* ── ROW 2: Chart + Top Staff ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Visit + Revenue Chart */}
        <div className="xl:col-span-2">
          <Card
            title="Посещаемость и Доходы"
            action={<PeriodTabs period={period} setPeriod={setPeriod} />}
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chart} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area yAxisId="left" type="monotone" dataKey="visits" stroke="#2563EB" strokeWidth={2} fill="url(#gVisits)" name="Посещения" dot={false} activeDot={{ r: 4 }} />
                <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#gRevenue)" name="Доход (₽)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Staff */}
        <Card title="Топ медработников">
          <div className="space-y-3">
            {topStaff.map((doc, i) => (
              <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-6 h-6 rounded-full bg-medical-primary/10 text-medical-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <Avatar name={doc.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-medical-text-primary truncate">{doc.name}</p>
                  <p className="text-xs text-medical-text-secondary">{doc.specialization}</p>
                  <StarRating value={doc.rating} />
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-medical-text-primary">{doc.appointments} прм.</p>
                  <p className="text-xs text-medical-text-secondary">{formatMoney(doc.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── ROW 3: Room Status + New Patients ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Room Status */}
        <Card title="Статус комнат">
          <div className="flex items-center gap-4 mb-4 pb-3 border-b border-gray-50">
            {[
              { label: 'Свободно', color: '#10b981', count: rooms.filter((r) => r.status === 'free').length },
              { label: 'Занято', color: '#ef4444', count: rooms.filter((r) => r.status === 'occupied').length },
              { label: 'Обслуживание', color: '#f59e0b', count: rooms.filter((r) => r.status === 'maintenance').length },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-medical-text-secondary">{s.label}</span>
                <span className="text-xs font-bold text-medical-text-primary ml-0.5">({s.count})</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div key={room.number} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      backgroundColor:
                        room.status === 'free' ? '#10b981' :
                        room.status === 'maintenance' ? '#f59e0b' : '#ef4444',
                    }}
                  >
                    {room.number}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-medical-text-primary">{room.name}</p>
                    <p className="text-xs text-medical-text-secondary">{room.type} · Этаж {room.floor}</p>
                  </div>
                </div>
                <StatusBadge status={room.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* New Patients */}
        <Card title="Новые пациенты">
          <div className="space-y-3">
            {newPatients.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar name={p.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-medical-text-primary">{p.name}</p>
                  <p className="text-xs text-medical-text-secondary">{p.phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-medical-text-secondary">
                    {new Date(p.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-medical-text-secondary">
                    {new Date(p.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── ROW 4: Appointments + Reminders + Finance ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent Appointments */}
        <Card title="Последние приёмы">
          <div className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-gray-50 hover:border-gray-100 hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  <Clock size={12} className="text-medical-text-secondary" />
                  <span className="text-xs font-semibold text-medical-primary">{a.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-medical-text-primary truncate">{a.patient}</p>
                  <p className="text-xs text-medical-text-secondary truncate">д-р {a.doctor}</p>
                  <p className="text-xs text-medical-text-secondary italic truncate">{a.problem}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <StatusBadge status={a.status} />
                  <p className="text-xs font-medium text-medical-text-primary mt-1">{(a.payment / 1000).toFixed(0)}K ₽</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Reminders */}
        <Card title="Напоминания о пациентах">
          <div className="space-y-3">
            {reminders.map((r) => (
              <div key={r.id} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-medical-text-primary">{r.patient}</p>
                  <Badge variant="yellow">{r.type}</Badge>
                </div>
                <p className="text-xs text-medical-text-secondary">{r.problem}</p>
                <p className="text-xs text-amber-600 mt-1 font-medium">Посл. визит: {r.last_visit}</p>
              </div>
            ))}
            {reminders.length === 0 && (
              <div className="text-center py-8 text-sm text-medical-text-secondary">
                Нет напоминаний
              </div>
            )}
          </div>
        </Card>

        {/* Financial Summary */}
        <Card title="Финансовая сводка">
          <div className="grid grid-cols-1 gap-2 mb-4">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign size={14} className="text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-700">Доходы</span>
              </div>
              <span className="text-sm font-bold text-green-700">{formatMoney(finance.income)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingDown size={14} className="text-red-500" />
                </div>
                <span className="text-xs font-medium text-red-600">Расходы</span>
              </div>
              <span className="text-sm font-bold text-red-600">{formatMoney(finance.expenses)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Wallet size={14} className="text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-700">Прибыль</span>
              </div>
              <span className="text-sm font-bold text-blue-700">{formatMoney(finance.profit)}</span>
            </div>
          </div>

          {/* Donut chart */}
          <div className="mt-2">
            <p className="text-xs font-semibold text-medical-text-secondary mb-2">Разбивка расходов</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie data={finance.expense_breakdown} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={2} dataKey="value">
                    {finance.expense_breakdown.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1">
                {finance.expense_breakdown.map((e) => (
                  <div key={e.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <span className="text-xs text-medical-text-secondary truncate max-w-[90px]">{e.name}</span>
                    </div>
                    <span className="text-xs font-medium text-medical-text-primary">
                      {Math.round((e.value / finance.expenses) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── ROW 5: Bottom Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Expense Details */}
        <Card title="Расходы детализация">
          <div className="space-y-3">
            {finance.expense_breakdown.map((e) => (
              <div key={e.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="text-xs text-medical-text-secondary">{e.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-medical-text-primary">{formatMoney(e.value)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(e.value / finance.expenses) * 100}%`,
                      backgroundColor: e.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Salary Expenses */}
        <Card title="Зарплаты">
          <div className="space-y-2">
            {mockSalaries.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <Avatar name={s.name} size="xs" />
                  <div>
                    <p className="text-xs font-medium text-medical-text-primary">{s.name.split(' ')[0]}</p>
                    <p className="text-xs text-medical-text-secondary">{s.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-medical-text-primary">{(s.salary / 1000000).toFixed(1)}M ₽</p>
                  <Badge variant={s.paid ? 'green' : 'yellow'}>{s.paid ? 'Выплачено' : 'Ожидает'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Warehouse Item */}
        <Card title="Состояние склада">
          <div className="space-y-2">
            {mockWarehouse.map((w) => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Package size={14} className="text-medical-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-medical-text-primary leading-tight">{w.name}</p>
                    <p className="text-xs text-medical-text-secondary">{w.qty} {w.unit}</p>
                  </div>
                </div>
                <StatusBadge status={w.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Warehouse Recent Arrivals */}
        <Card title="Последние поступления">
          <div className="space-y-3">
            {[
              { name: 'Перчатки (500 шт)', date: '12.05.2025', supplier: 'МедТорг', amount: 45000 },
              { name: 'Шприцы 5мл (200)', date: '11.05.2025', supplier: 'ФармГрупп', amount: 18000 },
              { name: 'Бинты стерил.', date: '10.05.2025', supplier: 'МедТорг', amount: 12000 },
              { name: 'Амоксициллин', date: '09.05.2025', supplier: 'ФармДист', amount: 67000 },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-gray-50">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Package size={13} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-medical-text-primary">{item.name}</p>
                  <p className="text-xs text-medical-text-secondary">{item.supplier}</p>
                  <p className="text-xs text-medical-text-secondary">{item.date}</p>
                </div>
                <p className="text-xs font-bold text-medical-text-primary flex-shrink-0">{(item.amount / 1000).toFixed(0)}K ₽</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
