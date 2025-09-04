'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { inventoryManager } from '@/lib/inventory-manager'
import { BarChart3, TrendingUp, DollarSign, Package, Users, Calendar, Download, RefreshCw } from 'lucide-react'

interface AnalyticsData {
  total_orders: number
  total_revenue: number
  total_commission: number
  products_sold: number
  top_products: Array<{
  name: string
    quantity: number
    revenue: number
  }>
  daily_sales: Array<{
    date: string
    revenue: number
    orders: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  })
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)

  useEffect(() => {
      loadAnalytics()
    loadPendingOrdersCount()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const data = await inventoryManager.getSalesAnalytics(dateRange.start, dateRange.end)
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPendingOrdersCount = () => {
    setPendingOrdersCount(inventoryManager.getPendingOrdersCount())
  }

  const exportData = () => {
    if (!analytics) return
    
    const csvContent = [
      ['Date', 'Revenue', 'Orders'],
      ...analytics.daily_sales.map(day => [day.date, day.revenue, day.orders])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-analytics-${dateRange.start}-to-${dateRange.end}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
          <div className="w-8 h-8 border-4 border-lays-orange-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Analytics</h1>
          <p className="text-gray-600">Track your business performance and sales data</p>
      </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div className="flex items-center space-x-2">
              <input
                type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
              <input
                type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadAnalytics}
                className="px-4 py-2 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
        </div>
      </div>

        {/* Offline Orders Alert */}
        {pendingOrdersCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Pending Offline Orders</h3>
                <p className="text-sm text-yellow-700">
                  {pendingOrdersCount} orders are waiting to be synced when internet connection is restored.
                </p>
          </div>
        </div>
          </div>
        )}

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-900">{analytics.total_orders}</p>
          </div>
        </div>
      </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900">₱{analytics.total_revenue.toLocaleString()}</p>
                </div>
          </div>
        </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Total Commission</p>
                  <p className="text-2xl font-bold text-purple-900">₱{analytics.total_commission.toLocaleString()}</p>
          </div>
        </div>
      </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-600">Products Sold</p>
                  <p className="text-2xl font-bold text-orange-900">{analytics.products_sold}</p>
              </div>
              </div>
            </div>
        </div>
        )}

        {/* Charts and Tables */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Sales Chart */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales</h3>
              <div className="space-y-3">
                {analytics.daily_sales.slice(-7).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-gray-500">{day.orders} orders</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-lays-orange-gold h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (day.revenue / Math.max(...analytics.daily_sales.map(d => d.revenue))) * 100)}%` 
                          }}
                        />
              </div>
                      <span className="text-sm font-medium text-gray-900 w-16 text-right">
                        ₱{day.revenue.toLocaleString()}
                      </span>
              </div>
            </div>
          ))}
        </div>
      </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
              <div className="space-y-3">
                {analytics.top_products.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} sold</p>
              </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">₱{product.revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">revenue</p>
              </div>
              </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Commission Breakdown */}
        {analytics && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">₱{analytics.total_commission.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Commission Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  ₱{(analytics.total_commission / analytics.total_orders).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Average per Order</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {((analytics.total_commission / analytics.total_revenue) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Commission Rate</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}