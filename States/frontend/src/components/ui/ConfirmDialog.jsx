import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Подтвердите действие', message, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle size={28} className="text-medical-danger" />
        </div>
        <p className="text-sm text-medical-text-secondary leading-relaxed">
          {message || 'Вы уверены, что хотите выполнить это действие? Его нельзя отменить.'}
        </p>
        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>
            Удалить
          </Button>
        </div>
      </div>
    </Modal>
  )
}
