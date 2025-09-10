/**
 * 🔐 ADMIN DASHBOARD - MAIN PAGE 🛡️
 * 
 * This page provides comprehensive business management:
 * - Real-time order management across all branches
 * - Payment verification interface
 * - Product management
 * - Sales analytics and reporting
 * - Crew attendance monitoring
 * - Branch management
 * 
 * ⚠️  WARNING: This is part of the admin dashboard system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /admin route
 * 🎯  PURPOSE: Central hub for all business operations
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  Users, 
  BarChart3, 
  MapPin, 
  Package, 
  DollarSign,
  Clock,
  TrendingUp,
  LogOut,
  Settings,
  Tag
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { adminAuth } from '@/lib/admin-auth'
import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'

interface DashboardStats {
  totalOrders: number
  pendingPayments: number
  totalRevenue: number
  activeBranches: number
  totalProducts: number
  todayOrders: number
}

interface RecentActivity {
  id: string
  type: 'order' | 'payment' | 'crew' | 'product' | 'branch'
  message: string
  timestamp: string
  branch_name?: string
  order_number?: string
  user_name?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    activeBranches: 0,
    totalProducts: 0,
    todayOrders: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log('🚀 Initializing admin dashboard...')
        
        // Check authentication first
        await checkAuth()
        
        // Only load data if user is authenticated
        if (user || localStorage.getItem('admin_session_data')) {
          console.log('✅ User authenticated, loading dashboard data...')
          await Promise.all([
            loadDashboardStats(),
            loadRecentActivity(),
            loadNotificationCount()
          ])
        }
      } catch (error) {
        console.error('❌ Dashboard initialization failed:', error)
        setIsLoading(false)
      }
    }

    initializeDashboard()
    
    // Set up data refresh (notifications handled globally)
    const refreshInterval = setInterval(() => {
      if (user || localStorage.getItem('admin_session_data')) {
        loadDashboardStats()
        loadRecentActivity()
        loadNotificationCount()
      }
    }, 30000) // Refresh every 30 seconds
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Dashboard loading timeout, forcing completion')
        setIsLoading(false)
      }
    }, 10000) // 10 second timeout
    
    // Cleanup on unmount
    return () => {
      clearInterval(refreshInterval)
      clearTimeout(timeout)
    }
  }, [user])

  const checkAuth = async () => {
    try {
      console.log('🔍 Admin dashboard checking auth...')
      
      // Use proper Supabase authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        router.push('/admin/login')
        return
      }
      
      if (!session?.user) {
        console.log('❌ No Supabase session found, redirecting to login')
        router.push('/admin/login')
        return
      }

      console.log('✅ Session found, checking admin role for user:', session.user.id)

      // Verify admin role using admin_users table
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('role, name, branch_id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('❌ Admin user query error:', error)
        await supabase.auth.signOut()
        router.push('/admin/login')
        return
      }

      if (!adminUser || adminUser.role !== 'admin') {
        console.log('❌ Invalid admin user or role, redirecting to login')
        await supabase.auth.signOut()
        router.push('/admin/login')
        return
      }

      console.log('✅ Admin authentication successful:', adminUser.name)
      setUser(adminUser)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const loadDashboardStats = async () => {
    try {
      console.log('📊 Loading dashboard stats...')
      setIsLoading(true)

      // Load all stats from Supabase
      const [
        ordersResult,
        productsResult,
        branchesResult,
        todayOrdersResult
      ] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*'),
        supabase.from('branches').select('*'),
        supabase.from('orders').select('*').gte('created_at', new Date().toISOString().split('T')[0])
      ])

      console.log('📊 Query results:', {
        orders: ordersResult.error ? ordersResult.error.message : `${ordersResult.data?.length || 0} orders`,
        products: productsResult.error ? productsResult.error.message : `${productsResult.data?.length || 0} products`,
        branches: branchesResult.error ? branchesResult.error.message : `${branchesResult.data?.length || 0} branches`,
        todayOrders: todayOrdersResult.error ? todayOrdersResult.error.message : `${todayOrdersResult.data?.length || 0} today orders`
      })

      if (ordersResult.error) throw new Error(`Orders: ${ordersResult.error.message}`)
      if (productsResult.error) throw new Error(`Products: ${productsResult.error.message}`)
      if (branchesResult.error) throw new Error(`Branches: ${branchesResult.error.message}`)
      if (todayOrdersResult.error) throw new Error(`Today Orders: ${todayOrdersResult.error.message}`)

      const orders = ordersResult.data || []
      const products = productsResult.data || []
      const branches = branchesResult.data || []
      const todayOrders = todayOrdersResult.data || []

      const newStats = {
        totalOrders: orders.length,
        pendingPayments: orders.filter(o => o.payment_status === 'pending').length,
        totalRevenue: orders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0),
        activeBranches: branches.filter(b => b.is_active).length,
        totalProducts: products.filter(p => p.is_active).length,
        todayOrders: todayOrders.length
      }

      console.log('📊 Stats calculated:', newStats)
      setStats(newStats)
    } catch (error) {
      console.error('❌ Failed to load dashboard stats:', error)
      // Set default stats to prevent infinite loading
      setStats({
        totalOrders: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        activeBranches: 0,
        totalProducts: 0,
        todayOrders: 0
      })
    } finally {
      console.log('📊 Dashboard stats loading complete')
      setIsLoading(false)
    }
  }

  const loadRecentActivity = async () => {
    try {
      // Get recent orders with branch names
      const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          total_amount,
          order_status,
          payment_status,
          created_at,
          branches (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (ordersError) throw ordersError

      // Get recent crew additions
      const { data: recentCrew, error: crewError } = await supabase
        .from('admin_users')
        .select(`
          id,
          name,
          created_at,
          branches (name)
        `)
        .eq('role', 'crew')
        .order('created_at', { ascending: false })
        .limit(3)

      if (crewError) throw crewError

      // Get recent system logs
      const { data: recentLogs, error: logsError } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

      if (logsError) throw logsError

      // Combine and format activities
      const activities: RecentActivity[] = []

      // Add recent orders
      recentOrders?.forEach(order => {
        const branchName = Array.isArray(order.branches) && order.branches.length > 0 
          ? order.branches[0].name 
          : 'Unknown'
        
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          message: `New order received from ${branchName} branch`,
          timestamp: order.created_at,
          branch_name: branchName,
          order_number: order.order_number
        })
      })

      // Add recent crew additions
      recentCrew?.forEach(crew => {
        const branchName = Array.isArray(crew.branches) && crew.branches.length > 0 
          ? crew.branches[0].name 
          : 'Unknown'
        
        activities.push({
          id: `crew-${crew.id}`,
          type: 'crew',
          message: `New crew member assigned to ${branchName} branch`,
          timestamp: crew.created_at,
          branch_name: branchName,
          user_name: crew.name
        })
      })

      // Add recent system logs
      recentLogs?.forEach(log => {
        activities.push({
          id: `log-${log.id}`,
          type: 'payment',
          message: log.message,
          timestamp: log.created_at
        })
      })

      // Sort by timestamp and take the most recent 5
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecentActivity(activities.slice(0, 5))

    } catch (error) {
      console.error('Failed to load recent activity:', error)
    }
  }

  const loadNotificationCount = async () => {
    try {
      // Count pending payments
      const { data: pendingPayments, error: paymentsError } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_status', 'pending')

      if (paymentsError) throw paymentsError

      // Count pending orders
      const { data: pendingOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('order_status', 'pending')

      if (ordersError) throw ordersError

      // Count low stock products
      const { data: lowStockProducts, error: stockError } = await supabase
        .from('products')
        .select('id')
        .eq('is_out_of_stock', true)

      if (stockError) throw stockError

      const totalNotifications = (pendingPayments?.length || 0) + (pendingOrders?.length || 0) + (lowStockProducts?.length || 0)
      setNotificationCount(totalNotifications)

    } catch (error) {
      console.error('Failed to load notification count:', error)
    }
  }

  // Test notification function (using global context)
  const testNotification = () => {
    console.log('🧪 Testing global notification system...')
    // This will be handled by the global notification context
    if (typeof window !== 'undefined') {
      (window as any).testGlobalNotification?.()
    }
  }

  // Add test button to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).testNotification = testNotification
  }

  const handleLogout = async () => {
    console.log('🚪 Admin logging out from dashboard...')
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return '🛒'
      case 'payment': return '💳'
      case 'crew': return '👥'
      case 'product': return '📦'
      case 'branch': return '🏪'
      default: return '📋'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-lays-orange-gold'
      case 'payment': return 'bg-lays-bright-red'
      case 'crew': return 'bg-lays-dark-red'
      case 'product': return 'bg-lays-brown-gold'
      case 'branch': return 'bg-bbq-secondary'
      default: return 'bg-gray-500'
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, description }: any) => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-xl transition-shadow duration-300">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{value}</h3>
      <p className="text-sm sm:text-base text-gray-600 font-medium mb-1 truncate">{title}</p>
      {description && <p className="text-xs sm:text-sm text-gray-500 truncate">{description}</p>}
    </div>
  )

  const QuickActionCard = ({ title, description, icon: Icon, href, color }: any) => (
    <Link href={href}>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
          <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 truncate">{title}</h3>
        <p className="text-gray-600 text-xs sm:text-sm truncate">{description}</p>
      </div>
    </Link>
  )

  if (isLoading) {
    return (
      <AdminLayout 
        currentPage="dashboard" 
        userName={user?.full_name || 'Admin'}
        pageTitle="Loading Dashboard..."
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      currentPage="dashboard" 
      userName={user?.full_name || 'Admin'}
      pageTitle="Dashboard Overview"
      pageDescription={`Welcome back, ${user?.full_name || 'Administrator'}. Here's your business overview.`}
      notificationCount={notificationCount}
    >

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          color="bg-lays-dark-red"
          description="All time orders"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={Clock}
          color="bg-lays-orange-gold"
          description="Awaiting verification"
        />
        <StatCard
          title="Total Revenue"
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-lays-bright-red"
          description="All time earnings"
        />
        <StatCard
          title="Active Branches"
          value={stats.activeBranches}
          icon={MapPin}
          color="bg-lays-brown-gold"
          description="Operating locations"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="bg-bbq-secondary"
          description="Menu items"
        />
        <StatCard
          title="Today's Orders"
          value={stats.todayOrders}
          icon={TrendingUp}
          color="bg-lays-orange-gold"
          description="Orders today"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <QuickActionCard
            title="Manage Orders"
            description="View and update order statuses"
            icon={ShoppingCart}
            href="/admin/orders"
            color="bg-lays-dark-red"
          />
          <QuickActionCard
            title="Settings"
            description="Configure all system settings"
            icon={Settings}
            href="/admin/settings"
            color="bg-lays-bright-red"
          />
          <QuickActionCard
            title="Analytics"
            description="View sales reports and insights"
            icon={BarChart3}
            href="/admin/analytics"
            color="bg-lays-dark-red"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Recent Activity</h2>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 sm:gap-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 ${getActivityColor(activity.type)} rounded-full`}></div>
                    <span className="text-gray-700">{activity.message}</span>
                    {activity.order_number && (
                      <span className="text-xs bg-lays-orange-gold text-white px-2 py-1 rounded-full">
                        #{activity.order_number}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400">Activity will appear here as orders and updates come in</p>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Database</p>
            <p className="text-lg font-semibold text-green-600">Online</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Storage</p>
            <p className="text-lg font-semibold text-green-600">Online</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Real-time</p>
            <p className="text-lg font-semibold text-green-600">Active</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
