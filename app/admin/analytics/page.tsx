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
import DesignLock from '@/components/layout/DesignLock'

interface DailyReport {
  order_date: string
  total_orders: number
  total_revenue: number
  total_subtotal: number
  total_discount: number
  average_order_value: number
  orders_by_status: Record<string, number>
}

interface BranchReport {
  branch_id: string
  branch_name: string
  total_orders: number
  total_revenue: number
  total_subtotal: number
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
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [branches, setBranches] = useState<Array<{id: string, name: string}>>([])
  const supabase = createClient()

  useEffect(() => {
    loadBranches()
    loadDailyReport()
    loadBranchReport()
    loadOrderHistory()
  }, [selectedDate, selectedBranch, dateRange])

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
      const { data, error } = await supabase
        .rpc('get_daily_sales_report', { report_date: selectedDate })

      if (error) throw error
      setDailyReports(data || [])
    } catch (error) {
      console.error('Failed to load daily report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBranchReport = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_branch_sales_report', {
          branch_id_param: selectedBranch || null,
          start_date: dateRange.start,
          end_date: dateRange.end
        })

      if (error) throw error
      setBranchReports(data || [])
    } catch (error) {
      console.error('Failed to load branch report:', error)
    }
  }

  const loadOrderHistory = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_order_history_with_qr', {
          branch_id_param: selectedBranch || null,
          start_date: dateRange.start,
          end_date: dateRange.end,
          limit_count: 50
        })

      if (error) throw error
      setOrderHistory(data || [])
    } catch (error) {
      console.error('Failed to load order history:', error)
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

  const totalRevenue = branchReports.reduce((sum, report) => sum + Number(report.total_revenue), 0)
  const totalOrders = branchReports.reduce((sum, report) => sum + Number(report.total_orders), 0)
  const totalDiscounts = branchReports.reduce((sum, report) => sum + Number(report.total_discount), 0)
  const netRevenue = totalRevenue - totalDiscounts

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Admin Analytics" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
          <p className="text-gray-600">Order history, revenue analysis, and business insights</p>
        </div>

        {/* Filters */}
        <div className="bbq-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bbq-input"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bbq-input"
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bbq-card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bbq-card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bbq-card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(netRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bbq-card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Discounts</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDiscounts)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Performance */}
        <div className="bbq-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Branch Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branchReports.map((report) => (
                  <tr key={report.branch_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.branch_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(Number(report.total_revenue))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(Number(report.average_order_value))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        Number(report.completion_rate) >= 80 ? 'bg-green-100 text-green-800' :
                        Number(report.completion_rate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Number(report.completion_rate).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order History */}
        <div className="bbq-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
            <span className="text-sm text-gray-500">{orderHistory.length} orders</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderHistory.map((order) => (
                  <tr key={order.order_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">{order.customer_phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{formatCurrency(Number(order.total_amount))}</div>
                        {Number(order.promo_discount) > 0 && (
                          <div className="text-xs text-red-600">
                            -{formatCurrency(Number(order.promo_discount))} discount
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.branch_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
    </div>
  )
}