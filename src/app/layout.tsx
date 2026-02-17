import type { Metadata } from 'next'
import { Manrope, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/ui/navigation-progress'
import './globals.css'

const manrope = Manrope({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Anivise',
  description:
    'AI-powered psychodynamic pattern analysis for leadership decisions',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavigationProgress />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
