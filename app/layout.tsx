import React from "react"
import type { Metadata } from 'next'
import { Geist_Mono, Bangers, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthRefresher } from '@/components/app/auth-refresher'

const _bangers = Bangers({ weight: '400', subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Manga Studio - Create AI Manga Art',
  description: 'Generate stunning manga illustrations with AI. Design custom manga pages with professional inking styles, screentones, and layouts.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/logo.png',
        type: 'image/png',
      },
    ],
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-zinc-950 text-white`}>
        <AuthRefresher />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
