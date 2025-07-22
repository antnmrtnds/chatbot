import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Viriato Chatbot Snippet',
  description: 'Standalone chatbot snippet for easy website integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  )
} 