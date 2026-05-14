import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, PlusCircle, Edit2, Trash2, AlertTriangle, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { warehouseAPI } from '../../services/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { PageLoader } from '../../components/ui/LoadingSpinner'

const CATEGORY_TABS = [
  { id: '', label: 'Все товары' },
  { id: 'consumable', label: 'Расходные материалы' },
  { id: 'medicine', label: 'Лекарства' },
  { id: 'equipment', label: 'Оборудование' },
]

const mockItems = [
  { id: 1, name: 'Перчатки медицинские (L)', category: 'consumable', qty: 500, unit: 'пар', price: 45, supplier: 'МедТорг', purchase_date: '2025-05-12', expiry_date: '2026-05-12', status: 'in-stock', min_qty: 100 },
  { id: 2, name: 'Шприцы 10мл', category: 'consumable', qty: 200, unit: 'шт', price: 12, supplier: 'ФармГрупп', purchase_date: '2025-05-11', expiry_date: '2027-01-01', status: 'in-stock', min_qty: 50 },
  { id: 3, name: 'Маски N95', category: 'consumable', qty: 15, unit: 'шт', price: 85, supplier: 'МедТорг', purchase_date: '2025-04-20', expiry_date: '2026-04-20', status: 'low-stock', min_qty: 50 },
  { id: 4, name: 'Парацетамол 500мг', category: 'medicine', qty: 300, unit: 'табл', price: 8, supplier: 'ФармДист', purchase_date: '2025-05-10', expiry_date: '2026-10-01', status: 'in-stock', min_qty: 100 },
  { id: 5, name: 'Амоксициллин 500мг', category: 'medicine', qty: 120, unit: 'капс', price: 25, supplier: 'ФармДист', purchase_date: '2025-05-09', expiry_date: '2026-09-01', status: 'in-stock', min_qty: 50 },
  { id: 6, name: 'Ибупрофен 400мг', category: 'medicine', qty: 8, unit: 'табл', price: 15, supplier: 'МедАптека', purchase_date: '2025-04-15', expiry_date: '2026-04-15', status: 'low-stock', min_qty: 50 },
  { id: 7, name: 'ЭКГ аппарат', category: 'equipment', qty: 2, unit: 'шт', price: 350000, supplier: 'МедТех', purchase_date: '2024-01-15', expiry_date: null, status: 'in-stock', min_qty: 1 },
  { id: 8, name: 'Тонометр электронный', category: 'equipment', qty: 8, unit: 'шт', price: 12000, supplier: 'МедТех', purchase_date: '2024-06-10', expiry_date: null, status: 'in-stock', min_qty: 3 },
  { id: 9, name: 'Бинты стерильные', category: 'consumable', qty: 0, unit: 'рул', price: 35, supplier: 'МедТорг', purchase_date: '2025-03-01', expiry_date: '2027-03-01', status: 'out-of-stock', min_qty: 20 },
]

function WarehouseForm({ open, onClose, item = null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', category: 'consumable', qty: '', unit: 'шт',
    price: '', supplier: '', purchase_date: '', expiry_date: '', min_qty: '10',
  })

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const createMut = useMutation({
    mutationFn: (data) => warehouseAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouse'] }); toast.success('Товар добавлен'); onClose() },
    onError: () => toast.error('Ошибка'),
  })

  const updateMut = useMutation({
    mutationFn: (data) => warehouseAPI.update(item.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouse'] }); toast.success('Товар обновлён'); onClose() },
    onError: () => toast.error('Ошибка'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (item) updateMut.mutate(form)
    else createMut.mutate(form)
  }

  const loading = createMut.isPending || updateMut.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Редактировать товар' : 'Добавить товар'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit} loading={loading}>{item ? 'Сохранить' : 'Добавить'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <Input label="Название" name="name" value={form.name} onChange={handleChange} required placeholder="Название товара" className="col-span-2" />
        <Select label="Категория" name="category" value={form.category} onChange={handleChange} options={[
          { value: 'consumable', label: 'Расходный материал' },
          { value: 'medicine', label: 'Лекарство' },
          { value: 'equipment', label: 'Оборудование' },
        ]} />
        <Select label="Единица" name="unit" value={form.unit} onChange={handleChange} options={['шт', 'пар', 'табл', 'капс', 'мл', 'л', 'г', 'кг', 'рул', 'упак'].map((v) => ({ value: v, label: v }))} />
        <Input label="Количество" name="qty" type="number" value={form.qty} onChange={handleChange} required min={0} />
        <Input label="Мин. количество" name="min_qty" type="number" value={form.min_qty} onChange={handleChange} min={0} />
        <Input label="Цена за единицу (₽)" name="price" type="number" value={form.price} onChange={handleChange} min={0} />
        <Input label="Поставщик" name="supplier" value={form.supplier} onChange={handleChange} placeholder="Название поставщика" />
        <Input label="Дата закупки" name="purchase_date" type="date" value={form.purchase_date} onChange={handleChange} />
        <Input label="Срок годности" name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} />
      </form>
    </Modal>
  )
}

