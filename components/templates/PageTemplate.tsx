/**
 * 🛡️ PAGE TEMPLATE - DESIGN SYSTEM ENFORCEMENT 🛡️
 * 
 * This template ensures all new pages follow the locked design system:
 * - Enforces consistent layout structure
 * - Uses only locked design classes
 * - Maintains responsive behavior
 * - Provides design compliance validation
 * 
 * ⚠️  WARNING: This template is part of the design lock system
 * 🔒  STATUS: LOCKED - Cannot be modified without user approval
 * 📍  LOCATION: Template for all new pages
 * 🎯  PURPOSE: Ensure design consistency across all new pages
 */

import DesignLock from '@/components/layout/DesignLock'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

interface PageTemplateProps {
  pageName: string
  children: React.ReactNode
  showNavigation?: boolean
  showFooter?: boolean
  customClasses?: string
}

export default function PageTemplate({ 
  pageName, 
  children, 
  showNavigation = true, 
  showFooter = true,
  customClasses = ''
}: PageTemplateProps) {
  return (
    <>
      {/* Design Lock - Prevents unauthorized design changes */}
      <DesignLock pageName={pageName} />
      
      {/* Navigation - Always consistent across pages */}
      {showNavigation && <Navigation />}
      
      {/* Main Content - Enforced design system */}
      <main className={`min-h-screen ${customClasses}`}>
        {/* Page Header - Consistent styling */}
        <div className="bbq-section pt-24">
          <div className="bbq-container">
            {children}
          </div>
        </div>
      </main>
      
      {/* Footer - Always consistent across pages */}
      {showFooter && <Footer />}
    </>
  )
}

// Design system compliant section components
export const PageSection = ({ 
  children, 
  className = '', 
  id = '' 
}: { 
  children: React.ReactNode
  className?: string
  id?: string 
}) => (
  <section id={id} className={`bbq-section ${className}`}>
    <div className="bbq-container">
      {children}
    </div>
  </section>
)

export const PageHeading = ({ 
  title, 
  subtitle = '', 
  className = '' 
}: { 
  title: string
  subtitle?: string
  className?: string 
}) => (
  <div className={`text-center mb-12 ${className}`}>
    <h1 className="font-bbq-display text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
      {title}
    </h1>
    {subtitle && (
      <p className="font-bbq-body text-xl text-bbq-secondary max-w-3xl mx-auto">
        {subtitle}
      </p>
    )}
  </div>
)

export const PageCard = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) => (
  <div className={`bbq-card p-8 ${className}`}>
    {children}
  </div>
)

export const PageButton = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}: { 
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
  [key: string]: any 
}) => {
  const baseClasses = variant === 'primary' ? 'bbq-button-primary' : 'bbq-button-secondary'
  
  return (
    <button className={`${baseClasses} ${className}`} {...props}>
      {children}
    </button>
  )
}
