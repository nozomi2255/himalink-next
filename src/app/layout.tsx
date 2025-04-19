import { Metadata } from 'next'
import { CalendarProvider } from '@/contexts/calendar-context'

export const metadata: Metadata = {
  title: 'Himalink Calendar',
  description: 'カレンダーアプリケーション',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Himalink Calendar'
  },
  icons: {
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <CalendarProvider>
          {children}
        </CalendarProvider>
      </body>
    </html>
  );
} 