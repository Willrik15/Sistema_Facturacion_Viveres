/**
 * Utilidades para manejo de errores
 */

export interface ApiError {
  message: string
  statusCode?: number
  errors?: Record<string, string[]>
}

export function handleApiError(error: any): ApiError {
  if (error.response?.data) {
    return {
      message: error.response.data.message || 'Error en la solicitud',
      statusCode: error.response.status,
      errors: error.response.data.errors,
    }
  }

  if (error.message) {
    return {
      message: error.message,
    }
  }

  return {
    message: 'Error desconocido',
  }
}

export function getErrorMessage(error: any): string {
  const apiError = handleApiError(error)
  return apiError.message
}

export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n')
}
