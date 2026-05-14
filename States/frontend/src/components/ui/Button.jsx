import clsx from 'clsx'

const variants = {
  primary: 'bg-medical-primary text-white hover:bg-blue-700 focus:ring-blue-300',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-200',
  danger: 'bg-medical-danger text-white hover:bg-red-600 focus:ring-red-300',
  ghost: 'bg-transparent text-medical-text-secondary hover:bg-gray-100 focus:ring-gray-200',
  success: 'bg-medical-success text-white hover:bg-emerald-600 focus:ring-emerald-300',
  outline: 'border border-medical-primary text-medical-primary hover:bg-blue-50 focus:ring-blue-200',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  )
}