const categoryLabels = { consumable: 'Расходный', medicine: 'Лекарство', equipment: 'Оборудование' }
const categoryVariants = { consumable: 'blue', medicine: 'green', equipment: 'purple' }

export default function Warehouse() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['warehouse', page, category, search],
    queryFn: () => warehouseAPI.getAll({ page, category, search, limit: 15 }).then((r) => r.data),
  })

  const items = data?.items || data || mockItems
  const filtered = items
    .filter((i) => !category || i.category === category)
    .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  const lowStock = filtered.filter((i) => i.status === 'low-stock' || i.status === 'out-of-stock')
  const total = data?.total || filtered.length
  const totalPages = Math.ceil(total / 15) || 1

  const deleteMut = useMutation({
    mutationFn: (id) => warehouseAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouse'] }); toast.success('Товар удалён'); setDeleteId(null) },
    onError: () => toast.error('Ошибка'),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medical-text-primary">Склад и товары</h1>
          <p className="text-sm text-medical-text-secondary">Всего: {total} позиций</p>
        </div>
        <Button icon={PlusCircle} onClick={() => { setSelected(null); setFormOpen(true) }}>
          Добавить товар
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Внимание: {lowStock.length} позиций с низким запасом</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {lowStock.slice(0, 3).map((i) => i.name).join(', ')}{lowStock.length > 3 ? ` и ещё ${lowStock.length - 3}...` : ''}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
          {CATEGORY_TABS.map((t) => (
            <button key={t.id} onClick={() => setCategory(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${category === t.id ? 'bg-medical-primary text-white' : 'text-medical-text-secondary hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..." className="pl-9 pr-4 py-2 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary" />
        </div>
      </div>

      <Card>
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Наименование', 'Категория', 'Кол-во', 'Ед.', 'Цена', 'Поставщик', 'Закупка', 'Годен до', 'Статус', ''].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${item.status === 'low-stock' ? 'bg-amber-50/30' : item.status === 'out-of-stock' ? 'bg-red-50/30' : ''}`}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Package size={13} className="text-medical-primary" />
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="table-cell"><Badge variant={categoryVariants[item.category] || 'gray'}>{categoryLabels[item.category] || item.category}</Badge></td>
                    <td className={`table-cell font-semibold ${item.qty === 0 ? 'text-red-500' : item.qty <= item.min_qty ? 'text-amber-600' : ''}`}>{item.qty}</td>
                    <td className="table-cell text-medical-text-secondary">{item.unit}</td>
                    <td className="table-cell">{item.price ? `${item.price.toLocaleString()} ₽` : '—'}</td>
                    <td className="table-cell text-medical-text-secondary">{item.supplier || '—'}</td>
                    <td className="table-cell text-medical-text-secondary">{item.purchase_date || '—'}</td>
                    <td className="table-cell text-medical-text-secondary">{item.expiry_date || '—'}</td>
                    <td className="table-cell"><StatusBadge status={item.status} /></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelected(item); setFormOpen(true) }} className="p-1.5 rounded hover:bg-yellow-50 text-gray-400 hover:text-amber-500"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-medical-danger"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-12 text-sm text-medical-text-secondary">Товары не найдены</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-medical-text-secondary">Показано {filtered.length} из {total}</p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      <WarehouseForm open={formOpen} onClose={() => setFormOpen(false)} item={selected} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} loading={deleteMut.isPending} message="Удалить этот товар?" />
    </div>
  )
}
