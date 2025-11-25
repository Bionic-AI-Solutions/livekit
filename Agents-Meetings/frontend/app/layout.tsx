import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/toast/ToastProvider'
import '@livekit/components-styles'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Multilingual Meeting Platform',
  description: 'Platform for multilingual meetings with AI avatars',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}

