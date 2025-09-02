'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Shield, UserCheck, UserX, Mail, Calendar } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { createClient } from '@/lib/supabase'
import { checkAdminAuth, createAdminUser, updateAdminUserStatus, AdminUser } from '@/lib/admin-auth'

export default function AdminUsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'crew' as 'admin' | 'crew'
  })

  const router = useRouter()
  const supabase = createClient()

  // Check admin authentication
  useEffect(() => {
    const checkAuth = async () => {
      const authResult = await checkAdminAuth()
      if (!authResult.isAuthenticated || authResult.user?.role !== 'admin') {
        router.push('/admin/login')
        return
      }
      fetchAdminUsers()
    }
    checkAuth()
  }, [router])

  const fetchAdminUsers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('admin_users')
        .select(`
          *,
          created_by_user:admin_users!created_by (
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching admin users:', error)
        setError('Failed to load admin users')
      } else {
        setAdminUsers(data || [])
      }
    } catch (error) {
      console.error('Error fetching admin users:', error)
      setError('Failed to load admin users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')
    setSuccess('')

    try {
      // Validate form
      if (!newUser.email || !newUser.password || !newUser.confirmPassword) {
        setError('Please fill in all fields')
        setIsCreating(false)
        return
      }

      if (newUser.password !== newUser.confirmPassword) {
        setError('Passwords do not match')
        setIsCreating(false)
        return
      }

      if (newUser.password.length < 8) {
        setError('Password must be at least 8 characters long')
        setIsCreating(false)
        return
      }

      // Create admin user
      const result = await createAdminUser(newUser.email, newUser.password, newUser.role)
      
      if (result.success) {
        setSuccess('Admin user created successfully!')
        setNewUser({ email: '', password: '', confirmPassword: '', role: 'crew' })
        setShowCreateForm(false)
        fetchAdminUsers()
      } else {
        setError(result.error || 'Failed to create admin user')
      }
    } catch (error) {
      console.error('Create user error:', error)
      setError('Failed to create admin user')
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const result = await updateAdminUserStatus(userId, !currentStatus)
      
      if (result.success) {
        setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
        fetchAdminUsers()
      } else {
        setError(result.error || 'Failed to update user status')
      }
    } catch (error) {
      console.error('Toggle user status error:', error)
      setError('Failed to update user status')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />
  }

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <DesignLock pageName="Admin Users" />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Admin Users" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-lays-dark-red" />
              <h1 className="text-xl font-bold text-gray-900">Admin Users</h1>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bbq-button-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Create New Admin User</h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="admin@bbqrestaurant.com"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Minimum 8 characters"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Confirm password"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'crew'})}
                    className="bbq-input w-full"
                    disabled={isCreating}
                  >
                    <option value="crew">Crew</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bbq-button-primary flex-1"
                  >
                    {isCreating ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bbq-button-secondary flex-1"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Users ({adminUsers.length})</h2>
            
            {adminUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No admin users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {adminUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{user.email}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="capitalize">{user.role}</span>
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Created {formatDate(user.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleUserStatus(user.user_id, user.is_active)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          user.is_active 
                            ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="w-4 h-4 inline mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 inline mr-1" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
