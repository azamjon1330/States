import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, Edit2, Trash2, Play, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { appointmentsAPI } from '../../services/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Avatar from '../../components/ui/Avatar'
import AppointmentForm from './AppointmentForm'
import DoctorWorkbench from './DoctorWorkbench'

const mockAppointments = [
  { id: 1, date: '2025-05-14', time: '09:00', patient_name: 'Алиев Улугбек', doctor_name: 'Акбаров Тимур', room_number: '101', problem: 'Боль в груди', payment: 85000, status: 'completed' },
  { id: 2, date: '2025-05-14', time: '10:30', patient_name: 'Мирзаева Зебо', doctor_name: 'Садыкова Гулноза', room_number: '102', problem: 'Консультация', payment: 65000, status: 'active' },
  { id: 3, date: '2025-05-14', time: '11:00', patient_name: 'Ботиров Фаррух', doctor_name: 'Рашидов Бобур', room_number: '201', problem: 'Мигрень', payment: 75000, status: 'scheduled' },
  { id: 4, date: '2025-05-14', time: '13:30', patient_name: 'Усмонова Барно', doctor_name: 'Камолова Нилуфар', room_number: '202', problem: 'ОРВИ', payment: 50000, status: 'completed' },
  { id: 5, date: '2025-05-14', time: '15:00', patient_name: 'Қодиров Шерзод', doctor_name: 'Юсупов Алишер', room_number: '301', problem: 'Плановый осмотр', payment: 40000, status: 'scheduled' },
  { id: 6, date: '2025-05-13', time: '09:30', patient_name: 'Назарова Дилноза', doctor_name: 'Акбаров Тимур', room_number: '101', problem: 'Гипертония', payment: 95000, status: 'completed' },
  { id: 7, date: '2025-05-13', time: '14:00', patient_name: 'Хасанова Малика', doctor_name: 'Садыкова Гулноза', room_number: '102', problem: 'Удаление швов', payment: 30000, status: 'cancelled' },
]

const STATUS_TABS = [
  { id: '', label: 'Все' },
  { id: 'scheduled', label: 'Запланирован' },
  { id: 'active', label: 'Активный' },
  { id: 'completed', label: 'Завершён' },
  { id: 'cancelled', label: 'Отменён' },
]

export default function Appointments() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [workbenchOpen, setWorkbenchOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', page, statusFilter, dateFilter],
    queryFn: () => appointmentsAPI.getAll({ page, status: statusFilter, date: dateFilter, limit: 15 }).then((r) => r.data),
  })

  const appointments = data?.items || mockAppointments.filter((a) => !statusFilter || a.status === statusFilter)
  const total = data?.total || appointments.length
  const totalPages = Math.ceil(total / 15) || 1

  const deleteMut = useMutation({
    mutationFn: (id) => appointmentsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Приём удалён'); setDeleteId(null) },
    onError: () => toast.error('Ошибка при удалении'),
  })

  const activateMut = useMutation({
    mutationFn: (id) => appointmentsAPI.activate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Приём начат') },
  })

  const cancelMut = useMutation({
    mutationFn: (id) => appointmentsAPI.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Приём отменён') },
  })

  const openWorkbench = (appt) => { setSelectedAppt(appt); setWorkbenchOpen(true) }
  const openEdit = (appt) => { setSelectedAppt(appt); setFormOpen(true) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Приёмы и записи</h1>
          <p className="text-sm text-medical-text-secondary">Всего: {total} приёмов</p>
        </div>
        <Button icon={CalendarPlus} onClick={() => { setSelectedAppt(null); setFormOpen(true) }}>
          Новый приём
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setStatusFilter(t.id); setPage(1) }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === t.id
                  ? 'bg-medical-primary text-white'
                  : 'text-medical-text-secondary hover:text-medical-text-primary hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
          className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary"
        />
        {dateFilter && (
          <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>Сбросить дату</Button>
        )}
      </div>

      <Card>
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Время', 'Пациент', 'Врач', 'Кабинет', 'Жалоба', 'Оплата', 'Статус', 'Действия'].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-medical-primary" />
                        <div>
                          <p className="font-semibold text-medical-primary text-xs">{a.time}</p>
                          <p className="text-xs text-gray-400">{a.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar name={a.patient_name} size="xs" />
                        <span className="text-sm font-medium">{a.patient_name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-medical-text-secondary">{a.doctor_name}</td>
                    <td className="table-cell">
                      {a.room_number && <Badge variant="blue">№{a.room_number}</Badge>}
                    </td>
                    <td className="table-cell text-medical-text-secondary max-w-[180px] truncate">{a.problem}</td>
                    <td className="table-cell font-medium">{a.payment ? `${a.payment.toLocaleString()} ₽` : '—'}</td>
                    <td className="table-cell"><StatusBadge status={a.status} /></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {a.status === 'scheduled' && (
                          <button onClick={() => activateMut.mutate(a.id)} className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Начать">
                            <Play size={14} />
                          </button>
                        )}
                        {a.status === 'active' && (
                          <button onClick={() => openWorkbench(a)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-medical-primary transition-colors" title="Рабочее место">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {(a.status === 'scheduled' || a.status === 'active') && (
                          <button onClick={() => cancelMut.mutate(a.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger transition-colors" title="Отменить">
                            <XCircle size={14} />
                          </button>
                        )}
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded hover:bg-yellow-50 text-gray-400 hover:text-amber-500 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-sm text-medical-text-secondary">Приёмы не найдены</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-medical-text-secondary">Показано {appointments.length} из {total}</p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      <AppointmentForm open={formOpen} onClose={() => setFormOpen(false)} appointment={selectedAppt} />
      <DoctorWorkbench open={workbenchOpen} onClose={() => setWorkbenchOpen(false)} appointment={selectedAppt} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} loading={deleteMut.isPending} message="Удалить этот приём?" />
    </div>
  )
}
