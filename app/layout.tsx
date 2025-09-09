import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import DesignLock from '@/components/layout/DesignLock'
import { CartProvider } from '@/lib/cart-context'
import { FavoritesProvider } from '@/lib/favorites-context'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Smoke & Fire BBQ - Premium BBQ Restaurant',
  description: 'Experience the finest BBQ in town with our signature smoked meats, fresh sides, and authentic flavors. Order online for pickup at any of our 4 locations.',
  keywords: 'BBQ, restaurant, smoked meat, online ordering, Surigao, Philippines',
  authors: [{ name: 'Smoke & Fire BBQ' }],
  openGraph: {
    title: 'Smoke & Fire BBQ - Premium BBQ Restaurant',
    description: 'Experience the finest BBQ in town with our signature smoked meats, fresh sides, and authentic flavors.',
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
      </head>
      <body className="font-bbq-body bg-white text-gray-900 antialiased" suppressHydrationWarning={true}>
        <DesignLock pageName="Global Layout" />
        <CartProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  )
}
