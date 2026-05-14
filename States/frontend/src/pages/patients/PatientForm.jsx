import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { patientsAPI } from '../../services/endpoints'

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const genders = [{ value: 'male', label: 'Мужской' }, { value: 'female', label: 'Женский' }]

const initialForm = {
  full_name: '', phone: '', email: '', date_of_birth: '',
  gender: 'male', blood_type: 'A+', address: '',
  allergies: '', chronic_diseases: '', emergency_contact: '',
}

export default function PatientForm({ open, onClose, patient = null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (patient) {
      setForm({ ...initialForm, ...patient })
    } else {
      setForm(initialForm)
    }
    setErrors({})
  }, [patient, open])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.full_name.trim()) errs.full_name = 'Введите ФИО'
    if (!form.phone.trim()) errs.phone = 'Введите телефон'
    if (!form.date_of_birth) errs.date_of_birth = 'Введите дату рождения'
    return errs
  }

  const createMut = useMutation({
    mutationFn: (data) => patientsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Пациент добавлен')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Ошибка при сохранении'),
  })

  const updateMut = useMutation({
    mutationFn: (data) => patientsAPI.update(patient.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Данные обновлены')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Ошибка при обновлении'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (patient) updateMut.mutate(form)
    else createMut.mutate(form)
  }

  const loading = createMut.isPending || updateMut.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={patient ? 'Редактировать пациента' : 'Добавить пациента'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {patient ? 'Сохранить' : 'Добавить'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="ФИО" name="full_name" value={form.full_name} onChange={handleChange} error={errors.full_name} required placeholder="Иванов Иван Иванович" />
        <Input label="Телефон" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} required placeholder="+998 90 000 0000" />
        <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="patient@email.com" />
        <Input label="Дата рождения" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} error={errors.date_of_birth} required />
        <Select label="Пол" name="gender" value={form.gender} onChange={handleChange} options={genders} />
        <Select label="Группа крови" name="blood_type" value={form.blood_type} onChange={handleChange} options={bloodTypes.map((b) => ({ value: b, label: b }))} />
        <Input label="Адрес" name="address" value={form.address} onChange={handleChange} placeholder="г. Ташкент, ул. Навои, 1" className="md:col-span-2" />
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-sm font-medium text-medical-text-primary">Аллергии</label>
          <textarea name="allergies" value={form.allergies} onChange={handleChange} rows={2} className="input-field resize-none" placeholder="Укажите известные аллергии..." />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-sm font-medium text-medical-text-primary">Хронические заболевания</label>
          <textarea name="chronic_diseases" value={form.chronic_diseases} onChange={handleChange} rows={2} className="input-field resize-none" placeholder="Укажите хронические заболевания..." />
        </div>
        <Input label="Контактное лицо (экстренно)" name="emergency_contact" value={form.emergency_contact} onChange={handleChange} placeholder="+998 90 000 0000" className="md:col-span-2" />
      </form>
    </Modal>
  )
}
