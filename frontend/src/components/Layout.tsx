import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ChatbotFloat } from './ChatbotFloat'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main className="ml-0 md:ml-64 pt-[120px] md:pt-24 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
      <ChatbotFloat />
    </div>
  )
}
