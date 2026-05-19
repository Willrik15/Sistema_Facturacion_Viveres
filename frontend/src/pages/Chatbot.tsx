import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { MessageCircle, Send } from 'lucide-react'
import { chatbotService } from '@/services/chatbot'

interface Message {
  type: 'user' | 'bot'
  text: string
  timestamp: Date
}

export function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      text: 'Hola. Soy tu asistente. Puedo ayudarte a buscar productos, consultar precios, stock y deudas pendientes. ¿Qué necesitas?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    // Agregar mensaje del usuario
    const userMessage: Message = {
      type: 'user',
      text: input,
      timestamp: new Date(),
    }
    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    try {
      const respuesta = await chatbotService.enviarMensaje(input)
      const botMessage: Message = {
        type: 'bot',
        text: respuesta.respuesta,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch {
      const botMessage: Message = {
        type: 'bot',
        text: 'Error al conectar con el asistente. Intenta de nuevo.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Asistente de Inteligencia Artificial</h1>
          <p className="text-gray-600 mt-1">Consulta productos, precios, stock y más</p>
        </div>

        <Card className="h-[600px] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <p className="text-sm text-gray-900">Escribiendo...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Escribe tu pregunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                variant="primary"
              >
                <Send size={20} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Intenta: "¿Tienes leche?", "Precio del pan", "Stock de arroz", "Deudas"
            </p>
          </div>
        </Card>

        {/* Ejemplos */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-soft-lg transition-shadow">
            <div className="flex items-start gap-3">
              <MessageCircle size={24} className="text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Buscar Productos</h3>
                <p className="text-sm text-gray-600 mt-1">
                  "¿Tienes leche?" "Busco pan integral"
                </p>
              </div>
            </div>
          </Card>

          <Card className="cursor-pointer hover:shadow-soft-lg transition-shadow">
            <div className="flex items-start gap-3">
              <MessageCircle size={24} className="text-success-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Consultar Deudas</h3>
                <p className="text-sm text-gray-600 mt-1">
                  "Deudas pendientes" "Mostrar fíos"
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
