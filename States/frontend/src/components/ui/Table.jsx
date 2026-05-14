import clsx from 'clsx'
import LoadingSpinner from './LoadingSpinner'

export default function Table({ headers, rows, loading = false, emptyMessage = 'Нет данных', className = '' }) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left text-xs font-semibold text-medical-text-secondary uppercase tracking-wider py-3 px-4 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="py-12 text-center">
                <div className="flex justify-center">
                  <LoadingSpinner />
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="py-12 text-center text-sm text-medical-text-secondary">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
              >
                {row.map((cell, j) => (
                  <td key={j} className="py-3 px-4 text-sm text-medical-text-primary">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
