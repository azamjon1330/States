import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Edit2, Trash2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { roomsAPI } from '../../services/endpoints'
import Button from '../../components/ui/Button'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import RoomForm from './RoomForm'

const mockRooms = [
  { id: 1, number: '101', name: 'Кардиология', type: 'treatment', floor: 1, status: 'occupied', capacity: 2 },
  { id: 2, number: '102', name: 'Хирургия', type: 'surgery', floor: 1, status: 'free', capacity: 1 },
  { id: 3, number: '103', name: 'Регистратура', type: 'reception', floor: 1, status: 'occupied', capacity: 3 },
  { id: 4, number: '201', name: 'Неврология', type: 'consultation', floor: 2, status: 'free', capacity: 1 },
  { id: 5, number: '202', name: 'Терапия', type: 'consultation', floor: 2, status: 'occupied', capacity: 1 },
  { id: 6, number: '203', name: 'УЗИ кабинет', type: 'diagnostic', floor: 2, status: 'free', capacity: 1 },
  { id: 7, number: '301', name: 'Педиатрия', type: 'treatment', floor: 3, status: 'maintenance', capacity: 3 },
  { id: 8, number: '302', name: 'ЛОР', type: 'consultation', floor: 3, status: 'free', capacity: 1 },
  { id: 9, number: '401', name: 'Реанимация', type: 'icu', floor: 4, status: 'occupied', capacity: 4 },
  { id: 10, number: '402', name: 'Лаборатория', type: 'lab', floor: 4, status: 'free', capacity: 2 },
  { id: 11, number: '501', name: 'VIP палата 1', type: 'treatment', floor: 5, status: 'free', capacity: 1 },
  { id: 12, number: '502', name: 'VIP палата 2', type: 'treatment', floor: 5, status: 'occupied', capacity: 1 },
]

const STATUS_TABS = [
  { id: '', label: 'Все', color: 'bg-gray-100 text-gray-600' },
  { id: 'free', label: 'Свободно', color: 'bg-green-100 text-green-700' },
  { id: 'occupied', label: 'Занято', color: 'bg-red-100 text-red-700' },
  { id: 'maintenance', label: 'Обслуживание', color: 'bg-amber-100 text-amber-700' },
]

const typeLabels = {
  consultation: 'Консультация',
  treatment: 'Лечебная',
  surgery: 'Операционная',
  diagnostic: 'Диагностика',
  icu: 'Реанимация',
  reception: 'Регистратура',
  lab: 'Лаборатория',
}

const statusColors = {
  free: { bg: '#10b981', text: '#ffffff', icon: '✓' },
  occupied: { bg: '#ef4444', text: '#ffffff', icon: '•' },
  maintenance: { bg: '#f59e0b', text: '#ffffff', icon: '⚙' },
}

export default function Rooms() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', statusFilter],
    queryFn: () => roomsAPI.getAll({ status: statusFilter }).then((r) => r.data),
  })

  const rooms = data?.items || data || mockRooms
  const filtered = statusFilter ? rooms.filter((r) => r.status === statusFilter) : rooms

  const stats = {
    total: rooms.length,
    free: rooms.filter((r) => r.status === 'free').length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance').length,
  }

  const deleteMut = useMutation({
    mutationFn: (id) => roomsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success('Комната удалена'); setDeleteId(null) },
    onError: () => toast.error('Ошибка при удалении'),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Комнаты и кабинеты</h1>
          <p className="text-sm text-medical-text-secondary">Всего: {stats.total} комнат</p>
        </div>
        <Button icon={PlusCircle} onClick={() => { setSelectedRoom(null); setFormOpen(true) }}>
          Добавить комнату
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Всего комнат', value: stats.total, color: '#2563EB', bg: '#dbeafe' },
          { label: 'Свободно', value: stats.free, color: '#10b981', bg: '#d1fae5' },
          { label: 'Занято', value: stats.occupied, color: '#ef4444', bg: '#fee2e2' },
          { label: 'Обслуживание', value: stats.maintenance, color: '#f59e0b', bg: '#fef3c7' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
              <Building2 size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-medical-text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === t.id
                ? 'bg-medical-primary text-white shadow-sm'
                : 'bg-white text-medical-text-secondary hover:bg-gray-50 border border-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Room grid */}
      {isLoading ? <PageLoader /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((room) => {
            const sc = statusColors[room.status] || statusColors.free
            return (
              <div
                key={room.id}
                className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow"
              >
                {/* Color top bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: sc.bg }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: sc.bg }}
                    >
                      {room.number}
                    </div>
                    <StatusBadge status={room.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-medical-text-primary mb-1">{room.name}</h3>
                  <p className="text-xs text-medical-text-secondary">{typeLabels[room.type] || room.type}</p>
                  <p className="text-xs text-medical-text-secondary">Этаж {room.floor}</p>

                  <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => { setSelectedRoom(room); setFormOpen(true) }}
                      className="p-1.5 rounded hover:bg-yellow-50 text-gray-400 hover:text-amber-500 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(room.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-medical-text-secondary">
              <Building2 size={40} className="mx-auto mb-3 text-gray-200" />
              <p>Комнаты не найдены</p>
            </div>
          )}
        </div>
      )}

      <RoomForm open={formOpen} onClose={() => setFormOpen(false)} room={selectedRoom} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} loading={deleteMut.isPending} message="Удалить эту комнату?" />
    </div>
  )
}
