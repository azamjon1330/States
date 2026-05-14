import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { appointmentsAPI, patientsAPI, staffAPI, roomsAPI } from '../../services/endpoints'

const initialForm = {
  patient_id: '', doctor_id: '', room_id: '',
  date: '', time: '', problem: '', notes: '',
  payment: '', payment_status: 'unpaid',
}

export default function AppointmentForm({ open, onClose, appointment = null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [patientSearch, setPatientSearch] = useState('')

  useEffect(() => {
    if (appointment) setForm({ ...initialForm, ...appointment })
    else setForm(initialForm)
    setErrors({})
  }, [appointment, open])

  const { data: patientsData } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientSearch.length > 1
      ? patientsAPI.search(patientSearch).then((r) => r.data)
      : patientsAPI.getAll({ limit: 20 }).then((r) => r.data.items || r.data),
    enabled: open,
  })

  const { data: staffData } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => staffAPI.getAll({ limit: 100 }).then((r) => r.data.items || r.data),
    enabled: open,
  })

  const { data: roomsData } = useQuery({
    queryKey: ['rooms-free'],
    queryFn: () => roomsAPI.getAll({ status: 'free' }).then((r) => r.data.items || r.data),
    enabled: open,
  })

  const patients = patientsData?.items || patientsData || []
  const staff = staffData?.items || staffData || []
  const rooms = roomsData?.items || roomsData || []

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.patient_id) errs.patient_id = 'Выберите пациента'
    if (!form.doctor_id) errs.doctor_id = 'Выберите врача'
    if (!form.date) errs.date = 'Укажите дату'
    if (!form.time) errs.time = 'Укажите время'
    return errs
  }

  const createMut = useMutation({
    mutationFn: (data) => appointmentsAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Приём создан'); onClose() },
    onError: (err) => toast.error(err.response?.data?.message || 'Ошибка'),
  })

  const updateMut = useMutation({
    mutationFn: (data) => appointmentsAPI.update(appointment.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Приём обновлён'); onClose() },
    onError: (err) => toast.error(err.response?.data?.message || 'Ошибка'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (appointment) updateMut.mutate(form)
    else createMut.mutate(form)
  }

  const loading = createMut.isPending || updateMut.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={appointment ? 'Редактировать приём' : 'Новый приём'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {appointment ? 'Сохранить' : 'Создать'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium text-medical-text-primary">Поиск пациента <span className="text-medical-danger">*</span></label>
          <input
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Введите имя пациента..."
            className="input-field mb-1"
          />
          <select
            name="patient_id"
            value={form.patient_id}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Выберите пациента</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name} ({p.phone})</option>
            ))}
          </select>
          {errors.patient_id && <p className="text-xs text-medical-danger">{errors.patient_id}</p>}
        </div>

        <Select
          label="Врач"
          name="doctor_id"
          value={form.doctor_id}
          onChange={handleChange}
          error={errors.doctor_id}
          required
          placeholder="Выберите врача"
          options={staff.map((s) => ({ value: s.id, label: `${s.full_name} — ${s.specialization}` }))}
        />
        <Select
          label="Кабинет"
          name="room_id"
          value={form.room_id}
          onChange={handleChange}
          placeholder="Выберите кабинет"
          options={rooms.map((r) => ({ value: r.id, label: `№${r.number} — ${r.name}` }))}
        />
        <Input label="Дата" name="date" type="date" value={form.date} onChange={handleChange} error={errors.date} required />
        <Input label="Время" name="time" type="time" value={form.time} onChange={handleChange} error={errors.time} required />
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-sm font-medium text-medical-text-primary">Жалоба / Причина приёма</label>
          <textarea name="problem" value={form.problem} onChange={handleChange} rows={2} className="input-field resize-none" placeholder="Опишите симптомы или причину визита..." />
        </div>
        <Input label="Сумма оплаты (₽)" name="payment" type="number" value={form.payment} onChange={handleChange} placeholder="0" />
        <Select
          label="Статус оплаты"
          name="payment_status"
          value={form.payment_status}
          onChange={handleChange}
          options={[{ value: 'unpaid', label: 'Не оплачено' }, { value: 'paid', label: 'Оплачено' }]}
        />
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-sm font-medium text-medical-text-primary">Заметки</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="input-field resize-none" placeholder="Дополнительные заметки..." />
        </div>
      </form>
    </Modal>
  )
}
