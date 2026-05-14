import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'

export function useSocket(roomId) {
  const token = useAuthStore((s) => s.token)
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [reconnectCount, setReconnectCount] = useState(0)

  const connect = useCallback(() => {
    if (!token || !roomId) return
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.host
    const url = `${proto}://${host}/api/chat/ws?room=${roomId}&token=${token}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setReconnectCount(0)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        setMessages((prev) => [...prev, msg])
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      setConnected(false)
      // Exponential backoff reconnect
      const delay = Math.min(1000 * 2 ** reconnectCount, 30000)
      reconnectRef.current = setTimeout(() => {
        setReconnectCount((c) => c + 1)
        connect()
      }, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [token, roomId, reconnectCount])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [roomId]) // eslint-disable-line

  const sendMessage = useCallback((content) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content, type: 'text' }))
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return { connected, messages, sendMessage, clearMessages }
}
