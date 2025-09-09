/**
 * 🔐 ADMIN LAYOUT COMPONENT
 * 
 * This component provides the layout structure for all admin pages.
 * It includes the admin navigation and ensures consistent styling
 * across all admin dashboard pages.
 * 
 * ⚠️  WARNING: This component is for ADMIN USE ONLY
 * 🔒  STATUS: SECURE - Only accessible to authenticated admins
 * 📍  LOCATION: Wraps all admin pages
 * 🎯  PURPOSE: Provide consistent admin layout and navigation
 */

'use client'

import { ReactNode } from 'react'
import AdminNavigation from './AdminNavigation'

interface AdminLayoutProps {
  children: ReactNode
  currentPage?: string
  userName?: string
  pageTitle?: string
  pageDescription?: string
  notificationCount?: number
}

export default function AdminLayout({ 
  children, 
  currentPage = 'dashboard',
  userName = 'Admin',
  pageTitle,
  pageDescription,
  notificationCount = 0
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <AdminNavigation currentPage={currentPage} userName={userName} notificationCount={notificationCount} />
      
      {/* Main Content Area - No left margin needed for top nav */}
      <div className="pt-20"> {/* Add top padding to account for fixed top nav */}
        <main className="p-6">
          {/* Page Header */}
          {(pageTitle || pageDescription) && (
            <div className="mb-6">
              {pageTitle && (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {pageTitle}
                </h1>
              )}
              {pageDescription && (
                <p className="text-gray-600">
                  {pageDescription}
                </p>
              )}
            </div>
          )}
          
          {/* Page Content */}
          {currentPage === 'dashboard' ? (
            // Dashboard gets no extra wrapper - it has its own styling
            children
          ) : (
            // Other pages get the white container wrapper
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
