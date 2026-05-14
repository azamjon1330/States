import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../services/endpoints'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Введите email и пароль')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.login(form)
      const { user, token, access_token } = res.data
      login(user, token || access_token)
      toast.success('Добро пожаловать!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Неверный email или пароль'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1e2a3a 0%, #0f172a 50%, #1e3a5f 100%)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between flex-1 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: 200 + i * 80,
                height: 200 + i * 80,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.4 - i * 0.05,
              }}
            />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-medical-primary flex items-center justify-center">
              <Activity size={22} className="text-white" />
            </div>
            <span className="text-white text-xl font-bold">MedSystem</span>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Система управления<br />больницей
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Комплексная платформа для управления пациентами, расписаниями,
            персоналом и финансами медицинского учреждения.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Пациентов', value: '10,000+' },
              { label: 'Врачей', value: '150+' },
              { label: 'Приёмов / мес.', value: '2,500+' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-slate-300 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-slate-500 text-sm">
          © 2025 MedSystem. Все права защищены.
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-[440px] bg-white p-10 lg:rounded-l-none">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-medical-primary flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <span className="text-medical-text-primary text-xl font-bold">MedSystem</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-medical-text-primary mb-1">Вход в систему</h2>
          <p className="text-medical-text-secondary text-sm mb-8">
            Введите ваши учётные данные для доступа
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-medical-danger text-sm px-4 py-3 rounded-lg">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-medical-text-primary mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@hospital.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-medical-text-primary mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-medical-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Выполняется вход...
                </>
              ) : (
                'Войти в систему'
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-medical-primary mb-2">Тестовые учётные данные:</p>
            <div className="space-y-1">
              <p className="text-xs text-medical-text-secondary">Email: <span className="font-medium text-medical-text-primary">admin@hospital.com</span></p>
              <p className="text-xs text-medical-text-secondary">Пароль: <span className="font-medium text-medical-text-primary">admin123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
