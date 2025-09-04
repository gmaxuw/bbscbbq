/**
 * 🔐 ADMIN NAVIGATION COMPONENT
 * 
 * This component provides navigation specifically for the admin dashboard.
 * It's completely separate from the public website navigation and includes
 * all the management functions an admin needs.
 * 
 * ⚠️  WARNING: This component is for ADMIN USE ONLY
 * 🔒  STATUS: SECURE - Only accessible to authenticated admins
 * 📍  LOCATION: Used in all admin pages
 * 🎯  PURPOSE: Provide admin-specific navigation and management access
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Building2, 
  BarChart3, 
  Tag, 
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User
} from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase'

interface AdminNavigationProps {
  currentPage?: string
  userName?: string
}

export default function AdminNavigation({ currentPage = 'dashboard', userName = 'Admin' }: AdminNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleLogout = async () => {
    try {
      console.log('🚪 Admin logging out from navigation...')
      await supabase.auth.signOut()
      // Clear any local storage
      localStorage.clear()
      // Redirect to login
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if logout fails
      router.push('/admin/login')
    }
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      description: 'Overview and quick stats'
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ShoppingBag,
      description: 'Manage orders and payments'
    },
    {
      name: 'Crew',
      href: '/admin/crew',
      icon: Users,
      description: 'Manage staff and attendance'
    },
    {
      name: 'Branches',
      href: '/admin/branches',
      icon: Building2,
      description: 'Manage locations'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      description: 'Sales reports and insights'
    },
    {
      name: 'Promos',
      href: '/admin/promos',
      icon: Tag,
      description: 'Manage discount codes'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'System settings and logs'
    }
  ]

  return (
    <>
      {/* Admin Header with Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Side - Logo */}
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-lays-orange-gold rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">Surigao City BBQ Stalls</p>
                </div>
              </Link>
            </div>

            {/* Center - Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                // Map the navigation names to currentPage values
                const pageKey = item.name === 'Dashboard' ? 'dashboard' : item.name.toLowerCase()
                const isActive = currentPage === pageKey
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-lays-orange-gold text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right Side - Notifications, User Menu, and Mobile Toggle */}
            <div className="flex items-center space-x-4">
              
              {/* Notifications */}
              <Link href="/admin/orders" className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-lays-bright-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {/* TODO: Connect to real notification count */}
                  3
                </span>
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-lays-orange-gold rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link
                      href="/admin/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="inline w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={toggleMenu}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lays-orange-gold"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                // Map the navigation names to currentPage values
                const pageKey = item.name === 'Dashboard' ? 'dashboard' : item.name.toLowerCase()
                const isActive = currentPage === pageKey
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={toggleMenu}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-lays-orange-gold text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
