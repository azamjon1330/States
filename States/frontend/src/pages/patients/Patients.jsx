import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Search, Edit2, Trash2, Eye, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { patientsAPI } from '../../services/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Avatar from '../../components/ui/Avatar'
import PatientForm from './PatientForm'
import PatientDetail from './PatientDetail'

const mockPatients = [
  { id: 1, full_name: 'Алиев Улугбек', phone: '+998 90 123 4567', date_of_birth: '1985-03-15', gender: 'male', blood_type: 'A+', status: 'active' },
  { id: 2, full_name: 'Мирзаева Зебо', phone: '+998 91 234 5678', date_of_birth: '1990-07-22', gender: 'female', blood_type: 'B+', status: 'active' },
  { id: 3, full_name: 'Ботиров Фаррух', phone: '+998 93 345 6789', date_of_birth: '1978-11-08', gender: 'male', blood_type: 'O+', status: 'active' },
  { id: 4, full_name: 'Усмонова Барно', phone: '+998 94 456 7890', date_of_birth: '2001-02-14', gender: 'female', blood_type: 'AB+', status: 'active' },
  { id: 5, full_name: 'Қодиров Шерзод', phone: '+998 95 567 8901', date_of_birth: '1995-06-30', gender: 'male', blood_type: 'A-', status: 'active' },
  { id: 6, full_name: 'Назарова Дилноза', phone: '+998 97 678 9012', date_of_birth: '1988-12-05', gender: 'female', blood_type: 'B-', status: 'inactive' },
  { id: 7, full_name: 'Исмоилов Жамшид', phone: '+998 99 789 0123', date_of_birth: '1972-08-19', gender: 'male', blood_type: 'O-', status: 'active' },
  { id: 8, full_name: 'Хасанова Малика', phone: '+998 90 890 1234', date_of_birth: '2003-04-25', gender: 'female', blood_type: 'AB-', status: 'active' },
]

export default function Patients() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, search],
    queryFn: () => patientsAPI.getAll({ page, limit: pageSize, search }).then((r) => r.data),
  })

  const patients = data?.items || mockPatients
  const total = data?.total || mockPatients.length
  const totalPages = Math.ceil(total / pageSize) || 1

  const deleteMut = useMutation({
    mutationFn: (id) => patientsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Пациент удалён')
      setDeleteId(null)
    },
    onError: () => toast.error('Ошибка при удалении'),
  })

  const filteredPatients = search
    ? patients.filter((p) =>
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
      )
    : patients

  const openEdit = (patient) => { setSelectedPatient(patient); setFormOpen(true) }
  const openDetail = (patient) => { setSelectedPatient(patient); setDetailOpen(true) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Пациенты</h1>
          <p className="text-sm text-medical-text-secondary">Всего: {total} пациентов</p>
        </div>
        <Button icon={UserPlus} onClick={() => { setSelectedPatient(null); setFormOpen(true) }}>
          Добавить пациента
        </Button>
      </div>

      <Card>
        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Поиск по имени или телефону..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary transition-all"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Пациент', 'Телефон', 'Дата рождения', 'Пол', 'Группа крови', 'Статус', 'Действия'].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.full_name} size="sm" />
                        <span className="font-medium">{p.full_name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-medical-text-secondary">
                        <Phone size={13} />
                        {p.phone}
                      </div>
                    </td>
                    <td className="table-cell text-medical-text-secondary">{p.date_of_birth}</td>
                    <td className="table-cell">
                      <Badge variant={p.gender === 'male' ? 'blue' : 'mint'}>
                        {p.gender === 'male' ? 'Мужской' : 'Женский'}
                      </Badge>
                    </td>
                    <td className="table-cell">
                      <Badge variant="red">{p.blood_type}</Badge>
                    </td>
                    <td className="table-cell">
                      <Badge variant={p.status === 'active' ? 'green' : 'gray'}>
                        {p.status === 'active' ? 'Активный' : 'Неактивный'}
                      </Badge>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetail(p)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-medical-primary transition-colors" title="Просмотр">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-yellow-50 text-gray-400 hover:text-amber-500 transition-colors" title="Редактировать">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger transition-colors" title="Удалить">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-medical-text-secondary">
                      Пациенты не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-medical-text-secondary">
            Показано {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} из {total}
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      <PatientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        patient={selectedPatient}
      />
      <PatientDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        patientId={selectedPatient?.id}
        onEdit={openEdit}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
        message="Вы уверены, что хотите удалить этого пациента? Все его данные будут потеряны."
      />
    </div>
  )
}
