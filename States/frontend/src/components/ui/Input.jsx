import clsx from 'clsx'

export default function Input({
  label,
  error,
  className = '',
  required,
  icon: Icon,
  ...props
}) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-medical-text-primary">
          {label}
          {required && <span className="text-medical-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Icon size={16} className="text-gray-400" />
          </div>
        )}
        <input
          className={clsx(
            'w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all',
            Icon && 'pl-9',
            error
              ? 'border-medical-danger focus:ring-red-200 bg-red-50'
              : 'border-gray-200 focus:ring-medical-primary focus:border-transparent',
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-medical-danger">{error}</p>}
    </div>
  )
}
