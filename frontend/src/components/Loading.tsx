import { Loader } from 'lucide-react'

interface LoadingProps {
  fullScreen?: boolean
  message?: string
}

export function Loading({ fullScreen = false, message = 'Cargando...' }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader size={40} className="text-primary-600 animate-spin" />
      <p className="text-gray-600">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return <div className="py-12">{content}</div>
}
