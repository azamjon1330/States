import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, LogOut, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { notificationsAPI } from '../../services/endpoints'
import Avatar from '../ui/Avatar'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount().then((r) => r.data),
    refetchInterval: 30000,
  })
  const unreadCount = unreadData?.count || 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/patients?search=${encodeURIComponent(search)}`)
  }

  const roleLabels = {
    admin: 'Администратор',
    super_admin: 'Суперадмин',
    doctor: 'Врач',
    nurse: 'Медсестра',
    receptionist: 'Регистратор',
    accountant: 'Бухгалтер',
  }

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск пациентов, врачей..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary focus:bg-white transition-all"
          />
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-medical-danger text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Avatar name={user?.full_name || user?.name} size="sm" />
            <div className="text-left hidden sm:block">
              <div className="text-sm font-semibold text-medical-text-primary leading-tight">
                {user?.full_name || user?.name || 'Пользователь'}
              </div>
              <div className="text-xs text-medical-text-secondary">
                {roleLabels[user?.role] || user?.role || 'Роль'}
              </div>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-semibold text-medical-text-primary">
                    {user?.full_name || user?.name}
                  </p>
                  <p className="text-xs text-medical-text-secondary mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-medical-danger hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Выйти из системы
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
