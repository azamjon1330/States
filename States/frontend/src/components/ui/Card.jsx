import clsx from 'clsx'

export default function Card({ title, action, children, className = '', noPad = false }) {
  return (
    <div className={clsx('bg-white rounded-xl shadow-card', !noPad && 'p-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-base font-semibold text-medical-text-primary">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
