import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Edit2, Trash2, Search, Star, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { staffAPI } from '../../services/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Avatar from '../../components/ui/Avatar'


function StaffForm({ open, onClose, staff = null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    full_name: '', specialization: '', phone: '', email: '',
    experience: '', salary: '', status: 'active', education: '',
  })

  useState(() => {
    if (staff) setForm({ ...form, ...staff })
    else setForm({ full_name: '', specialization: '', phone: '', email: '', experience: '', salary: '', status: 'active', education: '' })
  }, [staff, open])

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const createMut = useMutation({
    mutationFn: (data) => staffAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Сотрудник добавлен'); onClose() },
    onError: () => toast.error('Ошибка'),
  })
  const updateMut = useMutation({
    mutationFn: (data) => staffAPI.update(staff.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Данные обновлены'); onClose() },
    onError: () => toast.error('Ошибка'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (staff) updateMut.mutate(form)
    else createMut.mutate(form)
  }

  const loading = createMut.isPending || updateMut.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={staff ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit} loading={loading}>{staff ? 'Сохранить' : 'Добавить'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <Input label="ФИО" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Врач Иван Иванович" className="col-span-2" />
        <Input label="Специализация" name="specialization" value={form.specialization} onChange={handleChange} required placeholder="Кардиолог" />
        <Input label="Телефон" name="phone" value={form.phone} onChange={handleChange} placeholder="+998 90 000 0000" />
        <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="doctor@hospital.com" />
        <Input label="Стаж (лет)" name="experience" type="number" value={form.experience} onChange={handleChange} min={0} />
        <Input label="Зарплата (₽)" name="salary" type="number" value={form.salary} onChange={handleChange} min={0} />
        <Select
          label="Статус"
          name="status"
          value={form.status}
          onChange={handleChange}
          options={[{ value: 'active', label: 'Активный' }, { value: 'inactive', label: 'Неактивный' }, { value: 'on_leave', label: 'В отпуске' }]}
        />
        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-sm font-medium text-medical-text-primary">Образование</label>
          <textarea name="education" value={form.education} onChange={handleChange} rows={2} className="input-field resize-none" placeholder="Медицинский университет..." />
        </div>
      </form>
    </Modal>
  )
}

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={12} className={s <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
      <span className="text-xs text-medical-text-secondary ml-1">{value?.toFixed(1)}</span>
    </div>
  )
}

export default function Staff() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['staff', page, search],
    queryFn: () => staffAPI.getAll({ page, limit: 15, search }).then((r) => r.data),
  })

  const staff = Array.isArray(data) ? data
    : Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.items) ? data.items
    : []
  const total = data?.total || staff.length
  const totalPages = Math.ceil(total / 15) || 1

  const deleteMut = useMutation({
    mutationFn: (id) => staffAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Сотрудник удалён'); setDeleteId(null) },
    onError: () => toast.error('Ошибка'),
  })

  const filtered = search ? staff.filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()) || s.specialization?.toLowerCase().includes(search.toLowerCase())) : staff

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Медработники</h1>
          <p className="text-sm text-medical-text-secondary">Всего: {total} сотрудников</p>
        </div>
        <Button icon={UserPlus} onClick={() => { setSelected(null); setFormOpen(true) }}>
          Добавить сотрудника
        </Button>
      </div>

      <Card>
        <div className="relative max-w-md mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по имени или специализации..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary" />
        </div>

        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Врач', 'Специализация', 'Телефон', 'Приёмов', 'Рейтинг', 'Стаж', 'Статус', 'Действия'].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.full_name} size="sm" />
                        <span className="font-medium">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="table-cell"><Badge variant="blue">{s.specialization}</Badge></td>
                    <td className="table-cell text-medical-text-secondary">
                      <div className="flex items-center gap-1.5"><Phone size={12} />{s.phone}</div>
                    </td>
                    <td className="table-cell font-semibold text-medical-primary">{s.appointments_count || 0}</td>
                    <td className="table-cell"><StarRating value={s.rating || 0} /></td>
                    <td className="table-cell text-medical-text-secondary">{s.experience ? `${s.experience} лет` : '—'}</td>
                    <td className="table-cell">
                      <Badge variant={s.status === 'active' ? 'green' : s.status === 'on_leave' ? 'yellow' : 'gray'}>
                        {s.status === 'active' ? 'Активный' : s.status === 'on_leave' ? 'В отпуске' : 'Неактивный'}
                      </Badge>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelected(s); setFormOpen(true) }} className="p-1.5 rounded hover:bg-yellow-50 text-gray-400 hover:text-amber-500 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-sm text-medical-text-secondary">Сотрудники не найдены</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-medical-text-secondary">Показано {filtered.length} из {total}</p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      <StaffForm open={formOpen} onClose={() => setFormOpen(false)} staff={selected} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} loading={deleteMut.isPending} message="Удалить этого сотрудника?" />
    </div>
  )
}
