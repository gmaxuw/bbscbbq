/**
 * 🛡️ FINAL HERO SECTION DESIGN - DO NOT MODIFY 🛡️
 * 
 * This hero section is LOCKED and should NEVER be changed:
 * - Image carousel with 3 BBQ images
 * - Loading screen with progress bar
 * - Branding: "Surigao City BBQ Stalls"
 * - Key benefits: Advance Order, Locations, Premium Quality
 * - CTA button: Enhanced Order Now (single, prominent button)
 * - Trust indicators: Menu Items, Branch Locations, Fresh & Local
 * - Smooth animations and transitions
 * - Professional loading experience
 * 
 * ⚠️  WARNING: Any changes to this hero section will break the homepage design
 * 🔒  STATUS: LOCKED - Final design approved by user
 * 📍  LOCATION: Homepage main banner section
 * 🎯  PURPOSE: Create stunning first impression and drive customer action
 * 
 * If you need to modify the hero section, you MUST:
 * 1. Get explicit user approval
 * 2. Test the loading experience thoroughly
 * 3. Ensure image carousel still works perfectly
 * 4. Document the changes in this comment block
 * 5. Maintain the professional loading screen
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, Star, Clock, MapPin, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface HeroSettings {
  id: number
  title: string
  subtitle: string
  description: string
  badge_text: string
  button_text: string
  button_link: string
  show_badge: boolean
  show_features: boolean
  show_trust_indicators: boolean
  image_1_url: string | null
  image_2_url: string | null
  image_3_url: string | null
  feature_1_text: string
  feature_2_text: string
  feature_3_text: string
  trust_item_1_number: string
  trust_item_1_label: string
  trust_item_2_number: string
  trust_item_2_label: string
  trust_item_3_number: string
  trust_item_3_label: string
}

export default function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [settings, setSettings] = useState<HeroSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  
  // Default images as fallback
  const defaultImages = [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=1200&h=800&fit=crop&crop=center&auto=format&q=80',
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=1200&h=800&fit=crop&crop=center&auto=format&q=80'
  ]

  // Get hero images from settings or use defaults
  const heroImages = settings ? [
    settings.image_1_url || defaultImages[0],
    settings.image_2_url || defaultImages[1],
    settings.image_3_url || defaultImages[2]
  ] : defaultImages

  // Fallback images in case external images fail
  const fallbackImages = [
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDgwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjOEI0NTEzIi8+Cjx0ZXh0IHg9IjYwMCIgeT0iNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4Ij5CQlEgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDgwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjQzQ0NDQ0Ii8+Cjx0ZXh0IHg9IjYwMCIgeT0iNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4Ij5CQlEgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDgwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjQjI2NjMzIi8+Cjx0ZXh0IHg9IjYwMCIgeT0iNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4Ij5CQlEgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo='
  ]

  // Fetch hero settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('hero_settings')
          .select('*')
          .eq('id', 1)
          .single()

        if (error) {
          console.error('Error fetching hero settings:', error)
          console.error('Error details:', error.message, error.details, error.hint)
          // Use default settings if fetch fails
          setSettings({
            id: 1,
            title: 'Surigao City',
            subtitle: 'BBQ Stalls',
            description: 'Experience the authentic taste of slow-smoked BBQ perfection. Every bite tells a story of tradition, passion, and fire.',
            badge_text: '#1 BBQ Restaurant in Surigao',
            button_text: 'ORDER NOW',
            button_link: '/cart',
            show_badge: true,
            show_features: true,
            show_trust_indicators: true,
            image_1_url: null,
            image_2_url: null,
            image_3_url: null,
            feature_1_text: '2+ Hours Advance Order',
            feature_2_text: '4 Convenient Locations',
            feature_3_text: 'Premium Quality',
            trust_item_1_number: '15+',
            trust_item_1_label: 'Menu Items',
            trust_item_2_number: '4',
            trust_item_2_label: 'Branch Locations',
            trust_item_3_number: '100%',
            trust_item_3_label: 'Fresh & Local'
          })
        } else {
          console.log('Hero settings loaded successfully:', data)
          setSettings(data)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setSettingsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Preload images and track loading progress
  useEffect(() => {
    if (settingsLoading) return // Don't start image loading until settings are loaded
    let loadedCount = 0
    const totalImages = heroImages.length

    const preloadImage = (src: string, index: number) => {
      return new Promise((resolve) => {
        const img = new Image()
        
        // Set a timeout for each individual image
        const imageTimeout = setTimeout(() => {
          console.warn(`Image ${index + 1} loading timeout, using fallback`)
          loadedCount++
          setLoadingProgress((loadedCount / totalImages) * 100)
          if (loadedCount === totalImages) {
            setImagesLoaded(true)
          }
          resolve(null)
        }, 5000) // 5 second timeout per image (increased from 3s)
        
        img.onload = () => {
          clearTimeout(imageTimeout)
          loadedCount++
          setLoadingProgress((loadedCount / totalImages) * 100)
          if (loadedCount === totalImages) {
            setImagesLoaded(true)
          }
          resolve(img)
        }
        
        img.onerror = (error) => {
          clearTimeout(imageTimeout)
          console.warn(`Failed to load image ${index + 1}:`, src)
          // Still count as loaded to prevent infinite loading
          loadedCount++
          setLoadingProgress((loadedCount / totalImages) * 100)
          if (loadedCount === totalImages) {
            setImagesLoaded(true)
          }
          resolve(null) // Resolve with null instead of rejecting
        }
        
        // Add crossOrigin to handle CORS issues
        img.crossOrigin = 'anonymous'
        img.src = src
      })
    }

    // Preload all images with timeout
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn('Overall image preloading timeout - showing content anyway')
        setImagesLoaded(true)
        resolve(null)
      }, 12000) // 12 second overall timeout (increased from 8s)
    })

    Promise.race([
      Promise.all(heroImages.map(preloadImage)),
      timeoutPromise
    ]).catch(error => {
      console.error('Error preloading images:', error)
      // Fallback: show content even if images fail
      setImagesLoaded(true)
    })
  }, [heroImages, settingsLoading])

  useEffect(() => {
    if (!imagesLoaded) return

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroImages.length, imagesLoaded])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Loading State */}
      {(!imagesLoaded || settingsLoading) && (
        <div className="absolute inset-0 z-20 bg-lays-dark-red flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg font-medium mb-2">Loading BBQ Experience...</div>
            <div className="w-64 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-white/80 mt-2">{Math.round(loadingProgress)}%</div>
          </div>
        </div>
      )}

      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${image}), url(${fallbackImages[index]})`,
                backgroundPosition: 'center center',
                backgroundColor: index === 0 ? '#8B4513' : index === 1 ? '#C44444' : '#B26633' // Different fallback colors
              }}
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className={`relative z-10 bbq-container text-center text-white px-4 transition-opacity duration-500 ${
        imagesLoaded && !settingsLoading ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          {settings?.show_badge && (
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/30 animate-slide-up">
              <Star className="w-5 h-5 text-lays-orange-gold fill-current" />
              <span className="font-medium">{settings.badge_text}</span>
            </div>
          )}

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bbq-display font-bold mb-6 leading-tight animate-slide-up">
            <span className="block">{settings?.title || 'Surigao City'}</span>
            <span className="block bbq-gradient-text bg-gradient-to-r from-lays-orange-gold to-lays-bright-red bg-clip-text text-transparent">
              {settings?.subtitle || 'BBQ Stalls'}
            </span>
          </h1>
          
          {/* Debug info - remove this after testing */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-white/50 mb-4">
              Debug: Title="{settings?.title}", Subtitle="{settings?.subtitle}"
            </div>
          )}

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            {settings?.description || 'Experience the authentic taste of slow-smoked BBQ perfection. Every bite tells a story of tradition, passion, and fire.'}
          </p>

          {/* Features */}
          {settings?.show_features && (
            <div className="flex flex-wrap justify-center items-center gap-6 mb-12 text-sm animate-slide-up">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-lays-orange-gold" />
                <span>{settings.feature_1_text}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-lays-orange-gold" />
                <span>{settings.feature_2_text}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-lays-orange-gold fill-current" />
                <span>{settings.feature_3_text}</span>
              </div>
            </div>
          )}

          {/* Enhanced Order Now Button */}
          <div className="flex justify-center items-center animate-slide-up">
            <Link 
              href={settings?.button_link || '/cart'} 
              className="bbq-button-primary text-lg md:text-xl px-8 py-4 group relative overflow-hidden shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              {/* Button Background Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-lays-bright-red via-lays-dark-red to-lays-bright-red opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Button Content */}
              <div className="relative flex items-center justify-center space-x-3">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                <span className="font-bold tracking-wide">{settings?.button_text || 'ORDER NOW'}</span>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              
              {/* Hover Animation Ring */}
              <div className="absolute inset-0 border-2 border-white/30 rounded-xl group-hover:border-white/60 transition-all duration-300"></div>
            </Link>
          </div>

          {/* Trust Indicators */}
          {settings?.show_trust_indicators && (
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-gray-300 animate-slide-up">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{settings.trust_item_1_number}</div>
                <div className="text-sm">{settings.trust_item_1_label}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{settings.trust_item_2_number}</div>
                <div className="text-sm">{settings.trust_item_2_label}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{settings.trust_item_3_number}</div>
                <div className="text-sm">{settings.trust_item_3_label}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce-gentle transition-opacity duration-500 ${
        imagesLoaded && !settingsLoading ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse-slow"></div>
        </div>
      </div>
    </section>
  )
}
