/**
 * 🔐 ANALYTICS & REPORTING - ADMIN DASHBOARD 🛡️
 * 
 * This page provides comprehensive business analytics:
 * - Sales reports by date range and branch
 * - Revenue and commission tracking
 * - Order analytics and trends
 * - CSV/Excel export functionality
 * - Performance metrics and insights
 * - Custom report generation
 * 
 * ⚠️  WARNING: This is part of the admin dashboard system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /admin/analytics route
 * 🎯  PURPOSE: Business intelligence and data export
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Users,
  MapPin
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import * as XLSX from 'xlsx'
// @ts-ignore - file-saver types not available
import { saveAs } from 'file-saver'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  totalCommission: number
  averageOrderValue: number
  ordersByStatus: Record<string, number>
  revenueByBranch: Record<string, number>
  ordersByDate: Array<{ date: string; orders: number; revenue: number }>
}

interface Branch {
  id: string
  name: string
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCommission: 0,
    averageOrderValue: 0,
    ordersByStatus: {},
    revenueByBranch: {},
    ordersByDate: []
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadBranches()
  }, [])

  useEffect(() => {
    if (branches.length > 0) {
      loadAnalytics()
    }
  }, [branches, dateRange, selectedBranch, startDate, endDate])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }

      // Verify admin role by email (more reliable)
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('email', user.email)
        .single()

      if (error || userData?.role !== 'admin') {
        await supabase.auth.signOut()
        router.push('/admin/login')
        return
      }

      setUser(userData)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Failed to load branches:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)

      // Calculate date range
      let start, end
      if (dateRange === 'custom' && startDate && endDate) {
        start = new Date(startDate)
        end = new Date(endDate)
      } else {
        const days = parseInt(dateRange)
        end = new Date()
        start = subDays(end, days)
      }

      // Build query
      let query = supabase
        .from('orders')
        .select(`
          *,
          branches(name)
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      if (selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch)
      }

      const { data: orders, error } = await query

      if (error) throw error

      // Process analytics data
      const processedData = processAnalyticsData(orders || [], start, end)
      setAnalyticsData(processedData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const processAnalyticsData = (orders: any[], start: Date, end: Date): AnalyticsData => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0)
    const totalCommission = orders.reduce((sum, order) => sum + parseFloat(order.total_commission || '0'), 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Orders by status
    const ordersByStatus: Record<string, number> = {}
    orders.forEach(order => {
      const status = order.order_status || 'unknown'
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1
    })

    // Revenue by branch
    const revenueByBranch: Record<string, number> = {}
    orders.forEach(order => {
      const branchName = order.branches?.name || 'Unknown'
      revenueByBranch[branchName] = (revenueByBranch[branchName] || 0) + parseFloat(order.total_amount || '0')
    })

    // Orders by date
    const ordersByDate: Array<{ date: string; orders: number; revenue: number }> = []
    const current = start
    while (current <= end) {
      const dateStr = format(current, 'yyyy-MM-dd')
      const dayOrders = orders.filter(order => 
        format(new Date(order.created_at), 'yyyy-MM-dd') === dateStr
      )
      const dayRevenue = dayOrders.reduce((sum, order) => 
        sum + parseFloat(order.total_amount || '0'), 0
      )
      
      ordersByDate.push({
        date: format(current, 'MMM dd'),
        orders: dayOrders.length,
        revenue: dayRevenue
      })
      
      current.setDate(current.getDate() + 1)
    }

    return {
      totalOrders,
      totalRevenue,
      totalCommission,
      averageOrderValue,
      ordersByStatus,
      revenueByBranch,
      ordersByDate
    }
  }

  const exportToCSV = () => {
    const csvData = generateCSVData()
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const filename = `bbq-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    saveAs(blob, filename)
  }

  const exportToExcel = () => {
    const excelData = generateExcelData()
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics')
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const filename = `bbq-analytics-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    saveAs(blob, filename)
  }

  const generateCSVData = () => {
    const headers = ['Date', 'Orders', 'Revenue', 'Commission']
    const rows = analyticsData.ordersByDate.map(item => [
      item.date,
      item.orders,
      item.revenue.toFixed(2),
      (item.revenue * 0.03).toFixed(2) // Assuming 3% commission rate
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const generateExcelData = () => {
    return analyticsData.ordersByDate.map(item => ({
      Date: item.date,
      Orders: item.orders,
      Revenue: item.revenue,
      Commission: (item.revenue * 0.03).toFixed(2)
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-lays-orange-gold'
      case 'confirmed': return 'bg-blue-500'
      case 'preparing': return 'bg-lays-orange-gold'
      case 'ready': return 'bg-green-500'
      case 'completed': return 'bg-lays-dark-red'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <AdminLayout 
        currentPage="analytics" 
        userName={user?.full_name || 'Admin'}
        pageTitle="Analytics & Reports"
        pageDescription="View sales reports, analytics, and export data for business insights."
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
      pageDescription="View sales reports, analytics, and export data for business insights."
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="text-gray-600 mt-1">Business intelligence and performance metrics</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={loadAnalytics} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button onClick={exportToCSV} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button onClick={exportToExcel} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Custom Date Start */}
          {dateRange === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
              />
            </div>
          )}

          {/* Custom Date End */}
          {dateRange === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
              />
            </div>
          )}

          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-lays-dark-red rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{analyticsData.totalOrders}</h3>
          <p className="text-gray-600 font-medium">Total Orders</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-lays-bright-red rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(analyticsData.totalRevenue)}
          </h3>
          <p className="text-gray-600 font-medium">Total Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-lays-orange-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(analyticsData.totalCommission)}
          </h3>
          <p className="text-gray-600 font-medium">Total Commission</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-lays-brown-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(analyticsData.averageOrderValue)}
          </h3>
          <p className="text-gray-600 font-medium">Avg Order Value</p>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders by Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Branch */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Branch</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.revenueByBranch)
              .sort(([,a], [,b]) => b - a)
              .map(([branch, revenue]) => (
                <div key={branch} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{branch}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(revenue)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Orders Timeline Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Timeline</h3>
        <div className="h-64 flex items-end space-x-2">
          {analyticsData.ordersByDate.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-lays-dark-red rounded-t" 
                   style={{ height: `${(item.orders / Math.max(...analyticsData.ordersByDate.map(d => d.orders))) * 200}px` }}>
              </div>
              <div className="text-xs text-gray-600 mt-2 text-center">
                <div className="font-medium">{item.orders}</div>
                <div className="text-gray-500">{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Timeline Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Timeline</h3>
        <div className="h-64 flex items-end space-x-2">
          {analyticsData.ordersByDate.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-lays-bright-red rounded-t" 
                   style={{ height: `${(item.revenue / Math.max(...analyticsData.ordersByDate.map(d => d.revenue))) * 200}px` }}>
              </div>
              <div className="text-xs text-gray-600 mt-2 text-center">
                <div className="font-medium">{formatCurrency(item.revenue)}</div>
                <div className="text-gray-500">{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Report */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Performance Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span className="font-medium">{analyticsData.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <span className="font-medium">{formatCurrency(analyticsData.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Commission:</span>
                <span className="font-medium">{formatCurrency(analyticsData.totalCommission)}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Order Value:</span>
                <span className="font-medium">{formatCurrency(analyticsData.averageOrderValue)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Export Options</h4>
            <div className="space-y-3">
              <button onClick={exportToCSV} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Download CSV Report</span>
              </button>
              <button onClick={exportToExcel} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Download Excel Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
