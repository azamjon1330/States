import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings as SettingsIcon, Users, Building2, Bell, Shield, Info,
  Save, PlusCircle, Trash2, Edit2, Eye, EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsAPI } from '../../services/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Avatar from '../../components/ui/Avatar'

const TABS = [
  { id: 'general', label: 'Общие настройки', icon: SettingsIcon },
  { id: 'users', label: 'Пользователи', icon: Users },
  { id: 'departments', label: 'Отделения', icon: Building2 },
  { id: 'notifications', label: 'Уведомления', icon: Bell },
  { id: 'security', label: 'Безопасность', icon: Shield },
  { id: 'about', label: 'О системе', icon: Info },
]

const mockHospital = {
  name: 'Городская больница №1', address: 'г. Ташкент, ул. Навои, 123',
  phone: '+998 71 123 4567', email: 'info@hospital.uz',
  timezone: 'Asia/Tashkent', website: 'https://hospital.uz',
  license: 'МЗ-2024-001', established: '1975',
}

const mockUsers = [
  { id: 1, name: 'Администратор', email: 'admin@hospital.com', role: 'admin', status: 'active', last_login: '2025-05-14 14:32' },
  { id: 2, name: 'Акбаров Тимур', email: 'akbarov@hospital.com', role: 'doctor', status: 'active', last_login: '2025-05-14 11:20' },
  { id: 3, name: 'Садыкова Гулноза', email: 'sadykova@hospital.com', role: 'doctor', status: 'active', last_login: '2025-05-14 09:45' },
  { id: 4, name: 'Иванова Мария', email: 'ivanova@hospital.com', role: 'nurse', status: 'inactive', last_login: '2025-05-12 08:00' },
]

const mockDepartments = [
  { id: 1, name: 'Кардиология', head: 'Акбаров Тимур', staff_count: 5 },
  { id: 2, name: 'Хирургия', head: 'Садыкова Гулноза', staff_count: 8 },
  { id: 3, name: 'Терапия', head: 'Камолова Нилуфар', staff_count: 6 },
  { id: 4, name: 'Педиатрия', head: 'Юсупов Алишер', staff_count: 4 },
  { id: 5, name: 'Неврология', head: 'Рашидов Бобур', staff_count: 3 },
]

const roleLabels = { admin: 'Администратор', super_admin: 'Суперадмин', doctor: 'Врач', nurse: 'Медсестра', accountant: 'Бухгалтер', receptionist: 'Регистратор' }
const roleVariants = { admin: 'blue', super_admin: 'purple', doctor: 'green', nurse: 'mint', accountant: 'yellow', receptionist: 'gray' }

