import apiClient from './api'

export interface ChatbotMessageRequest {
  mensaje: string
}

export interface ChatbotResponse {
  respuesta: string
  tipo: 'PRODUCTO' | 'CLIENTE' | 'DEUDA' | 'GENERAL' | 'ERROR'
  datos?: any
  timestamp: string
}

export const chatbotService = {
  enviarMensaje: async (mensaje: string) => {
    const { data } = await apiClient.post<ChatbotResponse>('/chatbot/mensaje', {
      mensaje,
    })
    return data
  },

  obtenerEstadisticas: async () => {
    const { data } = await apiClient.get('/chatbot/estadisticas')
    return data
  },
}
