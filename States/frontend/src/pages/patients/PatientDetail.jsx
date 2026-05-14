import { useQuery } from '@tanstack/react-query'
import { Phone, Mail, MapPin, Droplets, Heart, AlertCircle, Calendar, Edit2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { patientsAPI } from '../../services/endpoints'

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-medical-primary" />
      </div>
      <div>
        <p className="text-xs text-medical-text-secondary">{label}</p>
        <p className="text-sm font-medium text-medical-text-primary">{value}</p>
      </div>
    </div>
  )
}

export default function PatientDetail({ open, onClose, patientId, onEdit }) {
  const { data, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsAPI.getById(patientId).then((r) => r.data),
    enabled: open && !!patientId,
  })

  const { data: appts } = useQuery({
    queryKey: ['patient-appointments', patientId],
    queryFn: () => patientsAPI.getAppointments(patientId).then((r) => r.data),
    enabled: open && !!patientId,
  })

  const patient = data
  const appointments = appts || []

  const genderMap = { male: 'Мужской', female: 'Женский' }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Карточка пациента"
      size="xl"
      footer={
        <Button icon={Edit2} onClick={() => { onClose(); onEdit(patient) }}>
          Редактировать
        </Button>
      }
    >
      {isLoading ? (
        <PageLoader />
      ) : patient ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
            <Avatar name={patient.full_name} size="xl" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-medical-text-primary">{patient.full_name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="blue">ID: {patient.id}</Badge>
                <Badge variant={patient.blood_type?.includes('+') ? 'red' : 'gray'}>
                  {patient.blood_type}
                </Badge>
                <Badge variant="gray">{genderMap[patient.gender] || patient.gender}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal info */}
            <div>
              <h3 className="text-sm font-semibold text-medical-text-secondary uppercase tracking-wider mb-3">
                Личные данные
              </h3>
              <div className="divide-y divide-gray-50">
                <InfoRow icon={Phone} label="Телефон" value={patient.phone} />
                <InfoRow icon={Mail} label="Email" value={patient.email} />
                <InfoRow icon={Calendar} label="Дата рождения" value={patient.date_of_birth} />
                <InfoRow icon={MapPin} label="Адрес" value={patient.address} />
                <InfoRow icon={Phone} label="Экстренный контакт" value={patient.emergency_contact} />
              </div>
            </div>

            {/* Medical info */}
            <div>
              <h3 className="text-sm font-semibold text-medical-text-secondary uppercase tracking-wider mb-3">
                Медицинская информация
              </h3>
              <div className="space-y-3">
                {patient.allergies && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle size={14} className="text-medical-danger" />
                      <span className="text-xs font-semibold text-medical-danger">Аллергии</span>
                    </div>
                    <p className="text-sm text-medical-text-primary">{patient.allergies}</p>
                  </div>
                )}
                {patient.chronic_diseases && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart size={14} className="text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700">Хронические заболевания</span>
                    </div>
                    <p className="text-sm text-medical-text-primary">{patient.chronic_diseases}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Appointment history */}
          <div>
            <h3 className="text-sm font-semibold text-medical-text-secondary uppercase tracking-wider mb-3">
              История приёмов ({appointments.length})
            </h3>
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-sm text-medical-text-secondary bg-gray-50 rounded-xl">
                История приёмов пуста
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {appointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-medical-text-primary">{a.problem || 'Консультация'}</p>
                      <p className="text-xs text-medical-text-secondary">
                        Врач: {a.doctor_name} · {a.date} {a.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={a.status} />
                      {a.payment && <p className="text-xs text-medical-text-primary font-medium mt-1">{a.payment.toLocaleString()} ₽</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-medical-text-secondary">Пациент не найден</div>
      )}
    </Modal>
  )
}
