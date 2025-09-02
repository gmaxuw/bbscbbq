/**
 * 🛡️ FINAL NAVIGATION DESIGN - DO NOT MODIFY 🛡️
 * 
 * This navigation is LOCKED and should NEVER be changed:
 * - Floating navbar with glassmorphism effect
 * - Transparent at top, white/glass when scrolled
 * - Compact width (max-w-5xl) - Cursor-inspired design
 * - Branding: "Surigao City BBQ Stalls" - CENTERED, NO LOGO
 * - Dynamic text colors (white at top, dark when scrolled)
 * - Smooth transitions and hover effects
 * - Mobile-responsive with hamburger menu
 * - Clean, minimal design with only essential elements
 * 
 * ⚠️  WARNING: Any changes to this navigation will break consistency across ALL pages
 * 🔒  STATUS: LOCKED - Final design approved by user
 * 📍  LOCATION: Applied globally to all pages (except 404 which has its own)
 * 🎯  PURPOSE: Maintain brand consistency and professional floating navbar
 * 
 * If you need to modify the navigation, you MUST:
 * 1. Get explicit user approval
 * 2. Update ALL pages that use this component
 * 3. Test consistency across the entire website
 * 4. Document the changes in this comment block
 * 5. Ensure the 404 page navbar matches exactly
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { getTotalItems } = useCart()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-4 left-32 right-32 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-white/20' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between h-16 lg:h-20 px-8">
          {/* Branding - Left Side */}
          <Link href="/" className="text-center group">
            <h1 className={`font-bbq-fredoka text-lg lg:text-xl font-bold transition-all duration-300 ${
              isScrolled 
                ? 'text-gray-900 drop-shadow-sm' 
                : 'text-white drop-shadow-lg'
            } tracking-wide`}>
              SURIGAO CITY
            </h1>
            <p className={`text-xs lg:text-sm font-medium transition-all duration-300 ${
              isScrolled 
                ? 'text-lays-dark-red drop-shadow-sm' 
                : 'text-lays-orange-gold drop-shadow-lg'
            } tracking-wide`}>
              BBQ Stalls
            </p>
          </Link>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link 
              href="/cart" 
              className={`relative p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                isScrolled 
                  ? 'bg-lays-orange-gold/10 hover:bg-lays-orange-gold/20 text-lays-dark-red' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {/* Cart Badge - Shows item count */}
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-lays-bright-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {/* User Icon */}
            <Link 
              href="/account"
              className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                isScrolled 
                  ? 'bg-lays-orange-gold/10 hover:bg-lays-orange-gold/20 text-lays-dark-red' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm animate-fade-in rounded-b-2xl">
            <div className="px-6 py-6 space-y-4">
              {/* Mobile menu content removed - Order Now button moved to Hero */}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
