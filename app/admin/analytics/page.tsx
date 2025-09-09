/**
 * 📊 ADMIN ANALYTICS - ORDER HISTORY & REVENUE REPORTS 📈
 * 
 * This page provides comprehensive analytics and reporting:
 * - Daily, weekly, and monthly sales reports
 * - Order history with QR codes and order numbers
 * - Revenue analysis (gross, net, discounts)
 * - Branch performance comparison
 * - Product sales analytics
 * 
 * ⚠️  WARNING: This is part of the admin analytics system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /admin/analytics route
 * 🎯  PURPOSE: Business intelligence and reporting
 */

'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  QrCode,
  Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'

interface DailyReport {
  order_date: string
  total_orders: number
  total_revenue: number
  total_subtotal: number
  total_discount: number
  total_commission: number
  total_platform_fees: number
  net_profit: number
  average_order_value: number
  orders_by_status: Record<string, number>
}

interface FinancialAnalytics {
  total_revenue: number
  total_commission: number
  total_platform_fees: number
  net_profit: number
  average_order_value: number
  total_orders: number
}

interface TimeSeriesData {
  date: string
  revenue: number
  commission: number
  platform_fees: number
  orders: number
  lastMonthRevenue?: number
  lastMonthCommission?: number
  lastMonthPlatformFees?: number
  lastMonthOrders?: number
}

interface BranchReport {
  branch_id: string
  branch_name: string
  total_orders: number
  total_revenue: number
  total_subtotal: number
  total_commission: number
  net_profit: number
  total_discount: number
  average_order_value: number
  completion_rate: number
}

interface OrderHistory {
  order_id: string
  order_number: string
  customer_name: string
  customer_phone: string
  order_status: string
  payment_status: string
  total_amount: number
  total_commission: number
  subtotal: number
  promo_discount: number
  qr_code: string
  created_at: string
  branch_name: string
}

