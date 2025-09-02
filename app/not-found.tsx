'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search, MapPin, Menu, X, ShoppingCart } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function NotFound() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="min-h-screen bg-white">
      {/* Custom Navbar for 404 page - perfect design: invisible at top, floating when scrolled */}
      <nav className={`fixed top-4 left-32 right-32 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-white/20' 
          : 'opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center h-16 lg:h-20 px-8">
            {/* Logo - Centered */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-lays-dark-red rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-lg lg:text-xl">🔥</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bbq-display text-xl lg:text-2xl font-bold text-gray-900">
                  Surigao City
                </h1>
                <p className="text-sm font-medium text-lays-dark-red">
                  BBQ Stalls
                </p>
              </div>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* 404 Hero Section - adjusted top padding for floating navbar */}
      <section className="pt-24 pb-16 px-4">
        <div className="bbq-container">
          <div className="text-center max-w-4xl mx-auto">
            {/* 404 Number */}
            <div className="mb-8">
              <h1 className="text-8xl md:text-9xl font-bbq-display font-bold bbq-gradient-text bg-gradient-to-r from-lays-dark-red to-lays-bright-red bg-clip-text text-transparent">
                404
              </h1>
            </div>

            {/* Main Message */}
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bbq-display font-bold text-gray-900 mb-4">
                Oops! Page Not Found
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Looks like this BBQ page got lost in the smoke! 
                Don't worry, we've got plenty of delicious options waiting for you.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/" 
                className="bbq-button-primary text-lg px-8 py-4 group inline-flex items-center"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
              <Link 
                href="/menu" 
                className="bbq-button-secondary text-lg px-8 py-4 group inline-flex items-center"
              >
                <Search className="w-5 h-5 mr-2" />
                Explore Menu
              </Link>
            </div>

            {/* Quick Navigation */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Quick Navigation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link 
                  href="/menu" 
                  className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-lays-dark-red hover:shadow-lg transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-lays-dark-red/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                      <Search className="w-6 h-6 text-lays-dark-red" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Our Menu</h4>
                    <p className="text-sm text-gray-600">Discover delicious BBQ</p>
                  </div>
                </Link>
                
                <Link 
                  href="/locations" 
                  className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-lays-dark-red hover:shadow-lg transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-lays-dark-red/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                      <MapPin className="w-6 h-6 text-lays-dark-red" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Locations</h4>
                    <p className="text-sm text-gray-600">Find us near you</p>
                  </div>
                </Link>
                
                <Link 
                  href="/cart" 
                  className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-lays-dark-red hover:shadow-lg transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-lays-dark-red/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                      <Home className="w-6 h-6 text-lays-dark-red" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Order Now</h4>
                    <p className="text-sm text-gray-600">Start your order</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Fun BBQ Message */}
            <div className="mt-12 p-6 bg-gradient-to-r from-lays-dark-red/10 to-lays-bright-red/10 rounded-2xl border border-lays-dark-red/20">
              <p className="text-lg text-gray-700 font-medium">
                🍖 "Life is short, eat more BBQ!" 🍖
              </p>
              <p className="text-sm text-gray-600 mt-2">
                While you're here, why not check out our latest specials?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🛡️ FOOTER - MUST MATCH MAIN FOOTER COMPONENT 🛡️
          This footer is locked to maintain consistency with the global Footer component.
          Any changes here must also be made to components/layout/Footer.tsx */}
      <footer className="bg-lays-dark-red text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center space-x-6 text-sm">
            <span className="text-white/90">
              © 1979 Surigao City BBQ Stalls. All rights reserved.
            </span>
            <span className="text-white/70">|</span>
            <Link href="/privacy" className="text-white/90 hover:text-white transition-colors duration-200">
              Privacy Policy
            </Link>
            <span className="text-white/70">|</span>
            <Link href="/terms" className="text-white/90 hover:text-white transition-colors duration-200">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
