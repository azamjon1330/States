import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Edit2, Trash2, Search, Phone, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import { nursesAPI } from '../../services/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Avatar from '../../components/ui/Avatar'


const shiftLabels = { morning: 'Утренняя', evening: 'Вечерняя', night: 'Ночная' }
const shiftVariants = { morning: 'blue', evening: 'yellow', night: 'purple' }

function NurseForm({ open, onClose, nurse = null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ full_name: '', department: '', phone: '', email: '', shift: 'morning', status: 'active', experience: '' })

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const createMut = useMutation({
    mutationFn: (data) => nursesAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nurses'] }); toast.success('Медсестра добавлена'); onClose() },
    onError: () => toast.error('Ошибка'),
  })
  const updateMut = useMutation({
    mutationFn: (data) => nursesAPI.update(nurse.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nurses'] }); toast.success('Данные обновлены'); onClose() },
    onError: () => toast.error('Ошибка'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (nurse) updateMut.mutate(form)
    else createMut.mutate(form)
  }

  const loading = createMut.isPending || updateMut.isPending

  const departments = ['Кардиология', 'Хирургия', 'Терапия', 'Педиатрия', 'Неврология', 'ЛОР', 'Офтальмология', 'Реанимация'].map((d) => ({ value: d, label: d }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={nurse ? 'Редактировать медсестру' : 'Добавить медсестру'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit} loading={loading}>{nurse ? 'Сохранить' : 'Добавить'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <Input label="ФИО" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Иванова Мария Ивановна" className="col-span-2" />
        <Select label="Отделение" name="department" value={form.department} onChange={handleChange} options={departments} placeholder="Выберите отделение" required />
        <Input label="Телефон" name="phone" value={form.phone} onChange={handleChange} placeholder="+998 90 000 0000" />
        <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="nurse@hospital.com" />
        <Input label="Стаж (лет)" name="experience" type="number" value={form.experience} onChange={handleChange} min={0} />
        <Select label="Смена" name="shift" value={form.shift} onChange={handleChange} options={[{ value: 'morning', label: 'Утренняя' }, { value: 'evening', label: 'Вечерняя' }, { value: 'night', label: 'Ночная' }]} />
        <Select label="Статус" name="status" value={form.status} onChange={handleChange} options={[{ value: 'active', label: 'Активная' }, { value: 'inactive', label: 'Неактивная' }]} />
      </form>
    </Modal>
  )
}

export default function Nurses() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['nurses', page, search],
    queryFn: () => nursesAPI.getAll({ page, limit: 15, search }).then((r) => r.data),
  })

  const nurses = Array.isArray(data) ? data
    : Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.items) ? data.items
    : []
  const total = data?.total || nurses.length
  const totalPages = Math.ceil(total / 15) || 1

  const deleteMut = useMutation({
    mutationFn: (id) => nursesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nurses'] }); toast.success('Медсестра удалена'); setDeleteId(null) },
    onError: () => toast.error('Ошибка'),
  })

  const filtered = search ? nurses.filter((n) => n.full_name.toLowerCase().includes(search.toLowerCase()) || n.department?.toLowerCase().includes(search.toLowerCase())) : nurses

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Медсёстры</h1>
          <p className="text-sm text-medical-text-secondary">Всего: {total} медсестёр</p>
        </div>
        <Button icon={UserPlus} onClick={() => { setSelected(null); setFormOpen(true) }}>
          Добавить медсестру
        </Button>
      </div>

      <Card>
        <div className="relative max-w-md mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по имени или отделению..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary" />
        </div>

        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Медсестра', 'Отделение', 'Телефон', 'Смена', 'Стаж', 'Статус', 'Действия'].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <Avatar name={n.full_name} size="sm" />
                        <div>
                          <p className="font-medium text-medical-text-primary">{n.full_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-medical-text-secondary">
                        <Heart size={13} className="text-pink-400" />
                        {n.department}
                      </div>
                    </td>
                    <td className="table-cell text-medical-text-secondary">
                      <div className="flex items-center gap-1.5"><Phone size={12} />{n.phone}</div>
                    </td>
                    <td className="table-cell">
                      <Badge variant={shiftVariants[n.shift] || 'gray'}>{shiftLabels[n.shift] || n.shift}</Badge>
                    </td>
                    <td className="table-cell text-medical-text-secondary">{n.experience ? `${n.experience} лет` : '—'}</td>
                    <td className="table-cell">
                      <Badge variant={n.status === 'active' ? 'green' : 'gray'}>
                        {n.status === 'active' ? 'Активная' : 'Неактивная'}
                      </Badge>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelected(n); setFormOpen(true) }} className="p-1.5 rounded hover:bg-yellow-50 text-gray-400 hover:text-amber-500"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(n.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-sm text-medical-text-secondary">Медсёстры не найдены</td></tr>
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

      <NurseForm open={formOpen} onClose={() => setFormOpen(false)} nurse={selected} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} loading={deleteMut.isPending} message="Удалить эту медсестру?" />
    </div>
  )
}
