import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, BarChart2, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { reportsAPI } from '../../services/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { PageLoader } from '../../components/ui/LoadingSpinner'

const TABS = [
  { id: 'visits', label: 'Посещаемость', icon: Activity },
  { id: 'income', label: 'Доходы', icon: TrendingUp },
  { id: 'expenses', label: 'Расходы', icon: TrendingDown },
  { id: 'popularity', label: 'Популярность приёмов', icon: BarChart2 },
]

const mockVisits = [
  { date: 'Янв', visits: 320, new_patients: 45 },
  { date: 'Фев', visits: 380, new_patients: 52 },
  { date: 'Мар', visits: 420, new_patients: 63 },
  { date: 'Апр', visits: 390, new_patients: 48 },
  { date: 'Май', visits: 450, new_patients: 70 },
]

const mockIncome = [
  { date: 'Янв', income: 1800000 },
  { date: 'Фев', income: 2100000 },
  { date: 'Мар', income: 2400000 },
  { date: 'Апр', income: 2200000 },
  { date: 'Май', income: 2845000 },
]

const mockExpenses = [
  { date: 'Янв', expenses: 650000 },
  { date: 'Фев', expenses: 720000 },
  { date: 'Мар', expenses: 810000 },
  { date: 'Апр', expenses: 780000 },
  { date: 'Май', expenses: 923000 },
]

const mockPopularity = [
  { name: 'Кардиология', count: 142, color: '#2563EB' },
  { name: 'Терапия', count: 128, color: '#10b981' },
  { name: 'Хирургия', count: 96, color: '#f59e0b' },
  { name: 'Неврология', count: 84, color: '#8b5cf6' },
  { name: 'Педиатрия', count: 72, color: '#ef4444' },
  { name: 'ЛОР', count: 56, color: '#06b6d4' },
  { name: 'Офтальмология', count: 44, color: '#ec4899' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-medical-text-primary mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 10000 ? `${(p.value / 1000).toFixed(0)}K ₽` : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('visits')
  const [dateFrom, setDateFrom] = useState('2025-01-01')
  const [dateTo, setDateTo] = useState('2025-05-31')

  const { data: visitsData, isLoading: visitsLoading } = useQuery({
    queryKey: ['reports-visits', dateFrom, dateTo],
    queryFn: () => reportsAPI.getVisits({ from: dateFrom, to: dateTo }).then((r) => r.data),
    enabled: activeTab === 'visits',
  })

  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ['reports-income', dateFrom, dateTo],
    queryFn: () => reportsAPI.getIncome({ from: dateFrom, to: dateTo }).then((r) => r.data),
    enabled: activeTab === 'income',
  })

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['reports-expenses', dateFrom, dateTo],
    queryFn: () => reportsAPI.getExpenses({ from: dateFrom, to: dateTo }).then((r) => r.data),
    enabled: activeTab === 'expenses',
  })

  const { data: popularityData, isLoading: popularityLoading } = useQuery({
    queryKey: ['reports-popularity', dateFrom, dateTo],
    queryFn: () => reportsAPI.getPopularity({ from: dateFrom, to: dateTo }).then((r) => r.data),
    enabled: activeTab === 'popularity',
  })

  const visits = visitsData?.length ? visitsData : mockVisits
  const income = incomeData?.length ? incomeData : mockIncome
  const expenses = expensesData?.length ? expensesData : mockExpenses
  const popularity = popularityData?.length ? popularityData : mockPopularity

  const isLoading = visitsLoading || incomeLoading || expensesLoading || popularityLoading

  const handleExport = () => {
    // UI only — would trigger download in real app
    alert('Экспорт отчёта будет выполнен...')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Отчёты и аналитика</h1>
          <p className="text-sm text-medical-text-secondary">Статистика и аналитика системы</p>
        </div>
        <Button icon={Download} variant="secondary" onClick={handleExport}>
          Экспорт отчёта
        </Button>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-card border border-gray-100 w-fit">
        <span className="text-sm text-medical-text-secondary font-medium">Период:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary"
        />
        <span className="text-medical-text-secondary">—</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary"
        />
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.id ? 'bg-medical-primary text-white' : 'text-medical-text-secondary hover:bg-gray-50'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <PageLoader />}

      {/* Visits Chart */}
      {activeTab === 'visits' && !visitsLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card title="Посещаемость по месяцам">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={visits}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="visits" fill="#2563EB" name="Всего посещений" radius={[4, 4, 0, 0]} />
                <Bar dataKey="new_patients" fill="#10b981" name="Новые пациенты" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Динамика посещаемости">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={visits}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="visits" stroke="#2563EB" strokeWidth={2} name="Посещения" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="new_patients" stroke="#10b981" strokeWidth={2} name="Новые" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Income Chart */}
      {activeTab === 'income' && !incomeLoading && (
        <Card title="Доходы по месяцам">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={income}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#10b981" name="Доход" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Expenses Chart */}
      {activeTab === 'expenses' && !expensesLoading && (
        <Card title="Расходы по месяцам">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={expenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="expenses" fill="#ef4444" name="Расходы" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Popularity Chart */}
      {activeTab === 'popularity' && !popularityLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card title="Популярность отделений">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularity} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Приёмов" radius={[0, 4, 4, 0]}>
                  {popularity.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Распределение приёмов">
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={200} height={220}>
                <PieChart>
                  <Pie data={popularity} cx="50%" cy="50%" outerRadius={90} paddingAngle={2} dataKey="count">
                    {popularity.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {popularity.map((p) => {
                  const total = popularity.reduce((s, i) => s + i.count, 0)
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-xs text-medical-text-secondary">{p.name}</span>
                        </div>
                        <span className="text-xs font-semibold">{Math.round((p.count / total) * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div className="h-full rounded-full" style={{ width: `${(p.count / total) * 100}%`, backgroundColor: p.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
