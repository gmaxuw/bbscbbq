import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import DesignLock from '@/components/layout/DesignLock'
import { ArrowLeft, FileText, Scale, AlertTriangle, Shield, Mail, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Terms of Service Page" />
      {/* Dark Navigation for better visibility */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between h-16 lg:h-20 px-8">
            {/* Branding - Left Side */}
            <Link href="/" className="text-center group">
              <h1 className="font-bbq-fredoka text-lg lg:text-xl font-bold text-gray-900 drop-shadow-sm tracking-wide">
                SURIGAO CITY
              </h1>
              <p className="text-xs lg:text-sm font-medium text-lays-dark-red drop-shadow-sm tracking-wide">
                BBQ Stalls
              </p>
            </Link>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              {/* Cart Icon */}
              <Link 
                href="/cart" 
                className="relative p-2 rounded-full bg-lays-orange-gold/10 hover:bg-lays-orange-gold/20 text-lays-dark-red transition-all duration-300 hover:scale-110"
              >
                <ShoppingCart className="w-5 h-5" />
              </Link>

              {/* Account Icon */}
              <Link 
                href="/account" 
                className="p-2 rounded-full bg-lays-orange-gold/10 hover:bg-lays-orange-gold/20 text-lays-dark-red transition-all duration-300 hover:scale-110"
              >
                <User className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-lays-dark-red to-lays-bright-red py-12 sm:py-16 mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              href="/" 
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-white" />
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Terms of Service</h1>
            </div>
          </div>
          <p className="text-red-100 text-lg">
            BBQ Stalls Surigao Online Ordering App - Terms of Service
          </p>
          <div className="mt-4 text-red-100 text-sm">
            <p><strong>Effective Date:</strong> September 10, 2025</p>
            <p><strong>Last Updated:</strong> September 10, 2025</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          
          <div className="space-y-8">
            {/* Nature of Services */}
            <div className="bg-gradient-to-r from-lays-dark-red/5 to-lays-bright-red/5 rounded-lg p-6 border border-lays-dark-red/20">
              <h2 className="text-2xl font-bold text-lays-dark-red mb-4">TERMS OF SERVICE</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">1. NATURE OF OUR SERVICES</h3>
                  <div className="space-y-2 text-gray-600">
                    <p>• The BBQ Stalls Surigao App is an ordering platform only.</p>
                    <p>• We connect customers with participating BBQ stalls.</p>
                    <p>• Vendors are independent businesses responsible for their own food and services.</p>
                    <p>• The app facilitates transactions but does not prepare, handle, or deliver food.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Responsibilities */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Scale className="w-6 h-6 text-lays-dark-red" />
                <h3 className="text-lg font-semibold text-gray-900">2. USER RESPONSIBILITIES</h3>
              </div>
              <div className="space-y-2 text-gray-600">
                <p>• Provide accurate personal and order information</p>
                <p>• Ensure pickup of your order on time at the chosen stall</p>
                <p>• Review your order carefully before confirming</p>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-lays-orange-gold" />
                <h3 className="text-lg font-semibold text-gray-900">3. PAYMENTS</h3>
              </div>
              <div className="space-y-2 text-gray-600">
                <p>• Payments are made via GCash or bank transfer</p>
                <p>• Proof of payment is required before confirmation</p>
                <p>• The app verifies payments but does not hold funds in escrow</p>
              </div>
            </div>

            {/* Pickup Policies */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-lays-bright-red" />
                <h3 className="text-lg font-semibold text-gray-900">4. PICKUP POLICIES</h3>
              </div>
              <div className="space-y-2 text-gray-600">
                <p>• Pickup only at the selected stall branch</p>
                <p>• Provide a valid ID and order reference number</p>
                <p>• Stalls may dispose of food not claimed within their holding period (usually 2 hours)</p>
                <p>• No refunds for late pickups</p>
              </div>
            </div>

            {/* No Refund Policy */}
            <div className="bg-red-50 rounded-lg p-6 border border-red-200">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-800">5. STRICTLY NO REFUND & NO CANCELLATION POLICY</h3>
              </div>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold text-red-800">All orders are final. Once placed, they cannot be cancelled or refunded.</p>
                <p>• Vendors procure raw materials and begin preparation based on your order, making refunds impossible.</p>
                <p>• The app does not issue refunds, credits, or replacements on behalf of stalls.</p>
                <p>• Any issues with food (quality, taste, preparation) must be addressed directly with the vendor at pickup.</p>
              </div>
            </div>

            {/* Food Safety Disclaimer */}
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-800">6. FOOD SAFETY DISCLAIMER</h3>
              </div>
              <div className="space-y-2 text-gray-700">
                <p>• Food is prepared by independent stalls, not the app.</p>
                <p>• Vendors are solely responsible for food safety, sanitation, and allergen disclosures.</p>
                <p className="font-semibold text-yellow-800">The app is not liable for:</p>
                <div className="ml-4 space-y-1">
                  <p>• Food contamination, spoilage, or safety issues</p>
                  <p>• Allergic reactions</p>
                  <p>• Food handling/storage after pickup</p>
                </div>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">7. LIMITATION OF LIABILITY</h3>
              <div className="space-y-3 text-gray-600">
                <p>• The app provides services "as is" and without warranty.</p>
                <p>• Our role is limited to facilitating online ordering and payment forwarding.</p>
                <p className="font-semibold">We are not responsible for:</p>
                <div className="ml-4 space-y-1">
                  <p>• Food preparation, quality, or safety</p>
                  <p>• Delays, cancellations, or mistakes made by stalls</p>
                  <p>• Customer errors (wrong stall, wrong order details, late pickup)</p>
                  <p>• Payment processing delays from GCash or banks</p>
                </div>
                <p className="font-semibold text-lays-dark-red">Our liability is strictly limited to correcting technical errors in the platform.</p>
              </div>
            </div>

            {/* Indemnification */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">8. INDEMNIFICATION</h3>
              <p className="text-gray-600 mb-3">By using the app, you agree to indemnify and hold harmless the BBQ Stalls Surigao App, its operators, and affiliates from any claims or disputes related to:</p>
              <div className="space-y-1 text-gray-600 ml-4">
                <p>• Food prepared by vendors</p>
                <p>• Service or product quality from stalls</p>
                <p>• Any damages or losses caused by food consumption</p>
              </div>
            </div>

            {/* Dispute Resolution */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">9. DISPUTE RESOLUTION</h3>
              <div className="space-y-2 text-gray-600">
                <p>• Food-related complaints: Must be resolved directly with the stall/vendor</p>
                <p>• Platform-related issues: May be reported to support@bbqstalls.ph</p>
                <p>• These Terms are governed by Philippine law</p>
                <p>• Jurisdiction lies with the courts of Surigao City</p>
              </div>
            </div>

            {/* Modifications */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">10. MODIFICATIONS</h3>
              <p className="text-gray-600">We may update these Terms at any time. Changes take effect once posted in the app or website. Continued use of the app means you accept the new terms.</p>
            </div>

            {/* Agreement */}
            <div className="bg-gradient-to-r from-lays-dark-red/5 to-lays-bright-red/5 rounded-lg p-6 border border-lays-dark-red/20">
              <h3 className="text-lg font-semibold text-lays-dark-red mb-4">AGREEMENT</h3>
              <p className="text-gray-700 mb-4 font-semibold">By placing an order through the BBQ Stalls Surigao App, you confirm that:</p>
              <div className="space-y-2 text-gray-600">
                <p>• You understand the app is a platform only.</p>
                <p>• You agree that vendors, not the app, are responsible for food preparation and quality.</p>
                <p>• You accept the Strictly No Refund & No Cancellation Policy.</p>
                <p>• You release the app from liability related to food, service, or vendor performance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
