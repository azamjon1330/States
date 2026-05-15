import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell, CheckCheck, Calendar, DollarSign, AlertTriangle,
  Package, User, Info, Trash2, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { notificationsAPI } from '../../services/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'


const typeConfig = {
  appointment: { icon: Calendar, color: '#2563EB', bg: '#dbeafe' },
  payment: { icon: DollarSign, color: '#10b981', bg: '#d1fae5' },
  stock: { icon: Package, color: '#f59e0b', bg: '#fef3c7' },
  patient: { icon: User, color: '#8b5cf6', bg: '#ede9fe' },
  system: { icon: Info, color: '#64748b', bg: '#f1f5f9' },
  alert: { icon: AlertTriangle, color: '#ef4444', bg: '#fee2e2' },
}

const TABS = ['all', 'unread', 'read']
const TAB_LABELS = { all: 'Все', unread: 'Новые', read: 'Прочитанные' }

export default function Notifications() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll().then((r) => r.data),
    refetchInterval: 30000,
  })

  const notifications = Array.isArray(data) ? data
    : Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.items) ? data.items
    : []

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read
    if (activeTab === 'read') return n.read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const markReadMut = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMut = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Все уведомления прочитаны') },
  })

  const deleteMut = useMutation({
    mutationFn: (id) => notificationsAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const formatTime = (time) => {
    try { return formatDistanceToNow(new Date(time), { addSuffix: true, locale: ru }) }
    catch { return time }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Уведомления</h1>
          {unreadCount > 0 && <p className="text-sm text-medical-text-secondary">{unreadCount} непрочитанных</p>}
        </div>
        {unreadCount > 0 && (
          <Button icon={CheckCheck} variant="secondary" onClick={() => markAllMut.mutate()} loading={markAllMut.isPending}>
            Отметить все прочитанными
          </Button>
        )}
      </div>

      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-card p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? 'bg-medical-primary text-white' : 'text-medical-text-secondary hover:text-medical-text-primary'}`}>
            {TAB_LABELS[t]}
            {t === 'unread' && unreadCount > 0 && (
              <span className="ml-2 bg-medical-danger text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? <PageLoader /> : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-medical-text-secondary">
            <Bell size={40} className="text-gray-200 mb-3" />
            <p className="text-sm">Нет уведомлений</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => {
              const cfg = typeConfig[n.type] || typeConfig.system
              const Icon = cfg.icon
              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && markReadMut.mutate(n.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                    n.read ? 'bg-white border-gray-100 hover:border-gray-200' : 'bg-blue-50/50 border-blue-100 hover:border-blue-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-medical-text-primary">{n.title}</p>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-medical-primary flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-medical-text-secondary">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(n.time)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.read && (
                      <button onClick={(e) => { e.stopPropagation(); markReadMut.mutate(n.id) }} className="p-1.5 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors" title="Прочитано">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteMut.mutate(n.id) }} className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