export default function AdminAnalytics() {
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [branchReports, setBranchReports] = useState<BranchReport[]>([])
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([])
  const [financialAnalytics, setFinancialAnalytics] = useState<FinancialAnalytics | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [comparisonType, setComparisonType] = useState<'revenue' | 'orders' | 'profit'>('revenue')
  const [dateRange, setDateRange] = useState({
    start: '2025-09-01', // Start from September 1st to include all your orders
    end: '2025-09-10' // Extend to September 10th to include all your orders
  })
  const [branches, setBranches] = useState<Array<{id: string, name: string}>>([])
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadBranches()
    loadDailyReport()
    loadBranchReport()
    loadOrderHistory()
    loadFinancialAnalytics()
    loadTimeSeriesData()
  }, [selectedDate, selectedBranch, dateRange, selectedPeriod])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/admin/login'
        return
      }

      // Verify admin role
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('role, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (error || !adminUser || adminUser.role !== 'admin') {
        console.log('❌ User not found in admin_users or not admin role')
        await supabase.auth.signOut()
        window.location.href = '/admin/login'
        return
      }

      setUser({ role: adminUser.role, full_name: adminUser.name })
    } catch (error) {
      console.error('Auth check failed:', error)
      window.location.href = '/admin/login'
    }
  }

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .order('name')

      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Failed to load branches:', error)
    }
  }

  const loadDailyReport = async () => {
    try {
      setIsLoading(true)
      
      // Get real daily data from database - use date range from filters
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total_amount, total_commission, subtotal, promo_discount, order_status')
        .eq('order_status', 'completed')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group orders by date
      const dailyData: { [key: string]: { 
        orders: number, 
        revenue: number, 
        subtotal: number, 
        discount: number, 
        commission: number 
      } } = {}
      
      orders?.forEach(order => {
        const date = order.created_at.split('T')[0]
        if (!dailyData[date]) {
          dailyData[date] = { 
            orders: 0, 
            revenue: 0, 
            subtotal: 0, 
            discount: 0, 
            commission: 0 
          }
        }
        dailyData[date].orders += 1
        dailyData[date].revenue += parseFloat(order.total_amount || '0')
        dailyData[date].subtotal += parseFloat(order.subtotal || '0')
        dailyData[date].discount += parseFloat(order.promo_discount || '0')
        dailyData[date].commission += parseFloat(order.total_commission || '0')
      })

      // Convert to array format for the selected date range
      const dailyReports: DailyReport[] = []
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]
        
        const data = dailyData[dateStr] || { 
          orders: 0, 
          revenue: 0, 
          subtotal: 0, 
          discount: 0, 
          commission: 0 
        }
        dailyReports.push({
          order_date: dateStr,
          total_orders: data.orders,
          total_revenue: data.revenue,
          total_subtotal: data.subtotal,
          total_discount: data.discount,
          total_commission: data.commission,
          total_platform_fees: data.orders * 10, // Platform fee per order
          net_profit: data.commission + (data.orders * 10), // Commission + Platform Fee
          average_order_value: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
          orders_by_status: {}
        })
      }

      setDailyReports(dailyReports)
    } catch (error) {
      console.error('Failed to load daily report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBranchReport = async () => {
    try {
      // Get real branch data from database
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          branch_id,
          total_amount,
          total_commission,
          subtotal,
          promo_discount,
          order_status,
          branches!inner(name)
        `)
        .eq('order_status', 'completed')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)

      if (error) throw error

      // Group orders by branch
      const branchData: { [key: string]: { 
        name: string, 
        orders: number, 
        revenue: number, 
        subtotal: number, 
        discount: number, 
        commission: number 
      } } = {}
      
      orders?.forEach(order => {
        const branchId = order.branch_id
        const branchName = (order as any).branches?.name || 'Unknown Branch'
        
        if (!branchData[branchId]) {
          branchData[branchId] = { 
            name: branchName, 
            orders: 0, 
            revenue: 0, 
            subtotal: 0, 
            discount: 0, 
            commission: 0 
          }
        }
        branchData[branchId].orders += 1
        branchData[branchId].revenue += parseFloat(order.total_amount || '0')
        branchData[branchId].subtotal += parseFloat(order.subtotal || '0')
        branchData[branchId].discount += parseFloat(order.promo_discount || '0')
        branchData[branchId].commission += parseFloat(order.total_commission || '0')
      })

      // Convert to array format
      const branchReports: BranchReport[] = Object.entries(branchData).map(([branchId, data]) => ({
        branch_id: branchId,
        branch_name: data.name,
        total_orders: data.orders,
        total_revenue: data.revenue,
        total_subtotal: data.subtotal,
        total_discount: data.discount,
        total_commission: data.commission,
        net_profit: data.commission, // Commission is our profit
        average_order_value: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
        completion_rate: 100
      }))

      setBranchReports(branchReports)
    } catch (error) {
      console.error('Failed to load branch report:', error)
    }
  }

  const loadOrderHistory = async () => {
    try {
      // Get real order history from database
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_phone,
          total_amount,
          total_commission,
          subtotal,
          promo_discount,
          payment_status,
          order_status,
          created_at,
          qr_code,
          branches!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch)
      }

      const { data: orders, error } = await query

      if (error) throw error

      // Convert to OrderHistory format
      const orderHistory: OrderHistory[] = orders?.map(order => ({
        order_id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        total_amount: parseFloat(order.total_amount || '0'),
        total_commission: parseFloat(order.total_commission || '0'),
        payment_status: order.payment_status,
        order_status: order.order_status,
        created_at: order.created_at,
        qr_code: order.qr_code,
        branch_name: (order as any).branches?.name || 'Unknown Branch',
        subtotal: parseFloat(order.subtotal || '0'),
        promo_discount: parseFloat(order.promo_discount || '0')
      })) || []

      setOrderHistory(orderHistory)
    } catch (error) {
      console.error('Failed to load order history:', error)
    }
  }

  // Load comprehensive financial analytics
  const loadFinancialAnalytics = async () => {
    try {
      // Get platform fee from settings
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'platform_fee')
        .single()

      const platformFee = parseFloat(platformSettings?.setting_value || '10')

      // Get all completed orders in date range
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, total_commission, subtotal, promo_discount, created_at')
        .eq('order_status', 'completed')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)

      if (error) throw error

      // Calculate financial metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) || 0
      const totalCommission = orders?.reduce((sum, order) => sum + parseFloat(order.total_commission || '0'), 0) || 0
      const totalPlatformFees = (orders?.length || 0) * platformFee
      const netProfit = totalCommission + totalPlatformFees
      const totalOrders = orders?.length || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      setFinancialAnalytics({
        total_revenue: totalRevenue,
        total_commission: totalCommission,
        total_platform_fees: totalPlatformFees,
        net_profit: netProfit,
        average_order_value: averageOrderValue,
        total_orders: totalOrders
      })
    } catch (error) {
      console.error('Failed to load financial analytics:', error)
    }
  }

  // Load month-over-month comparison data
  const loadTimeSeriesData = async () => {
    try {
      // Get platform fee from settings
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'platform_fee')
        .single()

      const platformFee = parseFloat(platformSettings?.setting_value || '10')

      // Get current month and last month data
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear

      // Get current month orders
      const { data: currentMonthOrders, error: currentError } = await supabase
        .from('orders')
        .select('total_amount, total_commission, created_at')
        .eq('order_status', 'completed')
        .gte('created_at', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`)
        .lt('created_at', `${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-01`)
        .order('created_at', { ascending: true })

      // Get last month orders
      const { data: lastMonthOrders, error: lastError } = await supabase
        .from('orders')
        .select('total_amount, total_commission, created_at')
        .eq('order_status', 'completed')
        .gte('created_at', `${lastYear}-${String(lastMonth + 1).padStart(2, '0')}-01`)
        .lt('created_at', `${lastYear}-${String(lastMonth + 2).padStart(2, '0')}-01`)
        .order('created_at', { ascending: true })

      if (currentError || lastError) throw currentError || lastError

      // Group by days for both months
      const currentMonthData: { [key: string]: { revenue: number, commission: number, platform_fees: number, orders: number } } = {}
      const lastMonthData: { [key: string]: { revenue: number, commission: number, platform_fees: number, orders: number } } = {}

      // Process current month
      currentMonthOrders?.forEach(order => {
        const orderDate = new Date(order.created_at)
        const dayKey = orderDate.getDate().toString()
        
        if (!currentMonthData[dayKey]) {
          currentMonthData[dayKey] = { revenue: 0, commission: 0, platform_fees: 0, orders: 0 }
        }
        
        currentMonthData[dayKey].revenue += parseFloat(order.total_amount || '0')
        currentMonthData[dayKey].commission += parseFloat(order.total_commission || '0')
        currentMonthData[dayKey].platform_fees += platformFee
        currentMonthData[dayKey].orders += 1
      })

      // Process last month
      lastMonthOrders?.forEach(order => {
        const orderDate = new Date(order.created_at)
        const dayKey = orderDate.getDate().toString()
        
        if (!lastMonthData[dayKey]) {
          lastMonthData[dayKey] = { revenue: 0, commission: 0, platform_fees: 0, orders: 0 }
        }
        
        lastMonthData[dayKey].revenue += parseFloat(order.total_amount || '0')
        lastMonthData[dayKey].commission += parseFloat(order.total_commission || '0')
        lastMonthData[dayKey].platform_fees += platformFee
        lastMonthData[dayKey].orders += 1
      })

      // Create comparison data for the first 30 days
      const comparisonData: TimeSeriesData[] = []
      for (let day = 1; day <= 30; day++) {
        const dayKey = day.toString()
        const currentData = currentMonthData[dayKey] || { revenue: 0, commission: 0, platform_fees: 0, orders: 0 }
        const lastData = lastMonthData[dayKey] || { revenue: 0, commission: 0, platform_fees: 0, orders: 0 }
        
        comparisonData.push({
          date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${dayKey.padStart(2, '0')}`,
          revenue: currentData.revenue,
          commission: currentData.commission,
          platform_fees: currentData.platform_fees,
          orders: currentData.orders,
          lastMonthRevenue: lastData.revenue,
          lastMonthCommission: lastData.commission,
          lastMonthPlatformFees: lastData.platform_fees,
          lastMonthOrders: lastData.orders
        })
      }

      setTimeSeriesData(comparisonData)
    } catch (error) {
      console.error('Failed to load time series data:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Order Number', 'Customer Name', 'Phone', 'Status', 'Payment', 'Total Amount', 'Subtotal', 'Discount', 'Branch', 'Date', 'QR Code'],
      ...orderHistory.map(order => [
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.order_status,
        order.payment_status,
        order.total_amount.toString(),
        order.subtotal.toString(),
        order.promo_discount?.toString() || '0',
        order.branch_name,
        formatDateTime(order.created_at),
        order.qr_code ? 'Generated' : 'Not Generated'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-history-${dateRange.start}-to-${dateRange.end}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalRevenue = branchReports.reduce((sum, report) => sum + report.total_revenue, 0)
  const totalOrders = branchReports.reduce((sum, report) => sum + report.total_orders, 0)
  const totalDiscounts = branchReports.reduce((sum, report) => sum + report.total_discount, 0)
  const totalCommission = branchReports.reduce((sum, report) => sum + report.total_commission, 0)
  const totalPlatformFees = totalOrders * 10 // Platform fee per order
  const stallIncome = totalRevenue - totalCommission - totalPlatformFees // What stalls actually earn
  const yourProfit = totalCommission + totalPlatformFees // Your actual profit

  if (isLoading) {
    return (
      <AdminLayout 
        currentPage="analytics" 
        userName={user?.full_name || 'Admin'}
        pageTitle="Analytics & Reports"
        pageDescription="Order history, revenue analysis, and business insights."
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      currentPage="analytics" 
      userName={user?.full_name || 'Admin'}
      pageTitle="Analytics & Reports"
      pageDescription="Order history, revenue analysis, and business insights."
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
          <p className="text-sm sm:text-base text-gray-600">Order history, revenue analysis, and business insights</p>
        </div>

        {/* Filters */}
        <div className="bbq-card p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bbq-input text-sm"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bbq-input text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bbq-input"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Date</label>
              <select
                onChange={(e) => {
                  const days = parseInt(e.target.value)
                  if (days > 0) {
                    const end = new Date()
                    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
                    setDateRange({
                      start: start.toISOString().split('T')[0],
                      end: end.toISOString().split('T')[0]
                    })
                  }
                }}
                className="bbq-input"
              >
                <option value="">Select Period</option>
                <option value="1">Today</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                className="bbq-button-primary w-full flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Financial Analytics Overview */}
        {financialAnalytics && (
          <div className="bbq-card p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(financialAnalytics.total_revenue)}</p>
                    <p className="text-xs text-green-600">What customers pay</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-800">Stall Income</p>
                    <p className="text-2xl font-bold text-orange-900">{formatCurrency(financialAnalytics.total_revenue - financialAnalytics.total_commission - financialAnalytics.total_platform_fees)}</p>
                    <p className="text-xs text-orange-600">What stalls earn</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">Commission</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(financialAnalytics.total_commission)}</p>
                    <p className="text-xs text-blue-600">Hidden profit</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <PieChart className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-800">Platform Fees</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(financialAnalytics.total_platform_fees)}</p>
                    <p className="text-xs text-purple-600">Visible profit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Series Analytics */}
        <div className="bbq-card p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">Income Trends</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedPeriod('daily')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedPeriod === 'daily' 
                    ? 'bg-lays-orange-gold text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setSelectedPeriod('weekly')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedPeriod === 'weekly' 
                    ? 'bg-lays-orange-gold text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSelectedPeriod('monthly')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedPeriod === 'monthly' 
                    ? 'bg-lays-orange-gold text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          
          {/* Line Chart - Like the photo */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Month vs Last Month</h3>
              <select 
                value={comparisonType}
                onChange={(e) => setComparisonType(e.target.value as 'revenue' | 'orders' | 'profit')}
                className="bbq-input text-sm"
              >
                <option value="revenue">Revenue Comparison</option>
                <option value="orders">Orders Comparison</option>
                <option value="profit">Profit Comparison</option>
              </select>
            </div>
            
            {/* Chart Container */}
            <div className="relative h-64 bg-white rounded-lg p-4">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
              
              {/* Chart Area */}
              <div className="ml-8 h-full relative">
                {/* Grid lines */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-0 right-0 border-t border-gray-200"></div>
                  <div className="absolute top-0 left-0 right-0 border-t border-gray-200"></div>
                </div>
                
                {/* Line Chart */}
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* Get current and last month values based on comparison type */}
                  {(() => {
                    const getCurrentValue = (data: TimeSeriesData) => {
                      switch (comparisonType) {
                        case 'revenue': return data.revenue
                        case 'orders': return data.orders
                        case 'profit': return data.commission + data.platform_fees
                        default: return data.revenue
                      }
                    }
                    
                    const getLastValue = (data: TimeSeriesData) => {
                      switch (comparisonType) {
                        case 'revenue': return data.lastMonthRevenue || 0
                        case 'orders': return data.lastMonthOrders || 0
                        case 'profit': return (data.lastMonthCommission || 0) + (data.lastMonthPlatformFees || 0)
                        default: return data.lastMonthRevenue || 0
                      }
                    }
                    
                    const currentValues = timeSeriesData.map(getCurrentValue)
                    const lastValues = timeSeriesData.map(getLastValue)
                    const maxValue = Math.max(...currentValues, ...lastValues, 1)
                    
                    return (
                      <>
                        {/* Current Month Line (Blue) */}
                        <polyline
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="3"
                          points={timeSeriesData.map((data, index) => {
                            const x = (index / Math.max(timeSeriesData.length - 1, 1)) * 380 + 10
                            const y = 190 - (getCurrentValue(data) / maxValue) * 180
                            return `${x},${y}`
                          }).join(' ')}
                        />
                        
                        {/* Last Month Line (Red) */}
                        <polyline
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="3"
                          points={timeSeriesData.map((data, index) => {
                            const x = (index / Math.max(timeSeriesData.length - 1, 1)) * 380 + 10
                            const y = 190 - (getLastValue(data) / maxValue) * 180
                            return `${x},${y}`
                          }).join(' ')}
                        />
                        
                        {/* Data Points - Current Month */}
                        {timeSeriesData.map((data, index) => {
                          const x = (index / Math.max(timeSeriesData.length - 1, 1)) * 380 + 10
                          const y = 190 - (getCurrentValue(data) / maxValue) * 180
                          return (
                            <circle key={`current-${index}`} cx={x} cy={y} r="4" fill="#3B82F6" />
                          )
                        })}
                        
                        {/* Data Points - Last Month */}
                        {timeSeriesData.map((data, index) => {
                          const x = (index / Math.max(timeSeriesData.length - 1, 1)) * 380 + 10
                          const y = 190 - (getLastValue(data) / maxValue) * 180
                          return (
                            <circle key={`last-${index}`} cx={x} cy={y} r="4" fill="#EF4444" />
                          )
                        })}
                      </>
                    )
                  })()}
                </svg>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
                  {timeSeriesData.map((data, index) => {
                    const date = new Date(data.date)
                    const label = selectedPeriod === 'daily' 
                      ? `${date.getMonth() + 1}/${date.getDate()}`
                      : selectedPeriod === 'weekly'
                      ? `W${Math.ceil(date.getDate() / 7)}`
                      : `${date.getMonth() + 1}/${date.getFullYear()}`
                    return (
                      <span key={index} className="transform -rotate-45 origin-left">
                        {label}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex justify-end space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700">
                  Current Month: {
                    comparisonType === 'revenue' ? formatCurrency(timeSeriesData.reduce((sum, d) => sum + d.revenue, 0)) :
                    comparisonType === 'orders' ? timeSeriesData.reduce((sum, d) => sum + d.orders, 0).toString() :
                    formatCurrency(timeSeriesData.reduce((sum, d) => sum + d.commission + d.platform_fees, 0))
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">
                  Last Month: {
                    comparisonType === 'revenue' ? formatCurrency(timeSeriesData.reduce((sum, d) => sum + (d.lastMonthRevenue || 0), 0)) :
                    comparisonType === 'orders' ? timeSeriesData.reduce((sum, d) => sum + (d.lastMonthOrders || 0), 0).toString() :
                    formatCurrency(timeSeriesData.reduce((sum, d) => sum + (d.lastMonthCommission || 0) + (d.lastMonthPlatformFees || 0), 0))
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards - Clear Financial Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bbq-card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Revenue</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-400">What customers pay</p>
              </div>
            </div>
          </div>

          <div className="bbq-card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Orders</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{totalOrders}</p>
                <p className="text-xs text-gray-400">Completed orders</p>
              </div>
            </div>
          </div>

          <div className="bbq-card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500/10 rounded-lg flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Stall Income</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stallIncome)}</p>
                <p className="text-xs text-gray-400">Revenue - Commission - Platform Fee</p>
              </div>
            </div>
          </div>

          <div className="bbq-card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Your Profit</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(yourProfit)}</p>
                <p className="text-xs text-gray-400">Commission + Platform Fee</p>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Performance */}
        <div className="bbq-card p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Branch Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branchReports.map((report) => (
                  <tr key={report.branch_id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.branch_name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.total_orders}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(report.total_revenue)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(report.total_commission)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(report.net_profit)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(report.average_order_value)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        100%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order History */}
        <div className="bbq-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Order History</h2>
            <span className="text-sm text-gray-500">{orderHistory.length} orders</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderHistory.map((order) => (
                  <tr key={order.order_id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-xs sm:text-sm text-gray-500">{order.customer_phone}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          order.order_status === 'completed' ? 'bg-green-500' :
                          order.order_status === 'preparing' ? 'bg-orange-500' :
                          order.order_status === 'ready' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}>
                          {order.order_status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          order.payment_status === 'paid' ? 'bg-green-500' :
                          order.payment_status === 'pending' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                        {order.promo_discount && order.promo_discount > 0 && (
                          <div className="text-xs text-red-600">
                            -{formatCurrency(order.promo_discount)} discount
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold text-emerald-600">
                        {formatCurrency(order.total_commission || 0)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.branch_name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.qr_code ? (
                        <div className="flex items-center space-x-2">
                          <QrCode className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 text-xs">Generated</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Not Generated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}