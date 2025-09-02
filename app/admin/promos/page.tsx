/**
 * 🔐 PROMO CODE MANAGEMENT - ADMIN DASHBOARD 🛡️
 * 
 * This page provides comprehensive promo code management:
 * - Create, edit, and deactivate promotional codes
 * - Set discount types (percentage, fixed amount)
 * - Configure usage limits and expiration dates
 * - Monitor promo code performance and usage
 * - Branch-specific and global promotions
 * 
 * ⚠️  WARNING: This is part of the admin dashboard system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /admin/promos route
 * 🎯  PURPOSE: Manage all promotional offers and discounts
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  DollarSign,
  Percent,
  Users,
  ShoppingCart,
  TrendingUp,
  Copy,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'

interface PromoCode {
  id: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  minimum_order_amount?: number
  maximum_discount?: number
  usage_limit: number
  used_count: number
  is_active: boolean
  valid_from: string
  valid_until: string
  branch_id?: string
  branch_name?: string
  created_at: string
  total_orders?: number
  total_discount?: number
}

interface Branch {
  id: string
  name: string
}

export default function PromoCodeManagement() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    minimum_order_amount: 0,
    maximum_discount: 0,
    usage_limit: 100,
    is_active: true,
    valid_from: '',
    valid_until: '',
    branch_id: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

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

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Load promo codes with performance data
      const { data: promoData, error: promoError } = await supabase
        .from('promo_codes')
        .select(`
          *,
          branches(name)
        `)
        .order('created_at', { ascending: false })

      if (promoError) throw promoError

      // Load branches for assignment
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (branchError) throw branchError

      // Load order data for promo code performance
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('promo_code_id, total_amount, discount_amount')
        .not('promo_code_id', 'is', null)

      if (orderError) throw orderError

      // Process promo codes with performance data
      const promosWithStats = promoData?.map(promo => {
        const promoOrders = orderData?.filter(order => order.promo_code_id === promo.id) || []
        const totalOrders = promoOrders.length
        const totalDiscount = promoOrders.reduce((sum, order) => sum + (parseFloat(order.discount_amount || '0')), 0)

        return {
          ...promo,
          branch_name: promo.branches?.name,
          total_orders: totalOrders,
          total_discount: totalDiscount
        }
      }) || []

      setPromoCodes(promosWithStats)
      setBranches(branchData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_order_amount: 0,
      maximum_discount: 0,
      usage_limit: 100,
      is_active: true,
      valid_from: '',
      valid_until: '',
      branch_id: ''
    })
    setEditingPromo(null)
    setShowAddForm(false)
  }

  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code: result })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingPromo) {
        // Update existing promo code
        const { error } = await supabase
          .from('promo_codes')
          .update({
            code: formData.code.trim().toUpperCase(),
            description: formData.description.trim(),
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            minimum_order_amount: formData.minimum_order_amount || null,
            maximum_discount: formData.maximum_discount || null,
            usage_limit: formData.usage_limit,
            is_active: formData.is_active,
            valid_from: formData.valid_from,
            valid_until: formData.valid_until,
            branch_id: formData.branch_id || null
          })
          .eq('id', editingPromo.id)

        if (error) throw error

        // Log the action
        await supabase.from('system_logs').insert({
          log_type: 'promo_code_updated',
          message: `Promo code "${formData.code}" updated`,
          ip_address: '127.0.0.1'
        })
      } else {
        // Create new promo code
        const { error } = await supabase
          .from('promo_codes')
          .insert({
            code: formData.code.trim().toUpperCase(),
            description: formData.description.trim(),
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            minimum_order_amount: formData.minimum_order_amount || null,
            maximum_discount: formData.maximum_discount || null,
            usage_limit: formData.usage_limit,
            is_active: formData.is_active,
            valid_from: formData.valid_from,
            valid_until: formData.valid_until,
            branch_id: formData.branch_id || null
          })

        if (error) throw error

        // Log the action
        await supabase.from('system_logs').insert({
          log_type: 'promo_code_created',
          message: `Promo code "${formData.code}" created`,
          ip_address: '127.0.0.1'
        })
      }

      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save promo code:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo)
    setFormData({
      code: promo.code,
      description: promo.description,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      minimum_order_amount: promo.minimum_order_amount || 0,
      maximum_discount: promo.maximum_discount || 0,
      usage_limit: promo.usage_limit,
      is_active: promo.is_active,
      valid_from: promo.valid_from.split('T')[0],
      valid_until: promo.valid_until.split('T')[0],
      branch_id: promo.branch_id || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (promoId: string, promoCode: string) => {
    if (!confirm(`Are you sure you want to delete promo code "${promoCode}"? This will remove all associated discounts.`)) return

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', promoId)

      if (error) throw error

      // Log the action
      await supabase.from('system_logs').insert({
        log_type: 'promo_code_deleted',
        message: `Promo code "${promoCode}" deleted`,
        ip_address: '127.0.0.1'
      })

      loadData()
    } catch (error) {
      console.error('Failed to delete promo code:', error)
    }
  }

  const togglePromoStatus = async (promoId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', promoId)

      if (error) throw error

      // Update local state
      setPromoCodes(prev => prev.map(promo => 
        promo.id === promoId ? { ...promo, is_active: !currentStatus } : promo
      ))

      // Log the action
      await supabase.from('system_logs').insert({
        log_type: 'promo_code_status_toggled',
        message: `Promo code status toggled to ${!currentStatus ? 'active' : 'inactive'}`,
        ip_address: '127.0.0.1'
      })
    } catch (error) {
      console.error('Failed to toggle promo code status:', error)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const isActive = (promo: PromoCode) => {
    const now = new Date()
    const validFrom = new Date(promo.valid_from)
    const validUntil = new Date(promo.valid_until)
    return promo.is_active && now >= validFrom && now <= validUntil && promo.used_count < promo.usage_limit
  }

  if (isLoading) {
    return (
      <AdminLayout 
        currentPage="promos" 
        userName={user?.full_name || 'Admin'}
        pageTitle="Promo Code Management"
        pageDescription="Create and manage discount codes and promotional offers."
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading promo codes...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const filteredPromoCodes = promoCodes.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promo.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' ? isActive(promo) : !isActive(promo))
    const matchesType = typeFilter === 'all' || promo.discount_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <AdminLayout 
      currentPage="promos" 
      userName={user?.full_name || 'Admin'}
      pageTitle="Promo Code Management"
      pageDescription="Create and manage discount codes and promotional offers."
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Code Management</h1>
          <p className="text-gray-600 mt-1">{filteredPromoCodes.length} promo codes found</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Promo Code</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search promo codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>

          {/* Filter Button */}
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Add/Edit Promo Code Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingPromo ? 'Edit Promo Code' : 'Add New Promo Code'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                    placeholder="e.g., SUMMER20"
                    required
                  />
                  <button
                    type="button"
                    onClick={generatePromoCode}
                    className="whitespace-nowrap px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder="e.g., Summer BBQ Special"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type *
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₱)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value *
                </label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : '9999'}
                  step={formData.discount_type === 'percentage' ? '1' : '10'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount (₱)
                </label>
                <input
                  type="number"
                  value={formData.minimum_order_amount}
                  onChange={(e) => setFormData({ ...formData, minimum_order_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Discount (₱)
                </label>
                <input
                  type="number"
                  value={formData.maximum_discount}
                  onChange={(e) => setFormData({ ...formData, maximum_discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder="0 (no limit)"
                  min="0"
                  step="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Limit *
                </label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 100 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder="100"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch (Optional)
                </label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid From *
                </label>
                <input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until *
                </label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-lays-dark-red border-gray-300 rounded focus:ring-lays-dark-red"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Promo code is active and can be used
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (editingPromo ? 'Update Promo Code' : 'Add Promo Code')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promo Codes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredPromoCodes.map((promo) => (
          <div key={promo.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <div className="space-y-4">
              {/* Promo Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{promo.code}</h3>
                    <button
                      onClick={() => copyToClipboard(promo.code)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy to clipboard"
                    >
                      {copiedCode === promo.code ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isActive(promo)
                      ? 'bg-green-100 text-green-800' 
                      : isExpired(promo.valid_until)
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isActive(promo) ? 'Active' : isExpired(promo.valid_until) ? 'Expired' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Discount Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-gray-900">
                    {promo.discount_type === 'percentage' 
                      ? `${promo.discount_value}%` 
                      : formatCurrency(promo.discount_value)
                    }
                  </span>
                </div>
                {promo.minimum_order_amount && promo.minimum_order_amount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Min. Order:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(promo.minimum_order_amount)}
                    </span>
                  </div>
                )}
                {promo.maximum_discount && promo.maximum_discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Max. Discount:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(promo.maximum_discount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Usage:</span>
                  <span className="font-medium text-gray-900">
                    {promo.used_count} / {promo.usage_limit}
                  </span>
                </div>
                {promo.branch_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Branch:</span>
                    <span className="font-medium text-gray-900">{promo.branch_name}</span>
                  </div>
                )}
              </div>

              {/* Validity Period */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valid:</span>
                  <span className="text-gray-900">
                    {formatDate(promo.valid_from)} - {formatDate(promo.valid_until)}
                  </span>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-lays-dark-red">{promo.total_orders || 0}</div>
                  <div className="text-xs text-gray-600">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-lays-orange-gold">
                    {formatCurrency(promo.total_discount || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Discount</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(promo)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => togglePromoStatus(promo.id, promo.is_active)}
                  className="flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    promo.is_active
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }"
                >
                  {promo.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDelete(promo.id, promo.code)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Promo Codes Message */}
      {filteredPromoCodes.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center py-12">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No promo codes found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters or search terms.' 
              : 'Get started by adding your first promotional code.'
            }
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-gray-900">{promoCodes.length}</h3>
          <p className="text-gray-600">Total Promo Codes</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-green-600">
            {promoCodes.filter(p => isActive(p)).length}
          </h3>
          <p className="text-gray-600">Active Promos</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-lays-orange-gold">
            {promoCodes.reduce((sum, p) => sum + (p.total_orders || 0), 0)}
          </h3>
          <p className="text-gray-600">Total Orders</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-lays-dark-red">
            {formatCurrency(promoCodes.reduce((sum, p) => sum + (p.total_discount || 0), 0))}
          </h3>
          <p className="text-gray-600">Total Discounts</p>
        </div>
      </div>
    </AdminLayout>
  )
}
