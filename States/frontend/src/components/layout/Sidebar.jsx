import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, Building2, Stethoscope, Heart,
  DollarSign, Package, Calculator, BarChart2, Bell, MessageSquare,
  Settings, ChevronDown, ChevronRight, Activity, Shield,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { notificationsAPI } from '../../services/endpoints'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Главная панель' },
  { path: '/patients', icon: Users, label: 'Пациенты' },
  { path: '/appointments', icon: Calendar, label: 'Приёмы и записи' },
  { path: '/rooms', icon: Building2, label: 'Комнаты' },
  { path: '/staff', icon: Stethoscope, label: 'Медработники' },
  { path: '/nurses', icon: Heart, label: 'Медсёстры' },
  {
    icon: DollarSign,
    label: 'Финансы',
    path: '/finance',
    children: [
      { path: '/finance?tab=income', label: 'Доходы' },
      { path: '/finance?tab=expenses', label: 'Расходы' },
    ],
  },
  { path: '/warehouse', icon: Package, label: 'Склад и товары' },
  { path: '/finance?tab=salaries', icon: Calculator, label: 'Бухгалтерия' },
  { path: '/reports', icon: BarChart2, label: 'Отчёты и аналитика' },
  { path: '/notifications', icon: Bell, label: 'Уведомления', badge: true },
  { path: '/chat', icon: MessageSquare, label: 'Чат' },
  { path: '/settings', icon: Settings, label: 'Настройки системы' },
]

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-center">
      <div className="text-white text-lg font-bold tracking-wide">
        {time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-slate-400 text-xs mt-0.5">
        {time.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [financeOpen, setFinanceOpen] = useState(false)
  const user = useAuthStore((s) => s.user)

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount().then((r) => r.data),
    refetchInterval: 30000,
  })

  const unreadCount = unreadData?.count || 0

  return (
    <aside
      className="flex flex-col w-64 min-h-screen flex-shrink-0"
      style={{ backgroundColor: '#1e2a3a' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-medical-primary flex items-center justify-center flex-shrink-0">
          <Activity size={20} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">MedSystem</div>
          <div className="text-slate-400 text-xs">Управление больницей</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setFinanceOpen((o) => !o)}
                  className="sidebar-link w-full justify-between"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {financeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {financeOpen && (
                  <div className="ml-7 mt-0.5 space-y-0.5">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          clsx(
                            'flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                            isActive
                              ? 'bg-blue-600/30 text-blue-300'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          )
                        }
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-60" />
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'sidebar-link',
                  isActive && 'active'
                )
              }
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span className="bg-medical-danger text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          )
        })}

        {user?.role === 'super_admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
          >
            <Shield size={18} />
            <span>Суперадмин</span>
          </NavLink>
        )}
      </nav>

      {/* Clock */}
      <div className="px-4 py-4 border-t border-white/10">
        <Clock />
      </div>
    </aside>
  )
}
