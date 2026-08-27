import type { Metadata, Viewport } from 'next'
import { Manrope, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const manrope = Manrope({ 
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '600', '700', '800'],
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'The Editorial Studio | Weekly Operations Command Center',
  description: 'Video Operations Dashboard - Manage projects, team workload, and deadlines',
}

export const viewport: Viewport = {
  themeColor: '#742fe5',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