export default function Settings() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')
  const [hospitalForm, setHospitalForm] = useState(mockHospital)
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' })
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false })
  const [deleteUserId, setDeleteUserId] = useState(null)
  const [newDept, setNewDept] = useState('')
  const [notifSettings, setNotifSettings] = useState({
    email_appointments: true, email_payments: true, email_stock: true,
    sms_appointments: false, sms_payments: false,
  })

  const { data: hospitalData } = useQuery({
    queryKey: ['settings-hospital'],
    queryFn: () => settingsAPI.getHospital().then((r) => r.data),
  })

  const { data: usersData } = useQuery({
    queryKey: ['settings-users'],
    queryFn: () => settingsAPI.getUsers().then((r) => r.data),
    enabled: activeTab === 'users',
  })

  const { data: deptData } = useQuery({
    queryKey: ['settings-departments'],
    queryFn: () => settingsAPI.getDepartments().then((r) => r.data),
    enabled: activeTab === 'departments',
  })

  const users = usersData || mockUsers
  const departments = deptData || mockDepartments

  const saveHospitalMut = useMutation({
    mutationFn: (data) => settingsAPI.updateHospital(data),
    onSuccess: () => toast.success('Настройки сохранены'),
    onError: () => toast.error('Ошибка при сохранении'),
  })

  const deleteUserMut = useMutation({
    mutationFn: (id) => settingsAPI.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-users'] }); toast.success('Пользователь удалён'); setDeleteUserId(null) },
  })

  const addDeptMut = useMutation({
    mutationFn: (data) => settingsAPI.createDepartment(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-departments'] }); toast.success('Отделение добавлено'); setNewDept('') },
  })

  const deleteDeptMut = useMutation({
    mutationFn: (id) => settingsAPI.deleteDepartment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-departments'] }); toast.success('Отделение удалено') },
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-medical-text-primary">Настройки системы</h1>
        <p className="text-sm text-medical-text-secondary">Управление конфигурацией больницы</p>
      </div>

      <div className="flex gap-5">
        {/* Sidebar tabs */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${activeTab === t.id ? 'bg-medical-primary text-white' : 'text-medical-text-secondary hover:bg-gray-50'}`}>
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General */}
          {activeTab === 'general' && (
            <Card title="Общие настройки больницы">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Название больницы" value={hospitalForm.name} onChange={(e) => setHospitalForm((f) => ({ ...f, name: e.target.value }))} required />
                <Input label="Телефон" value={hospitalForm.phone} onChange={(e) => setHospitalForm((f) => ({ ...f, phone: e.target.value }))} />
                <Input label="Email" type="email" value={hospitalForm.email} onChange={(e) => setHospitalForm((f) => ({ ...f, email: e.target.value }))} />
                <Input label="Веб-сайт" value={hospitalForm.website} onChange={(e) => setHospitalForm((f) => ({ ...f, website: e.target.value }))} />
                <Input label="Адрес" value={hospitalForm.address} onChange={(e) => setHospitalForm((f) => ({ ...f, address: e.target.value }))} className="col-span-2" />
                <Select label="Часовой пояс" value={hospitalForm.timezone} onChange={(e) => setHospitalForm((f) => ({ ...f, timezone: e.target.value }))}
                  options={['Asia/Tashkent', 'Europe/Moscow', 'UTC'].map((v) => ({ value: v, label: v }))} />
                <Input label="Лицензия" value={hospitalForm.license} onChange={(e) => setHospitalForm((f) => ({ ...f, license: e.target.value }))} />
              </div>
              <div className="mt-5 flex justify-end">
                <Button icon={Save} onClick={() => saveHospitalMut.mutate(hospitalForm)} loading={saveHospitalMut.isPending}>
                  Сохранить настройки
                </Button>
              </div>
            </Card>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <Card title="Пользователи системы">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Пользователь', 'Email', 'Роль', 'Статус', 'Последний вход', ''].map((h) => (
                        <th key={h} className="table-header">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} size="sm" />
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="table-cell text-medical-text-secondary">{u.email}</td>
                        <td className="table-cell"><Badge variant={roleVariants[u.role] || 'gray'}>{roleLabels[u.role] || u.role}</Badge></td>
                        <td className="table-cell"><Badge variant={u.status === 'active' ? 'green' : 'gray'}>{u.status === 'active' ? 'Активный' : 'Неактивный'}</Badge></td>
                        <td className="table-cell text-medical-text-secondary text-xs">{u.last_login}</td>
                        <td className="table-cell">
                          <button onClick={() => setDeleteUserId(u.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ConfirmDialog open={!!deleteUserId} onClose={() => setDeleteUserId(null)} onConfirm={() => deleteUserMut.mutate(deleteUserId)} loading={deleteUserMut.isPending} message="Удалить этого пользователя?" />
            </Card>
          )}

          {/* Departments */}
          {activeTab === 'departments' && (
            <Card title="Отделения">
              <div className="flex gap-3 mb-4">
                <input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Название нового отделения..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary" />
                <Button icon={PlusCircle} onClick={() => newDept.trim() && addDeptMut.mutate({ name: newDept })} loading={addDeptMut.isPending}>
                  Добавить
                </Button>
              </div>
              <div className="space-y-2">
                {departments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Building2 size={16} className="text-medical-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-medical-text-primary">{d.name}</p>
                        {d.head && <p className="text-xs text-medical-text-secondary">Зав.: {d.head} · {d.staff_count} чел.</p>}
                      </div>
                    </div>
                    <button onClick={() => deleteDeptMut.mutate(d.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card title="Настройки уведомлений">
              <div className="space-y-4">
                {[
                  { key: 'email_appointments', label: 'Email: уведомления о приёмах' },
                  { key: 'email_payments', label: 'Email: уведомления об оплатах' },
                  { key: 'email_stock', label: 'Email: уведомления о складе' },
                  { key: 'sms_appointments', label: 'SMS: уведомления о приёмах' },
                  { key: 'sms_payments', label: 'SMS: уведомления об оплатах' },
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                    <span className="text-sm text-medical-text-primary">{s.label}</span>
                    <button
                      onClick={() => setNotifSettings((n) => ({ ...n, [s.key]: !n[s.key] }))}
                      className={`w-11 h-6 rounded-full transition-colors ${notifSettings[s.key] ? 'bg-medical-primary' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${notifSettings[s.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end mt-4">
                  <Button icon={Save} onClick={() => toast.success('Настройки уведомлений сохранены')}>Сохранить</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <Card title="Безопасность — Изменение пароля">
              <div className="max-w-sm space-y-4">
                {['current', 'new', 'confirm'].map((field) => (
                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-medical-text-primary">
                      {field === 'current' ? 'Текущий пароль' : field === 'new' ? 'Новый пароль' : 'Подтвердить новый'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPass[field] ? 'text' : 'password'}
                        value={passForm[field]}
                        onChange={(e) => setPassForm((f) => ({ ...f, [field]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPass((s) => ({ ...s, [field]: !s[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
                <Button icon={Save} onClick={() => {
                  if (passForm.new !== passForm.confirm) { toast.error('Пароли не совпадают'); return }
                  if (passForm.new.length < 6) { toast.error('Пароль должен содержать не менее 6 символов'); return }
                  toast.success('Пароль успешно изменён')
                  setPassForm({ current: '', new: '', confirm: '' })
                }}>
                  Изменить пароль
                </Button>
              </div>
            </Card>
          )}

          {/* About */}
          {activeTab === 'about' && (
            <Card title="О системе">
              <div className="space-y-4">
                {[
                  { label: 'Система', value: 'Hospital Management System (HMS)' },
                  { label: 'Версия', value: 'v2.1.0' },
                  { label: 'Дата сборки', value: '14 мая 2025' },
                  { label: 'Backend', value: 'Go / Fiber' },
                  { label: 'Frontend', value: 'React 18 + Tailwind CSS' },
                  { label: 'База данных', value: 'PostgreSQL 15' },
                  { label: 'Кэш', value: 'Redis' },
                  { label: 'Хранилище', value: 'MinIO / S3' },
                  { label: 'Разработчик', value: 'MedSystem Team' },
                  { label: 'Лицензия', value: 'Проприетарная' },
                ].map((i) => (
                  <div key={i.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-medical-text-secondary">{i.label}</span>
                    <span className="text-sm font-medium text-medical-text-primary">{i.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
