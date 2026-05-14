import clsx from 'clsx'

export default function Select({ label, error, options = [], className = '', required, placeholder, ...props }) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-medical-text-primary">
          {label}
          {required && <span className="text-medical-danger ml-0.5">*</span>}
        </label>
      )}
      <select
        className={clsx(
          'w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all bg-white appearance-none',
          error
            ? 'border-medical-danger focus:ring-red-200'
            : 'border-gray-200 focus:ring-medical-primary focus:border-transparent',
        )}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-medical-danger">{error}</p>}
    </div>
  )
}
