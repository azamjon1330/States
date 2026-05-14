import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, User, Stethoscope, Save, CheckCircle, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import { appointmentsAPI } from '../../services/endpoints'

function Timer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = startTime ? new Date(startTime).getTime() : Date.now()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [startTime])
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const s = String(elapsed % 60).padStart(2, '0')
  return <span className="font-mono text-xl font-bold text-medical-primary">{m}:{s}</span>
}

export default function DoctorWorkbench({ open, onClose, appointment }) {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('info')
  const [form, setForm] = useState({ diagnosis: '', treatment: '', payment: '' })

  useEffect(() => {
    if (appointment) {
      setForm({
        diagnosis: appointment.diagnosis || '',
        treatment: appointment.treatment || '',
        payment: appointment.payment || '',
      })
    }
  }, [appointment])

  const saveMut = useMutation({
    mutationFn: (data) => appointmentsAPI.update(appointment.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Сохранено') },
    onError: () => toast.error('Ошибка при сохранении'),
  })

  const completeMut = useMutation({
    mutationFn: (data) => appointmentsAPI.complete(appointment.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Приём завершён')
      onClose()
    },
    onError: () => toast.error('Ошибка при завершении'),
  })

  if (!appointment) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Рабочее место врача"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Закрыть</Button>
          <Button variant="secondary" icon={Save} onClick={() => saveMut.mutate(form)} loading={saveMut.isPending}>
            Сохранить
          </Button>
          <Button variant="success" icon={CheckCircle} onClick={() => completeMut.mutate(form)} loading={completeMut.isPending}>
            Завершить приём
          </Button>
        </>
      }
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-medical-primary flex items-center justify-center">
            <Stethoscope size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-medical-text-secondary">Врач</p>
            <p className="text-base font-bold text-medical-text-primary">{appointment.doctor_name}</p>
            <p className="text-xs text-medical-text-secondary">{appointment.specialization}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-medical-text-secondary mb-1">Время приёма</p>
          <Timer startTime={appointment.started_at} />
        </div>
        <StatusBadge status="active" />
      </div>

      {/* Patient card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <User size={16} className="text-medical-primary" />
          <span className="text-sm font-semibold text-medical-text-secondary uppercase tracking-wider">Пациент</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'ФИО', value: appointment.patient_name },
            { label: 'Возраст', value: appointment.patient_age ? `${appointment.patient_age} лет` : '—' },
            { label: 'Телефон', value: appointment.patient_phone },
            { label: 'Группа крови', value: appointment.blood_type },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-xs text-medical-text-secondary">{f.label}</p>
              <p className="text-sm font-medium text-medical-text-primary">{f.value || '—'}</p>
            </div>
          ))}
        </div>
        {appointment.allergies && (
          <div className="mt-3 px-3 py-2 bg-red-50 rounded-lg text-xs text-red-700">
            <span className="font-semibold">Аллергии: </span>{appointment.allergies}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-5">
        {[
          { id: 'info', label: 'Информация о приёме' },
          { id: 'history', label: 'История' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-medical-primary text-medical-primary'
                : 'border-transparent text-medical-text-secondary hover:text-medical-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-medical-text-primary block mb-1.5">
              Жалоба / Причина обращения
            </label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-medical-text-primary border border-gray-100">
              {appointment.problem || 'Не указана'}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-medical-text-primary block mb-1.5">Диагноз</label>
            <textarea
              value={form.diagnosis}
              onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
              rows={3}
              className="input-field resize-none"
              placeholder="Введите диагноз..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-medical-text-primary block mb-1.5">Лечение / Назначения</label>
            <textarea
              value={form.treatment}
              onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))}
              rows={3}
              className="input-field resize-none"
              placeholder="Введите назначения, препараты, рекомендации..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-medical-text-primary block mb-1.5">Сумма оплаты (₽)</label>
            <input
              type="number"
              value={form.payment}
              onChange={(e) => setForm((f) => ({ ...f, payment: e.target.value }))}
              className="input-field max-w-xs"
              placeholder="0"
            />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="text-center py-12 text-medical-text-secondary">
          <Clock size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">История приёмов пациента будет здесь</p>
        </div>
      )}
    </Modal>
  )
}
