import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, TrendingDown, TrendingUp, Wallet, PlusCircle, Trash2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { financeAPI, salariesAPI } from '../../services/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Avatar from '../../components/ui/Avatar'
import { RevenueAreaChart } from './FinancialCharts'

const TABS = ['Обзор', 'Доходы', 'Расходы', 'Зарплаты']

const mockSummary = { income: 2845000, expenses: 923000, profit: 1922000 }

const mockChart = [
  { date: 'Янв', income: 1800000, expenses: 650000 },
  { date: 'Фев', income: 2100000, expenses: 720000 },
  { date: 'Мар', income: 2400000, expenses: 810000 },
  { date: 'Апр', income: 2200000, expenses: 780000 },
  { date: 'Май', income: 2845000, expenses: 923000 },
]

const mockIncome = [
  { id: 1, source: 'Приём пациентов', amount: 1800000, date: '2025-05-14', description: 'Доход от приёмов', category: 'appointments' },
  { id: 2, source: 'Лабораторные анализы', amount: 450000, date: '2025-05-14', description: '', category: 'lab' },
  { id: 3, source: 'Физиотерапия', amount: 350000, date: '2025-05-13', description: '', category: 'therapy' },
  { id: 4, source: 'Консультации', amount: 245000, date: '2025-05-13', description: '', category: 'consultations' },
]

const mockExpenses = [
  { id: 1, category: 'Зарплаты', amount: 420000, date: '2025-05-10', description: 'Зарплата персонала' },
  { id: 2, category: 'Расходные материалы', amount: 230000, date: '2025-05-12', description: 'Медицинские расходники' },
  { id: 3, category: 'Оборудование', amount: 150000, date: '2025-05-08', description: 'Техническое обслуживание' },
  { id: 4, category: 'Коммунальные', amount: 80000, date: '2025-05-01', description: 'Электричество, вода' },
  { id: 5, category: 'Прочие', amount: 43000, date: '2025-05-14', description: 'Разные расходы' },
]

const mockSalaries = [
  { id: 1, staff_name: 'Акбаров Тимур', role: 'Кардиолог', salary: 8500000, month: 'Май 2025', status: 'paid', paid_at: '2025-05-05' },
  { id: 2, staff_name: 'Садыкова Гулноза', role: 'Хирург', salary: 9200000, month: 'Май 2025', status: 'paid', paid_at: '2025-05-05' },
  { id: 3, staff_name: 'Рашидов Бобур', role: 'Невролог', salary: 7800000, month: 'Май 2025', status: 'pending', paid_at: null },
  { id: 4, staff_name: 'Камолова Нилуфар', role: 'Терапевт', salary: 6500000, month: 'Май 2025', status: 'pending', paid_at: null },
  { id: 5, staff_name: 'Юсупов Алишер', role: 'Педиатр', salary: 5800000, month: 'Май 2025', status: 'pending', paid_at: null },
]

