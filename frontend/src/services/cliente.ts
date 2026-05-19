import apiClient from './api'

export type TipoIdentificacion = 'CEDULA' | 'RUC' | 'PASAPORTE' | 'FINAL'

export interface Cliente {
  id: number
  nombre: string
  cedula: string
  tipoIdentificacion: TipoIdentificacion
  email?: string
  telefono?: string
  direccion?: string
}

export interface CreateClienteRequest {
  nombre: string
  cedula: string
  tipoIdentificacion: TipoIdentificacion
  email?: string
  telefono?: string
  direccion?: string
}

export interface ClienteResponse {
  data: Cliente[]
  meta: {
    total: number
    page: number
    lastPage: number
  }
}

export const CONSUMIDOR_FINAL: Omit<Cliente, 'id'> = {
  nombre: 'Consumidor Final',
  cedula: '9999999999999',
  tipoIdentificacion: 'FINAL',
}

export const clienteService = {
  getAll: async (page = 1, limit = 10, search = '') => {
    const { data } = await apiClient.get<ClienteResponse>('/clientes', {
      params: { page, limit, search },
    })
    return data
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<Cliente>(`/clientes/${id}`)
    return data
  },

  create: async (cliente: CreateClienteRequest) => {
    const { data } = await apiClient.post<Cliente>('/clientes', cliente)
    return data
  },

  update: async (id: number, cliente: Partial<CreateClienteRequest>) => {
    const { data } = await apiClient.put<Cliente>(`/clientes/${id}`, cliente)
    return data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/clientes/${id}`)
  },
}

