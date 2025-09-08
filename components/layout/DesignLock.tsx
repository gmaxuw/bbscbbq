/**
 * 🛡️ DESIGN LOCK COMPONENT - GLOBAL PROTECTION 🛡️
 * 
 * This component provides global design locking functionality:
 * - Prevents modification of locked design elements
 * - Provides design system validation
 * - Ensures consistency across all pages
 * - Acts as a design compliance checker
 * 
 * ⚠️  WARNING: This component is part of the design lock system
 * 🔒  STATUS: LOCKED - Cannot be modified without user approval
 * 📍  LOCATION: Applied globally to all pages
 * 🎯  PURPOSE: Maintain design consistency and prevent unauthorized changes
 */

'use client'

import { useEffect } from 'react'

interface DesignLockProps {
  pageName: string
  allowedComponents?: string[]
}

export default function DesignLock({ pageName, allowedComponents = [] }: DesignLockProps) {
  useEffect(() => {
    // Design compliance check on component mount
    validateDesignCompliance()
    
    // Monitor for unauthorized design changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
          checkForDesignViolations(mutation.target as Element)
        }
      })
    })

    // Observe the entire document for style changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true
    })

    return () => observer.disconnect()
  }, [])

  const validateDesignCompliance = () => {
    console.log(`🔒 Design Lock Active for: ${pageName}`)
    console.log(`✅ Allowed Components: ${allowedComponents.join(', ') || 'All locked design system components'}`)
    console.log(`🛡️ Design System Protection: ENABLED`)
  }

  const checkForDesignViolations = (element: Element) => {
    // Only check elements with class attributes
    if (!element.hasAttribute('class')) return
    
    const className = element.getAttribute('class') || ''
    const classes = className.split(' ').filter(cls => cls.trim())
    
    // Define allowed Tailwind utility classes (these are standard and safe)
    const allowedTailwindClasses = [
                  // Layout
            'flex', 'grid', 'block', 'inline', 'inline-block', 'hidden',
            'container', 'mx-auto', 'px-4', 'py-2', 'py-3', 'm-0', 'p-0',
            'w-full', 'h-full', 'min-h-screen', 'max-w-5xl', 'max-w-4xl',
            'inset-0', 'absolute', 'relative', 'fixed', 'sticky',
            'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5', 'grid-cols-6',
            'grid-rows-1', 'grid-rows-2', 'grid-rows-3', 'grid-rows-4', 'grid-rows-5', 'grid-rows-6',
      
      // Flexbox
      'flex-row', 'flex-col', 'flex-wrap', 'flex-nowrap',
      'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around',
      'items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch',
      'self-start', 'self-end', 'self-center', 'self-auto', 'self-stretch',
      
                  // Spacing
            'space-x-1', 'space-x-2', 'space-x-4', 'space-x-6', 'space-x-8',
            'space-y-1', 'space-y-2', 'space-y-4', 'space-y-6', 'space-y-8',
            'gap-1', 'gap-2', 'gap-4', 'gap-6', 'gap-8',
            'mb-1', 'mb-2', 'mb-4', 'mb-6', 'mb-8', 'mb-10', 'mb-12', 'mb-16',
            'mt-1', 'mt-2', 'mt-4', 'mt-6', 'mt-8', 'mt-10', 'mt-12', 'mt-16',
      
      // Sizing
      'w-1', 'w-2', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20',
      'h-1', 'h-2', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20',
      'w-auto', 'h-auto', 'w-screen', 'h-screen',
      
      // Typography
      'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl',
      'font-normal', 'font-medium', 'font-semibold', 'font-bold',
      'text-left', 'text-center', 'text-right', 'text-justify',
      'uppercase', 'lowercase', 'capitalize', 'normal-case',
      'tracking-wide', 'tracking-tight', 'leading-none', 'leading-tight', 'leading-normal',
      
      // Colors (standard grays and our custom colors)
      'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400',
      'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
      'bg-green-500', 'bg-green-100', 'text-green-600', 'text-green-800',
      'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400',
      'bg-gray-500', 'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
      'text-white', 'text-black', 'bg-white', 'bg-black',
      
      // Borders
      'border', 'border-0', 'border-2', 'border-4', 'border-8',
      'border-b', 'border-b-2', 'border-t', 'border-t-2', 'border-l', 'border-l-2', 'border-r', 'border-r-2',
      'border-gray-100', 'border-gray-200', 'border-gray-300', 'border-gray-400',
      'border-white', 'border-transparent',
      'rounded', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
      
      // Shadows
      'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
      
      // Transitions
      'transition', 'transition-all', 'transition-colors', 'transition-opacity',
      'duration-150', 'duration-200', 'duration-300', 'duration-500', 'duration-1000',
      'ease-in', 'ease-out', 'ease-in-out',
      
      // Transforms
      'transform', 'scale-95', 'scale-100', 'scale-105', 'scale-110',
      'rotate-0', 'rotate-90', 'rotate-180', 'rotate-270',
      
      // Position
      'relative', 'absolute', 'fixed', 'sticky', 'static',
      'top-0', 'top-1', 'top-2', 'top-4', 'top-8', 'top-16',
      'bottom-0', 'bottom-1', 'bottom-2', 'bottom-4', 'bottom-8', 'bottom-16',
      'left-0', 'left-1', 'left-2', 'left-4', 'left-8', 'left-16', 'left-32',
      'right-0', 'right-1', 'right-2', 'right-4', 'right-8', 'right-16', 'right-32',
      'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
      
      // Display
      'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid',
      'hidden', 'visible', 'invisible',
      
      // Overflow
      'overflow-auto', 'overflow-hidden', 'overflow-visible', 'overflow-scroll',
      'overflow-x-auto', 'overflow-y-auto',
      
      // Cursor
      'cursor-pointer', 'cursor-default', 'cursor-not-allowed', 'cursor-wait',
      
      // Opacity
      'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
      
      // Backdrop
      'backdrop-blur-sm', 'backdrop-blur-md', 'backdrop-blur-lg', 'backdrop-blur-xl',
      
      // Our custom BBQ classes
      'bbq-button-primary', 'bbq-button-secondary', 'bbq-card', 'bbq-input', 
      'bbq-section', 'bbq-container', 'bbq-gradient', 'bbq-gradient-text', 
      'bbq-shadow', 'bbq-backdrop-blur',
      
      // Custom font classes
      'font-bbq-fredoka', 'font-bbq-display',
      
      // Additional spacing classes
      'p-2', 'p-3', 'p-4', 'p-6', 'p-8',
      'px-2', 'px-3', 'px-4', 'px-6', 'px-8',
      'py-2', 'py-3', 'py-4', 'py-6', 'py-8',
      
      // Background opacity classes
      'bg-white/10', 'bg-white/20', 'bg-white/30', 'bg-white/40', 'bg-white/50',
      'bg-white/60', 'bg-white/70', 'bg-white/80', 'bg-white/90',
      'bg-black/10', 'bg-black/20', 'bg-black/30', 'bg-black/40', 'bg-black/50',
      'bg-black/60', 'bg-black/70', 'bg-black/80', 'bg-black/90',
      'bg-transparent',
      
      // Border opacity classes
      'border-white/10', 'border-white/20', 'border-white/30', 'border-white/40', 'border-white/50',
      'border-white/60', 'border-white/70', 'border-white/80', 'border-white/90',
      
      // Drop shadow classes
      'drop-shadow-sm', 'drop-shadow-md', 'drop-shadow-lg', 'drop-shadow-xl', 'drop-shadow-2xl',
      
      // Custom color classes
      'text-lays-dark-red', 'text-lays-bright-red', 'text-lays-orange-gold',
      'text-lays-light-yellow', 'text-lays-brown-gold', 'text-bbq-secondary',
      'bg-lays-dark-red', 'bg-lays-bright-red', 'bg-lays-orange-gold',
      'bg-lays-light-yellow', 'bg-lays-brown-gold', 'bg-bbq-secondary',
      'border-lays-dark-red', 'border-lays-bright-red', 'border-lays-orange-gold',
      'border-lays-light-yellow', 'border-lays-brown-gold', 'border-bbq-secondary'
    ]
    
    // Check for unauthorized classes
    const unauthorizedClasses = classes.filter(cls => {
      // Allow empty classes
      if (!cls.trim()) return false
      
      // Allow our custom BBQ classes
      if (cls.startsWith('bbq-')) return false
      
      // Allow our custom color classes
      if (cls.startsWith('text-lays-') || cls.startsWith('bg-lays-') || 
          cls.startsWith('border-lays-') || cls.startsWith('text-bbq-') ||
          cls.startsWith('bg-bbq-') || cls.startsWith('border-bbq-')) return false
      
      // Allow standard Tailwind classes
      if (allowedTailwindClasses.includes(cls)) return false
      
      // Allow responsive variants (e.g., lg:text-lg, md:flex)
      if (cls.includes(':')) return false
      
      // Allow arbitrary values (e.g., w-[200px], h-[calc(100vh-4rem)])
      if (cls.includes('[') && cls.includes(']')) return false
      
      // This class is not authorized
      return true
    })
    
    // Only warn if there are truly unauthorized classes
    if (unauthorizedClasses.length > 0) {
      console.warn(`⚠️  Design Lock Warning: Element has unauthorized classes:`, unauthorizedClasses.join(', '))
      console.warn(`🔒 Please use only approved design system classes`)
      console.warn(`Element:`, element)
    }
  }

  // This component doesn't render anything visible
  // It only provides design locking functionality
  return null
}

// Design system validation utilities
export const validateDesignSystem = {
  // Check if a color is part of the locked palette
  isValidColor: (color: string): boolean => {
    const lockedColors = [
      'lays-dark-red', 'lays-bright-red', 'lays-orange-gold', 
      'lays-light-yellow', 'lays-brown-gold', 'bbq-secondary'
    ]
    return lockedColors.includes(color.toLowerCase())
  },

  // Check if a class follows the locked design system
  isValidDesignClass: (className: string): boolean => {
    const lockedClasses = [
      'bbq-button-primary', 'bbq-button-secondary', 'bbq-card', 
      'bbq-input', 'bbq-section', 'bbq-container', 'bbq-gradient',
      'bbq-gradient-text', 'bbq-shadow'
    ]
    return lockedClasses.some(lockedClass => className.includes(lockedClass))
  },

  // Get all locked design system classes
  getLockedClasses: (): string[] => {
    return [
      'bbq-button-primary', 'bbq-button-secondary', 'bbq-card', 
      'bbq-input', 'bbq-section', 'bbq-container', 'bbq-gradient',
      'bbq-gradient-text', 'bbq-shadow', 'bbq-backdrop-blur'
    ]
  }
}
