import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import { chatbotService } from '@/services/chatbot'

interface Message {
  type: 'user' | 'bot'
  text: string
}

export function ChatbotFloat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      text: 'Hola 👋 Soy tu asistente. Puedes preguntarme sobre productos, precios, stock o deudas.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const handleSend = async () => {
    const texto = input.trim()
    if (!texto || loading) return

    setMessages((prev) => [...prev, { type: 'user', text: texto }])
    setInput('')
    setLoading(true)

    try {
      const res = await chatbotService.enviarMensaje(texto)
      setMessages((prev) => [...prev, { type: 'bot', text: res.respuesta }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: 'bot', text: 'Error al conectar. Intenta de nuevo.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Panel flotante */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary-700 text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold text-sm">Asistente IA</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="hover:bg-primary-600 p-1 rounded-lg transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.type === 'user'
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl rounded-bl-none shadow-sm">
                  <span className="text-sm text-gray-400 animate-pulse">Escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-200 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-40 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>

          {/* Hint */}
          <p className="text-center text-xs text-gray-400 pb-2 bg-white">
            Prueba: "precio del arroz", "stock de aceite", "deudas"
          </p>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open
            ? 'bg-gray-700 hover:bg-gray-800'
            : 'bg-primary-600 hover:bg-primary-700'
        }`}
        title="Asistente IA"
      >
        {open ? (
          <X size={24} className="text-white" />
        ) : (
          <MessageCircle size={24} className="text-white" />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  )
}
