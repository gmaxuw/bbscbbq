/**
 * 🛡️ FINAL HOMEPAGE DESIGN - DO NOT MODIFY 🛡️
 * 
 * This homepage is LOCKED and should NEVER be changed:
 * - Navigation component with floating navbar
 * - Hero Section with image carousel and loading screen
 * - Featured Menu with interactive ordering
 * - Branch Locations showcase
 * - Footer with clean design
 * - Complete user experience flow
 * - Professional BBQ restaurant presentation
 * 
 * ⚠️  WARNING: Any changes to this homepage will break the entire user experience
 * 🔒  STATUS: LOCKED - Final design approved by user
 * 📍  LOCATION: Main homepage (/) route
 * 🎯  PURPOSE: Create stunning first impression and drive customer engagement
 * 
 * If you need to modify the homepage, you MUST:
 * 1. Get explicit user approval
 * 2. Test all sections thoroughly
 * 3. Ensure navigation and interactions work
 * 4. Document the changes in this comment block
 * 5. Maintain the professional appearance and flow
 */

import Navigation from '@/components/layout/Navigation'
import HeroSection from '@/components/home/HeroSection'
import FeaturedMenu from '@/components/home/FeaturedMenu'
import Footer from '@/components/layout/Footer'

export default function Home() {
  return (
    <main>
      <Navigation />
      <HeroSection />
      <FeaturedMenu />
      <Footer />
    </main>
  )
}
