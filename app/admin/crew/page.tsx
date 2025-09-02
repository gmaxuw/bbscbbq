/**
 * 🔐 CREW MANAGEMENT - ADMIN DASHBOARD 🛡️
 * 
 * This page provides comprehensive crew management:
 * - Monitor crew attendance across all branches
 * - Track working hours and time management
 * - Assign crew members to branches
 * - View crew performance metrics
 * - Manage crew accounts and permissions
 * 
 * ⚠️  WARNING: This is part of the admin dashboard system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /admin/crew route
 * 🎯  PURPOSE: Manage crew members and attendance
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  UserPlus,
  LogOut
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'

interface CrewMember {
  id: string
  email: string
  full_name: string
  role: string
  branch_id: string
  branch_name?: string
  is_active: boolean
  created_at: string
}

interface AttendanceRecord {
  id: string
  user_id: string
  user_name: string
  branch_id: string
  branch_name: string
  clock_in: string
  clock_out?: string
  total_hours?: number
  date: string
}

interface Branch {
  id: string
  name: string
  is_active: boolean
}

export default function CrewManagement() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    branch_id: '',
    is_active: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  useEffect(() => {
    filterCrewMembers()
  }, [crewMembers, searchTerm, statusFilter, branchFilter])

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

      // Load crew members
      const { data: crewData, error: crewError } = await supabase
        .from('users')
        .select(`
          *,
          branches(name)
        `)
        .eq('role', 'crew')
        .order('full_name')

      if (crewError) throw crewError

      const crewWithBranchNames = crewData?.map(member => ({
        ...member,
        branch_name: member.branches?.name || 'Unassigned'
      })) || []

      setCrewMembers(crewWithBranchNames)

      // Load branches
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (branchError) throw branchError
      setBranches(branchData || [])

      // Load today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('crew_attendance')
        .select(`
          *,
          users(full_name),
          branches(name)
        `)
        .gte('clock_in', today)
        .lt('clock_in', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('clock_in', { ascending: false })

      if (attendanceError) throw attendanceError

      const attendanceWithNames = attendanceData?.map(record => ({
        ...record,
        user_name: record.users?.full_name || 'Unknown',
        branch_name: record.branches?.name || 'Unknown'
      })) || []

      setAttendanceRecords(attendanceWithNames)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterCrewMembers = () => {
    let filtered = crewMembers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => 
        statusFilter === 'active' ? member.is_active : !member.is_active
      )
    }

    // Branch filter
    if (branchFilter !== 'all') {
      filtered = filtered.filter(member => member.branch_id === branchFilter)
    }

    return filtered
  }

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      branch_id: '',
      is_active: true
    })
    setEditingMember(null)
    setShowAddForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingMember) {
        // Update existing crew member
        const { error } = await supabase
          .from('users')
          .update({
            full_name: formData.full_name.trim(),
            branch_id: formData.branch_id || null,
            is_active: formData.is_active
          })
          .eq('id', editingMember.id)

        if (error) throw error

        // Log the action
        await supabase.from('system_logs').insert({
          log_type: 'crew_updated',
          user_id: editingMember.id,
          message: `Crew member "${formData.full_name}" updated`,
          ip_address: '127.0.0.1'
        })
      } else {
        // Create new crew member (placeholder password)
        const { error } = await supabase
          .from('users')
          .insert({
            email: formData.email.trim(),
            full_name: formData.full_name.trim(),
            password_hash: '$2a$10$placeholder.hash.for.crew.password',
            role: 'crew',
            branch_id: formData.branch_id || null,
            is_active: formData.is_active
          })

        if (error) throw error

        // Log the action
        await supabase.from('system_logs').insert({
          log_type: 'crew_created',
          message: `Crew member "${formData.full_name}" created`,
          ip_address: '127.0.0.1'
        })
      }

      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save crew member:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (member: CrewMember) => {
    setEditingMember(member)
    setFormData({
      email: member.email,
      full_name: member.full_name,
      branch_id: member.branch_id || '',
      is_active: member.is_active
    })
    setShowAddForm(true)
  }

  const handleDelete = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to delete "${memberName}"?`)) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      // Log the action
      await supabase.from('system_logs').insert({
        log_type: 'crew_deleted',
        message: `Crew member "${memberName}" deleted`,
        ip_address: '127.0.0.1'
      })

      loadData()
    } catch (error) {
      console.error('Failed to delete crew member:', error)
    }
  }

  const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', memberId)

      if (error) throw error

      // Update local state
      setCrewMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, is_active: !currentStatus } : member
      ))

      // Log the action
      await supabase.from('system_logs').insert({
        log_type: 'crew_status_toggled',
        message: `Crew member status toggled to ${!currentStatus ? 'active' : 'inactive'}`,
        ip_address: '127.0.0.1'
      })
    } catch (error) {
      console.error('Failed to toggle crew member status:', error)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateHours = (clockIn: string, clockOut?: string) => {
    if (!clockOut) return 'Active'
    const start = new Date(clockIn)
    const end = new Date(clockOut)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return `${hours.toFixed(2)}h`
  }

  if (isLoading) {
    return (
      <AdminLayout 
        currentPage="crew" 
        userName={user?.full_name || 'Admin'}
        pageTitle="Loading Crew Management..."
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading crew data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const filteredCrew = filterCrewMembers()

  return (
    <AdminLayout 
      currentPage="crew" 
      userName={user?.full_name || 'Admin'}
      pageTitle="Crew Management"
      pageDescription={`${filteredCrew.length} crew members found. Monitor staff attendance and manage crew members across all branches.`}
    >

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search crew members..."
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

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
          >
            <option value="all">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          {/* Filter Button */}
          <button className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Add/Edit Crew Member Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingMember ? 'Edit Crew Member' : 'Add New Crew Member'}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder="e.g., Juan Dela Cruz"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  placeholder="crew@surigaobbq.com"
                  required
                  disabled={!!editingMember} // Can't change email for existing members
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Assignment
                </label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
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
                  Crew member is active and can access system
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-lays-dark-red text-white rounded-lg hover:bg-red-800 transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (editingMember ? 'Update Crew Member' : 'Add Crew Member')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Crew Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredCrew.map((member) => (
          <div key={member.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900 text-lg">{member.full_name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  member.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">{member.email}</p>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{member.branch_name}</span>
                </div>
                <p className="text-xs text-gray-500">Joined: {formatDate(member.created_at)}</p>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(member)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors duration-200"
                >
                  <Edit className="w-4 h-4 mr-2 inline" />
                  Edit
                </button>
                <button
                  onClick={() => toggleMemberStatus(member.id, member.is_active)}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-colors duration-200 ${
                    member.is_active 
                      ? 'bg-gray-600 text-white hover:bg-gray-700' 
                      : 'bg-lays-dark-red text-white hover:bg-red-800'
                  }`}
                >
                  {member.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDelete(member.id, member.full_name)}
                  className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors duration-200 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 inline" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Crew Members Message */}
      {filteredCrew.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No crew members found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || branchFilter !== 'all'
              ? 'Try adjusting your filters or search terms.' 
              : 'Get started by adding your first crew member.'
            }
          </p>
        </div>
      )}

      {/* Today's Attendance */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Attendance</h2>
        <div className="space-y-4">
          {attendanceRecords.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{record.user_name}</h3>
                  <p className="text-sm text-gray-600">{record.branch_name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Clock In</p>
                  <p className="font-medium text-gray-900">{formatDateTime(record.clock_in)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Clock Out</p>
                  <p className="font-medium text-gray-900">
                    {record.clock_out ? formatDateTime(record.clock_out) : 'Active'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="font-medium text-gray-900">
                    {calculateHours(record.clock_in, record.clock_out)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {attendanceRecords.length === 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No attendance records for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-gray-900">{crewMembers.length}</h3>
          <p className="text-gray-600">Total Crew</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-green-600">
            {crewMembers.filter(m => m.is_active).length}
          </h3>
          <p className="text-gray-600">Active Crew</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-lays-orange-gold">
            {attendanceRecords.filter(r => !r.clock_out).length}
          </h3>
          <p className="text-gray-600">Currently Working</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-lays-dark-red">
            {branches.length}
          </h3>
          <p className="text-gray-600">Active Branches</p>
        </div>
      </div>
    </AdminLayout>
  )
}