function FinanceRecordForm({ open, onClose, type }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ amount: '', description: '', date: new Date().toISOString().slice(0, 10), category: '' })
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const incomeCategories = ['Приём пациентов', 'Лабораторные анализы', 'Физиотерапия', 'Консультации', 'Хирургия', 'Прочее'].map((v) => ({ value: v, label: v }))
  const expenseCategories = ['Зарплаты', 'Расходные материалы', 'Оборудование', 'Коммунальные', 'Аренда', 'Прочие'].map((v) => ({ value: v, label: v }))

  const addMut = useMutation({
    mutationFn: (data) => type === 'income' ? financeAPI.addIncome(data) : financeAPI.addExpense(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      toast.success(type === 'income' ? 'Доход добавлен' : 'Расход добавлен')
      onClose()
    },
    onError: () => toast.error('Ошибка при сохранении'),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={type === 'income' ? 'Добавить доход' : 'Добавить расход'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={() => addMut.mutate(form)} loading={addMut.isPending}>Добавить</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Категория"
          name="category"
          value={form.category}
          onChange={handleChange}
          options={type === 'income' ? incomeCategories : expenseCategories}
          placeholder="Выберите категорию"
          required
        />
        <Input label="Сумма (₽)" name="amount" type="number" value={form.amount} onChange={handleChange} required placeholder="0" min={0} />
        <Input label="Дата" name="date" type="date" value={form.date} onChange={handleChange} required />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-medical-text-primary">Описание</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="input-field resize-none" placeholder="Дополнительные заметки..." />
        </div>
      </div>
    </Modal>
  )
}

export default function Finance() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [formType, setFormType] = useState('income')

  const { data: summaryData } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeAPI.getSummary().then((r) => r.data),
  })

  const { data: chartData } = useQuery({
    queryKey: ['finance-chart'],
    queryFn: () => financeAPI.getChart().then((r) => r.data),
  })

  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ['finance-income'],
    queryFn: () => financeAPI.getIncome().then((r) => r.data),
    enabled: activeTab === 1,
  })

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['finance-expenses'],
    queryFn: () => financeAPI.getExpenses().then((r) => r.data),
    enabled: activeTab === 2,
  })

  const { data: salariesData, isLoading: salariesLoading } = useQuery({
    queryKey: ['salaries'],
    queryFn: () => salariesAPI.getAll().then((r) => r.data),
    enabled: activeTab === 3,
  })

  const summary = summaryData || mockSummary
  const chart = chartData?.length ? chartData : mockChart
  const income = incomeData?.items || incomeData || mockIncome
  const expenses = expensesData?.items || expensesData || mockExpenses
  const salaries = salariesData?.items || salariesData || mockSalaries

  const deleteIncomeMut = useMutation({
    mutationFn: (id) => financeAPI.deleteIncome(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-income'] }); toast.success('Удалено') },
  })

  const deleteExpenseMut = useMutation({
    mutationFn: (id) => financeAPI.deleteExpense(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-expenses'] }); toast.success('Удалено') },
  })

  const payMut = useMutation({
    mutationFn: (id) => salariesAPI.pay(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salaries'] }); toast.success('Зарплата выплачена') },
    onError: () => toast.error('Ошибка'),
  })

  const formatMoney = (v) => (v || 0).toLocaleString('ru-RU') + ' ₽'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Финансы</h1>
          <p className="text-sm text-medical-text-secondary">Управление доходами и расходами</p>
        </div>
        {activeTab === 1 && (
          <Button icon={PlusCircle} onClick={() => { setFormType('income'); setFormOpen(true) }}>Добавить доход</Button>
        )}
        {activeTab === 2 && (
          <Button icon={PlusCircle} onClick={() => { setFormType('expense'); setFormOpen(true) }}>Добавить расход</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === i ? 'bg-medical-primary text-white' : 'text-medical-text-secondary hover:text-medical-text-primary hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, label: 'Доходы (месяц)', value: formatMoney(summary.income), bg: '#d1fae5', color: '#10b981' },
              { icon: TrendingDown, label: 'Расходы (месяц)', value: formatMoney(summary.expenses), bg: '#fee2e2', color: '#ef4444' },
              { icon: Wallet, label: 'Чистая прибыль', value: formatMoney(summary.profit), bg: '#dbeafe', color: '#2563EB' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-5 shadow-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <s.icon size={22} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs text-medical-text-secondary">{s.label}</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
          <Card title="Динамика доходов и расходов">
            <RevenueAreaChart data={chart} />
          </Card>
        </div>
      )}

      {/* Income */}
      {activeTab === 1 && (
        <Card>
          {incomeLoading ? <PageLoader /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Источник / Категория', 'Сумма', 'Дата', 'Описание', ''].map((h) => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {income.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                            <DollarSign size={14} className="text-green-600" />
                          </div>
                          <span className="font-medium">{r.source || r.category}</span>
                        </div>
                      </td>
                      <td className="table-cell font-bold text-green-600">+{(r.amount || 0).toLocaleString()} ₽</td>
                      <td className="table-cell text-medical-text-secondary">{r.date}</td>
                      <td className="table-cell text-medical-text-secondary">{r.description || '—'}</td>
                      <td className="table-cell">
                        <button onClick={() => deleteIncomeMut.mutate(r.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Expenses */}
      {activeTab === 2 && (
        <Card>
          {expensesLoading ? <PageLoader /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Категория', 'Сумма', 'Дата', 'Описание', ''].map((h) => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                            <TrendingDown size={14} className="text-red-500" />
                          </div>
                          <span className="font-medium">{r.category}</span>
                        </div>
                      </td>
                      <td className="table-cell font-bold text-red-500">-{(r.amount || 0).toLocaleString()} ₽</td>
                      <td className="table-cell text-medical-text-secondary">{r.date}</td>
                      <td className="table-cell text-medical-text-secondary">{r.description || '—'}</td>
                      <td className="table-cell">
                        <button onClick={() => deleteExpenseMut.mutate(r.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Salaries */}
      {activeTab === 3 && (
        <Card>
          {salariesLoading ? <PageLoader /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Сотрудник', 'Должность', 'Зарплата', 'Период', 'Статус', 'Дата выплаты', 'Действие'].map((h) => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.staff_name} size="sm" />
                          <span className="font-medium">{s.staff_name}</span>
                        </div>
                      </td>
                      <td className="table-cell text-medical-text-secondary">{s.role}</td>
                      <td className="table-cell font-bold">{(s.salary || 0).toLocaleString()} ₽</td>
                      <td className="table-cell text-medical-text-secondary">{s.month}</td>
                      <td className="table-cell">
                        <Badge variant={s.status === 'paid' ? 'green' : 'yellow'}>
                          {s.status === 'paid' ? 'Выплачено' : 'Ожидает'}
                        </Badge>
                      </td>
                      <td className="table-cell text-medical-text-secondary">{s.paid_at || '—'}</td>
                      <td className="table-cell">
                        {s.status === 'pending' && (
                          <Button size="sm" icon={CreditCard} onClick={() => payMut.mutate(s.id)} loading={payMut.isPending}>
                            Выплатить
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <FinanceRecordForm open={formOpen} onClose={() => setFormOpen(false)} type={formType} />
    </div>
  )
}
