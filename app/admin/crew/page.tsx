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
import { createClient } from '@/lib/supabase'
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
  user_id?: string
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
  const supabase = createClient()

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

      // Verify admin role from admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('role, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (adminError || !adminUser || adminUser.role !== 'admin') {
        await supabase.auth.signOut()
        router.push('/admin/login')
        return
      }

      setUser({ role: adminUser.role, full_name: adminUser.name })
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Load crew members from admin_users table
      const { data: crewUsers, error: crewError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('role', 'crew')
        .eq('is_active', true)

      if (crewError) throw crewError

      const crewWithBranchNames = await Promise.all(
        (crewUsers || []).map(async (crewUser) => {
          let branchName = 'No Branch Assigned'
          
          if (crewUser.branch_id) {
            const { data: branchData } = await supabase
              .from('branches')
              .select('name')
              .eq('id', crewUser.branch_id)
              .single()
            branchName = branchData?.name || 'Unknown Branch'
          }

          return {
            id: crewUser.id,
            email: crewUser.email,
            user_id: crewUser.user_id,
            full_name: crewUser.name,
            role: crewUser.role,
            branch_id: crewUser.branch_id,
            branch_name: branchName,
            is_active: crewUser.is_active,
            created_at: crewUser.created_at
          }
        })
      )

      setCrewMembers(crewWithBranchNames)

      // Load branches
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (branchError) throw branchError
      setBranches(branchData || [])

      // Load today's attendance (simplified for now)
      const today = new Date().toISOString().split('T')[0]
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('crew_attendance')
        .select('*')
        .gte('clock_in', today)
        .lt('clock_in', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('clock_in', { ascending: false })

      if (attendanceError) {
        console.log('No attendance data available yet:', attendanceError)
        setAttendanceRecords([])
      } else {
        const attendanceWithNames = attendanceData?.map(record => ({
          ...record,
          user_name: 'Crew Member', // Placeholder until users table is set up
          branch_name: 'Branch' // Placeholder until branches are properly linked
        })) || []
        setAttendanceRecords(attendanceWithNames)
      }
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
        // Create new crew member - add to admin_users table first
        const { data: crewData, error: crewError } = await supabase
          .from('admin_users')
          .insert({
            email: formData.email.trim(),
            name: formData.full_name.trim(),
            role: 'crew',
            branch_id: formData.branch_id || null,
            is_active: formData.is_active
          })
          .select()
          .single()

        if (crewError) throw crewError

        // Log the action
        await supabase.from('system_logs').insert({
          log_type: 'crew_created',
          message: `Crew member "${formData.full_name}" created - needs auth user creation`,
          ip_address: '127.0.0.1'
        })

        // Show success message with instructions
        alert(`Crew member "${formData.full_name}" created successfully!\n\nIMPORTANT: You need to create login credentials for this crew member.\n\n1. Go to the crew member in the list below\n2. Click "Create Login Credentials" button\n3. This will create their Supabase Auth user\n\nEmail: ${formData.email}\nTemporary Password: temp123456`)
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

  const createAuthUser = async (member: CrewMember) => {
    if (!confirm(`Create login credentials for "${member.full_name}" (${member.email})?`)) return

    try {
      // Since we can't use admin.createUser from client-side, we'll use a different approach
      // We'll create a temporary auth user using the regular signUp method
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: member.email,
        password: 'temp123456',
        options: {
          data: {
            full_name: member.full_name,
            role: 'crew'
          }
        }
      })

      if (authError) {
        console.error('Failed to create auth user:', authError)
        alert(`Failed to create login credentials: ${authError.message}\n\nThis might be because the email is already registered. Please try using a different email or contact support.`)
        return
      }

      if (!authData.user) {
        alert('Failed to create auth user. Please try again.')
        return
      }

      // Update admin_users table with the auth user ID
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ user_id: authData.user.id })
        .eq('id', member.id)

      if (updateError) {
        console.error('Failed to update admin_users:', updateError)
        alert('Auth user created but failed to link to admin_users table')
        return
      }

      // Log the action
      await supabase.from('system_logs').insert({
        log_type: 'crew_auth_created',
        message: `Login credentials created for crew member "${member.full_name}"`,
        ip_address: '127.0.0.1'
      })

      alert(`Login credentials created for ${member.full_name}!\nEmail: ${member.email}\nPassword: temp123456\n\nIMPORTANT: The crew member needs to check their email and confirm their account before they can login.`)
      
      // Reload data to show updated status
      loadData()
    } catch (error) {
      console.error('Failed to create auth user:', error)
      alert('Failed to create login credentials. Please try again.')
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
      <div className="space-y-4 mb-8">
        {filteredCrew.map((member) => (
          <div key={member.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            {/* Mobile Card Layout */}
            <div className="block lg:hidden">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{member.full_name}</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Branch and Date Info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{member.branch_name || 'Unassigned'}</span>
                  </div>
                  <p className="text-xs text-gray-500">Joined: {formatDate(member.created_at)}</p>
                </div>

                {/* Actions - Mobile Layout */}
                <div className="pt-3 border-t border-gray-200">
                  {/* All Actions in One Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="px-2 py-2 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleMemberStatus(member.id, member.is_active)}
                      className={`px-2 py-2 text-xs rounded transition-colors duration-200 flex items-center justify-center ${
                        member.is_active 
                          ? 'bg-gray-600 text-white hover:bg-gray-700' 
                          : 'bg-lays-dark-red text-white hover:bg-red-800'
                      }`}
                    >
                      {member.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(member.id, member.full_name)}
                      className="px-2 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </button>
                  </div>
                  
                  {/* Create Auth User button - Full Width */}
                  {!member.user_id ? (
                    <button
                      onClick={() => createAuthUser(member)}
                      className="w-full mt-2 px-3 py-2 bg-lays-orange-gold text-white text-sm rounded hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Login Credentials
                    </button>
                  ) : (
                    <div className="w-full mt-2 flex items-center justify-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Login credentials active
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Card Layout */}
            <div className="hidden lg:block">
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
                    <span className="text-sm text-gray-700">{member.branch_name || 'Unassigned'}</span>
                  </div>
                  <p className="text-xs text-gray-500">Joined: {formatDate(member.created_at)}</p>
                </div>

                {/* Actions - Desktop Layout */}
                <div className="pt-3 border-t border-gray-200">
                  {/* All Actions in One Row */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleMemberStatus(member.id, member.is_active)}
                      className={`flex-1 px-3 py-2 text-sm rounded transition-colors duration-200 flex items-center justify-center ${
                        member.is_active 
                          ? 'bg-gray-600 text-white hover:bg-gray-700' 
                          : 'bg-lays-dark-red text-white hover:bg-red-800'
                      }`}
                    >
                      {member.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(member.id, member.full_name)}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Create Auth User button - Full Width */}
                  {!member.user_id ? (
                    <button
                      onClick={() => createAuthUser(member)}
                      className="w-full mt-2 px-3 py-2 bg-lays-orange-gold text-white text-sm rounded hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Login Credentials
                    </button>
                  ) : (
                    <div className="w-full mt-2 flex items-center justify-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Login credentials active
                      </span>
                    </div>
                  )}
                </div>
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
