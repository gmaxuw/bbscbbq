/**
 * 🛡️ FINAL FOOTER DESIGN - DO NOT MODIFY 🛡️
 * 
 * This footer is LOCKED and should NEVER be changed:
 * - Compact single-line design
 * - Red background (bg-lays-dark-red)
 * - Copyright + Privacy Policy + Terms of Service
 * - py-4 padding (compact)
 * - White text with separators
 * 
 * ⚠️  WARNING: Any changes to this footer will break consistency across ALL pages
 * 🔒  STATUS: LOCKED - Final design approved by user
 * 📍  LOCATION: Applied globally to all pages
 * 🎯  PURPOSE: Maintain brand consistency and professional appearance
 * 
 * If you need to modify the footer, you MUST:
 * 1. Get explicit user approval
 * 2. Update ALL pages that use this component
 * 3. Test consistency across the entire website
 * 4. Document the changes in this comment block
 */

import Link from 'next/link'

export default function Footer() {
  return (
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
  )
}
