/**
 * 🔐 BRANCH MANAGEMENT - ADMIN DASHBOARD 🛡️
 * 
 * This page provides comprehensive branch management:
 * - Add, edit, and deactivate branches
 * - Monitor branch performance and status
 * - Assign crew members to branches
 * - View branch-specific analytics
 * - Manage branch operating hours and details
 * 
 * ⚠️  WARNING: This is part of the admin dashboard system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /admin/branches route
 * 🎯  PURPOSE: Manage all BBQ branch locations
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  Phone,
  Mail,
  Globe,
  Star
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  email: string
  operating_hours: string
  is_active: boolean
  created_at: string
  crew_count?: number
  order_count?: number
  total_revenue?: number
}

interface CrewMember {
  id: string
  full_name: string
  email: string
  is_active: boolean
}

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    operating_hours: '',
    is_active: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
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

      // Load branches with performance data
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .order('name')

      if (branchError) throw branchError

      // Load crew count for each branch
      const { data: crewData, error: crewError } = await supabase
        .from('users')
        .select('branch_id')
        .eq('role', 'crew')
        .eq('is_active', true)

      if (crewError) throw crewError

      // Load order count and revenue for each branch
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('branch_id, total_amount')
        .eq('order_status', 'completed')

      if (orderError) throw crewError

      // Process branch data with counts
      const branchesWithStats = branchData?.map(branch => {
        const crewCount = crewData?.filter(crew => crew.branch_id === branch.id).length || 0
        const branchOrders = orderData?.filter(order => order.branch_id === branch.id) || []
        const orderCount = branchOrders.length
        const totalRevenue = branchOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0)

        return {
          ...branch,
          crew_count: crewCount,
          order_count: orderCount,
          total_revenue: totalRevenue
        }
      }) || []

      setBranches(branchesWithStats)

      // Load all crew members for assignment
      const { data: allCrewData, error: allCrewError } = await supabase
        .from('users')
        .select('id, full_name, email, is_active')
        .eq('role', 'crew')
        .order('full_name')

      if (allCrewError) throw allCrewError
      setCrewMembers(allCrewData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      operating_hours: '',
      is_active: true
    })
    setEditingBranch(null)
    setShowAddForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingBranch) {
        // Update existing branch
        const { error } = await supabase
          .from('branches')
          .update({
            name: formData.name.trim(),
            address: formData.address.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            operating_hours: formData.operating_hours.trim(),
            is_active: formData.is_active
          })
          .eq('id', editingBranch.id)

        if (error) throw error

        // Log the action
        await supabase.from('system_logs').insert({
          log_type: 'branch_updated',
          message: `Branch "${formData.name}" updated`,
          ip_address: '127.0.0.1'
        })
      } else {
        // Create new branch
        const { error } = await supabase
          .from('branches')
          .insert({
            name: formData.name.trim(),
            address: formData.address.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            operating_hours: formData.operating_hours.trim(),
            is_active: formData.is_active
          })

        if (error) throw error

        // Log the action
        await supabase.from('system_logs').insert({
          log_type: 'branch_created',
          message: `Branch "${formData.name}" created`,
          ip_address: '127.0.0.1'
        })
      }

      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save branch:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      operating_hours: branch.operating_hours,
      is_active: branch.is_active
    })
    setShowAddForm(true)
  }

  const handleDelete = async (branchId: string, branchName: string) => {
    if (!confirm(`Are you sure you want to delete "${branchName}"? This will also remove all associated crew assignments and orders.`)) return

    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId)

      if (error) throw error

      // Log the action
      await supabase.from('system_logs').insert({
        log_type: 'branch_deleted',
        message: `Branch "${branchName}" deleted`,
        ip_address: '127.0.0.1'
      })

      loadData()
    } catch (error) {
      console.error('Failed to delete branch:', error)
    }
  }

  const toggleBranchStatus = async (branchId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_active: !currentStatus })
        .eq('id', branchId)

      if (error) throw error

      // Update local state
      setBranches(prev => prev.map(branch => 
        branch.id === branchId ? { ...branch, is_active: !currentStatus } : branch
      ))

      // Log the action
      await supabase.from('system_logs').insert({
        log_type: 'branch_status_toggled',
        message: `Branch status toggled to ${!currentStatus ? 'active' : 'inactive'}`,
        ip_address: '127.0.0.1'
      })
    } catch (error) {
      console.error('Failed to toggle branch status:', error)
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

  if (isLoading) {
    return (
      <AdminLayout 
        currentPage="branches" 
        userName={user?.full_name || 'Admin'}
        pageTitle="Branch Management"
        pageDescription="Manage all BBQ branch locations and their operations."
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading branches...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' ? branch.is_active : !branch.is_active)
    return matchesSearch && matchesStatus
  })

  return (
    <AdminLayout 
      currentPage="branches" 
      userName={user?.full_name || 'Admin'}
      pageTitle="Branch Management"
      pageDescription="Manage all BBQ branch locations and their operations."
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-gray-600 mt-1">{filteredBranches.length} branches found</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search branches..."
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

          {/* Filter Button */}
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Add/Edit Branch Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingBranch ? 'Edit Branch' : 'Add New Branch'}
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
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder="e.g., Surigao City Main Branch"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder="+63 912 345 6789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder="branch@surigaobbq.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={formData.operating_hours}
                  onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder="e.g., 10:00 AM - 10:00 PM"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  rows={3}
                  placeholder="Enter complete branch address..."
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
                  Branch is active and accepting orders
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (editingBranch ? 'Update Branch' : 'Add Branch')}
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

      {/* Branches List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredBranches.map((branch) => (
          <div key={branch.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <div className="space-y-4">
              {/* Branch Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{branch.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{branch.address}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  branch.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {branch.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                {branch.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{branch.email}</span>
                  </div>
                )}
                {branch.operating_hours && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{branch.operating_hours}</span>
                  </div>
                )}
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-lays-dark-red">{branch.crew_count || 0}</div>
                  <div className="text-xs text-gray-600">Crew</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-lays-orange-gold">{branch.order_count || 0}</div>
                  <div className="text-xs text-gray-600">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(branch.total_revenue || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Revenue</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(branch)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => toggleBranchStatus(branch.id, branch.is_active)}
                  className="flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    branch.is_active
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }"
                >
                  {branch.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDelete(branch.id, branch.name)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Branches Message */}
      {filteredBranches.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center py-12">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters or search terms.' 
              : 'Get started by adding your first branch location.'
            }
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-gray-900">{branches.length}</h3>
          <p className="text-gray-600">Total Branches</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-green-600">
            {branches.filter(b => b.is_active).length}
          </h3>
          <p className="text-gray-600">Active Branches</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-lays-orange-gold">
            {branches.reduce((sum, b) => sum + (b.crew_count || 0), 0)}
          </h3>
          <p className="text-gray-600">Total Crew</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-lays-dark-red">
            {formatCurrency(branches.reduce((sum, b) => sum + (b.total_revenue || 0), 0))}
          </h3>
          <p className="text-gray-600">Total Revenue</p>
        </div>
      </div>
    </AdminLayout>
  )
}
