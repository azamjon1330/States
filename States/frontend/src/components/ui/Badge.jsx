import clsx from 'clsx'

const variants = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
  mint: 'bg-emerald-100 text-emerald-700',
}

export default function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full',
        variants[variant] || variants.gray,
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    active: { label: 'Активный', variant: 'green' },
    scheduled: { label: 'Запланирован', variant: 'blue' },
    completed: { label: 'Завершён', variant: 'gray' },
    cancelled: { label: 'Отменён', variant: 'red' },
    free: { label: 'Свободно', variant: 'green' },
    occupied: { label: 'Занято', variant: 'red' },
    maintenance: { label: 'Обслуживание', variant: 'yellow' },
    'in-progress': { label: 'В процессе', variant: 'yellow' },
    paid: { label: 'Оплачено', variant: 'green' },
    unpaid: { label: 'Не оплачено', variant: 'red' },
    'low-stock': { label: 'Мало', variant: 'yellow' },
    'in-stock': { label: 'В наличии', variant: 'green' },
    'out-of-stock': { label: 'Нет', variant: 'red' },
  }
  const cfg = map[status] || { label: status, variant: 'gray' }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
