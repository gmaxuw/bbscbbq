import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import DesignLock from '@/components/layout/DesignLock'
import { ArrowLeft, Shield, Lock, Eye, Database, Mail, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Privacy Policy Page" />
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
              <Shield className="w-8 h-8 text-white" />
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Privacy Policy</h1>
            </div>
          </div>
          <p className="text-red-100 text-lg">
            BBQ Stalls Surigao Online Ordering App - Privacy Policy & Terms of Service
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
            {/* Introduction */}
            <div className="bg-gradient-to-r from-lays-dark-red/5 to-lays-bright-red/5 rounded-lg p-6 border border-lays-dark-red/20">
              <h2 className="text-2xl font-bold text-lays-dark-red mb-4">PRIVACY POLICY</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">1. INTRODUCTION</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The BBQ Stalls Surigao App ("we," "our," "us") is a digital platform that helps customers order food online from local BBQ stalls in Surigao City and Siargao Island.
                  </p>
                  <p className="text-gray-600 leading-relaxed mt-2">
                    <strong>Important:</strong> We are not the owners or operators of the stalls. Each stall/vendor is solely responsible for the preparation, handling, and quality of its products.
                  </p>
                  <p className="text-gray-600 leading-relaxed mt-2">
                    This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.
                  </p>
                </div>
              </div>
            </div>

            {/* Information We Collect */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-lays-dark-red" />
                <h3 className="text-lg font-semibold text-gray-900">2. INFORMATION WE COLLECT</h3>
              </div>
              <div className="space-y-3 text-gray-600">
                <p><strong>Personal Data:</strong> Name, phone number, email address</p>
                <p><strong>Order Data:</strong> Menu selections, pickup branch, schedule</p>
                <p><strong>Payment Data:</strong> GCash/bank reference numbers, payment proof</p>
                <p><strong>Device Data:</strong> IP address, browser type, operating system</p>
                <p><strong>Usage Data:</strong> Click paths, pages viewed, session times</p>
                <p><strong>Location Data (optional):</strong> For nearest stall recommendations</p>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="w-6 h-6 text-lays-orange-gold" />
                <h3 className="text-lg font-semibold text-gray-900">3. HOW WE USE YOUR INFORMATION</h3>
              </div>
              <div className="space-y-2 text-gray-600">
                <p>• Forward orders to your chosen stall/vendor</p>
                <p>• Confirm and verify payments</p>
                <p>• Provide order status updates and notifications</p>
                <p>• Improve app/website functionality and experience</p>
                <p>• Send promotions (with your consent)</p>
              </div>
            </div>

            {/* Sharing of Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-6 h-6 text-lays-bright-red" />
                <h3 className="text-lg font-semibold text-gray-900">4. SHARING OF INFORMATION</h3>
              </div>
              <div className="space-y-3 text-gray-600">
                <p>We may share your information with:</p>
                <p>• <strong>Stalls/Vendors:</strong> To process and prepare your order</p>
                <p>• <strong>Payment Providers:</strong> GCash and banking partners for verification</p>
                <p>• <strong>Service Providers:</strong> For app hosting, maintenance, and technical support</p>
                <p>• <strong>Legal Authorities:</strong> If required by Philippine law</p>
                <p className="mt-4 font-semibold text-lays-dark-red">We do not sell, rent, or trade your information to third parties.</p>
              </div>
            </div>

            {/* Data Security & Retention */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-lays-dark-red" />
                <h3 className="text-lg font-semibold text-gray-900">5. DATA SECURITY & RETENTION</h3>
              </div>
              <div className="space-y-2 text-gray-600">
                <p>• Payment proofs are stored temporarily and deleted after verification</p>
                <p>• Order and account records are retained for 7 years (for business and tax compliance)</p>
                <p>• Account information is kept until you request deletion</p>
              </div>
            </div>

            {/* Your Rights */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">6. YOUR RIGHTS</h3>
              <p className="text-gray-600 mb-3">Under the Philippine Data Privacy Act, you have the right to request:</p>
              <div className="space-y-2 text-gray-600">
                <p>• Access to your data</p>
                <p>• Correction of inaccurate data</p>
                <p>• Deletion of your account</p>
                <p>• Opt-out from marketing communications</p>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-lays-dark-red/5 to-lays-bright-red/5 rounded-lg p-6 border border-lays-dark-red/20">
              <div className="flex items-center space-x-3 mb-4">
                <Mail className="w-6 h-6 text-lays-dark-red" />
                <h3 className="text-lg font-semibold text-gray-900">7. CONTACT</h3>
              </div>
              <div className="space-y-2 text-gray-600">
                <p><strong>For privacy-related concerns:</strong></p>
                <p>Email: gabu.sacro@gmail.com</p>
                <p>Phone: 0946-365-7331</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
