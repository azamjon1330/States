import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Send, Search, MessageSquare, Circle } from 'lucide-react'
import { chatAPI } from '../../services/endpoints'
import { useSocket } from '../../hooks/useSocket'
import { useAuthStore } from '../../store/authStore'
import Avatar from '../../components/ui/Avatar'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

const mockConversations = [
  { id: 1, name: 'Акбаров Тимур', role: 'Кардиолог', lastMessage: 'Хорошо, я посмотрю результаты анализов', time: new Date(Date.now() - 300000).toISOString(), unread: 2, online: true },
  { id: 2, name: 'Садыкова Гулноза', role: 'Хирург', lastMessage: 'Пациент готов к операции', time: new Date(Date.now() - 1800000).toISOString(), unread: 0, online: true },
  { id: 3, name: 'Рашидов Бобур', role: 'Невролог', lastMessage: 'Нужна консультация по пациенту', time: new Date(Date.now() - 7200000).toISOString(), unread: 1, online: false },
  { id: 4, name: 'Камолова Нилуфар', role: 'Терапевт', lastMessage: 'Результаты готовы', time: new Date(Date.now() - 86400000).toISOString(), unread: 0, online: false },
  { id: 5, name: 'Общий чат', role: 'Группа', lastMessage: 'Совещание в 15:00', time: new Date(Date.now() - 3600000).toISOString(), unread: 5, online: true, isGroup: true },
]


function formatMsgTime(time) {
  try { return formatDistanceToNow(new Date(time), { addSuffix: true, locale: ru }) }
  catch { return '' }
}

export default function Chat() {
  const user = useAuthStore((s) => s.user)
  const [selectedConv, setSelectedConv] = useState(null)
  const [inputText, setInputText] = useState('')
  const [localMessages, setLocalMessages] = useState([])
  const [search, setSearch] = useState('')
  const bottomRef = useRef(null)

  const { connected, messages: wsMessages, sendMessage } = useSocket(selectedConv?.id)

  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatAPI.getConversations().then((r) => r.data),
  })

  const { data: messagesData, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', selectedConv?.id],
    queryFn: () => chatAPI.getMessages(selectedConv.id).then((r) => r.data),
    enabled: !!selectedConv,
  })

  const conversations = Array.isArray(conversationsData) ? conversationsData
    : Array.isArray(conversationsData?.data) ? conversationsData.data
    : Array.isArray(conversationsData?.items) ? conversationsData.items
    : mockConversations
  const filteredConvs = search
    ? conversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : conversations

  const messages = Array.isArray(messagesData) ? messagesData
    : Array.isArray(messagesData?.data) ? messagesData.data
    : Array.isArray(messagesData?.items) ? messagesData.items
    : []
  const allMessages = [...messages, ...localMessages]

  useEffect(() => {
    if (wsMessages.length > 0) {
      const last = wsMessages[wsMessages.length - 1]
      setLocalMessages((prev) => {
        const alreadyExists = prev.some((m) => m.id === last.id)
        if (alreadyExists) return prev
        return [...prev, {
          id: last.id || Date.now(),
          sender_name: last.sender_name || last.name || 'Собеседник',
          content: last.content || last.message || '',
          time: last.time || last.created_at || new Date().toISOString(),
          mine: false,
        }]
      })
    }
  }, [wsMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages])

  const handleSend = () => {
    if (!inputText.trim() || !selectedConv) return
    const msg = { id: Date.now(), sender_name: user?.full_name || 'Я', content: inputText, time: new Date().toISOString(), mine: true }
    setLocalMessages((prev) => [...prev, msg])
    sendMessage(inputText)
    setInputText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="h-[calc(100vh-130px)] flex bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-medical-text-primary mb-3">Чат</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? <PageLoader /> : filteredConvs.map((conv) => (
            <button key={conv.id} onClick={() => { setSelectedConv(conv); setLocalMessages([]) }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedConv?.id === conv.id ? 'bg-blue-50' : ''}`}>
              <div className="relative flex-shrink-0">
                <Avatar name={conv.name} size="sm" />
                {conv.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-medical-text-primary truncate">{conv.name}</p>
                  <p className="text-xs text-gray-400 flex-shrink-0 ml-1">
                    {conv.time && new Date(conv.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-xs text-medical-text-secondary">{conv.role}</p>
                <p className="text-xs text-medical-text-secondary truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="flex-shrink-0 bg-medical-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{conv.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white">
            <div className="relative">
              <Avatar name={selectedConv.name} size="sm" />
              {selectedConv.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-medical-text-primary">{selectedConv.name}</p>
              <div className="flex items-center gap-1.5">
                <Circle size={8} className={selectedConv.online ? 'text-green-400 fill-green-400' : 'text-gray-300 fill-gray-300'} />
                <p className="text-xs text-medical-text-secondary">{selectedConv.online ? 'Онлайн' : 'Не в сети'}</p>
                {connected && <span className="text-xs text-green-600 ml-2">● Подключено</span>}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
            {msgsLoading ? <PageLoader /> : allMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg flex flex-col gap-0.5 ${msg.mine ? 'items-end' : 'items-start'}`}>
                  {!msg.mine && <p className="text-xs text-medical-text-secondary px-1">{msg.sender_name}</p>}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.mine ? 'bg-medical-primary text-white rounded-br-sm' : 'bg-white text-medical-text-primary rounded-bl-sm shadow-sm border border-gray-100'}`}>
                    {msg.content}
                  </div>
                  <p className="text-xs text-gray-400 px-1">{formatMsgTime(msg.time)}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="px-5 py-3 border-t border-gray-100 bg-white">
            <div className="flex items-end gap-3">
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Введите сообщение... (Enter для отправки)" rows={1}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-medical-primary resize-none"
                style={{ minHeight: '42px', maxHeight: '100px' }} />
              <button onClick={handleSend} disabled={!inputText.trim()}
                className="w-10 h-10 flex-shrink-0 bg-medical-primary text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-medical-text-secondary gap-3">
          <MessageSquare size={48} className="text-gray-200" />
          <p className="text-base font-medium">Выберите разговор</p>
          <p className="text-sm text-gray-400">Выберите контакт из списка слева</p>
        </div>
      )}
    </div>
  )
}
