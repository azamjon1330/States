import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { roomsAPI } from '../../services/endpoints'

const roomTypes = [
  { value: 'consultation', label: 'Кабинет консультации' },
  { value: 'treatment', label: 'Лечебная палата' },
  { value: 'surgery', label: 'Операционная' },
  { value: 'diagnostic', label: 'Диагностический кабинет' },
  { value: 'icu', label: 'Реанимация / ИТ' },
  { value: 'reception', label: 'Регистратура' },
  { value: 'lab', label: 'Лаборатория' },
]

const initialForm = { number: '', name: '', type: 'consultation', floor: '1', status: 'free', capacity: '1', notes: '' }

export default function RoomForm({ open, onClose, room = null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (room) setForm({ ...initialForm, ...room })
    else setForm(initialForm)
    setErrors({})
  }, [room, open])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.number.trim()) errs.number = 'Введите номер'
    if (!form.name.trim()) errs.name = 'Введите название'
    return errs
  }

  const createMut = useMutation({
    mutationFn: (data) => roomsAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success('Комната добавлена'); onClose() },
    onError: (err) => toast.error(err.response?.data?.message || 'Ошибка'),
  })

  const updateMut = useMutation({
    mutationFn: (data) => roomsAPI.update(room.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success('Комната обновлена'); onClose() },
    onError: (err) => toast.error(err.response?.data?.message || 'Ошибка'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (room) updateMut.mutate(form)
    else createMut.mutate(form)
  }

  const loading = createMut.isPending || updateMut.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={room ? 'Редактировать комнату' : 'Добавить комнату'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit} loading={loading}>{room ? 'Сохранить' : 'Добавить'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <Input label="Номер комнаты" name="number" value={form.number} onChange={handleChange} error={errors.number} required placeholder="101" />
        <Input label="Название" name="name" value={form.name} onChange={handleChange} error={errors.name} required placeholder="Кардиология" className="col-span-1" />
        <Select label="Тип" name="type" value={form.type} onChange={handleChange} options={roomTypes} className="col-span-2" />
        <Input label="Этаж" name="floor" type="number" value={form.floor} onChange={handleChange} min={1} />
        <Input label="Вместимость" name="capacity" type="number" value={form.capacity} onChange={handleChange} min={1} />
        <Select
          label="Статус"
          name="status"
          value={form.status}
          onChange={handleChange}
          className="col-span-2"
          options={[
            { value: 'free', label: 'Свободно' },
            { value: 'occupied', label: 'Занято' },
            { value: 'maintenance', label: 'На обслуживании' },
          ]}
        />
        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-sm font-medium text-medical-text-primary">Заметки</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="input-field resize-none" placeholder="Дополнительная информация..." />
        </div>
      </form>
    </Modal>
  )
}
