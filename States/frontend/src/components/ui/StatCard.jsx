import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

export default function StatCard({ icon: Icon, iconBg, value, label, trend, trendUp, subtext, color = '#2563EB' }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: iconBg || '#dbeafe' }}
        >
          {Icon && <Icon size={20} style={{ color }} />}
        </div>
        {trend !== undefined && (
          <div
            className={clsx(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
              trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            )}
          >
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-medical-text-primary leading-tight">{value}</div>
        <div className="text-xs text-medical-text-secondary mt-0.5">{label}</div>
        {subtext && <div className="text-xs text-medical-text-secondary mt-1 font-medium">{subtext}</div>}
      </div>
    </div>
  )
}
