'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, ArrowLeft, Edit3, Save, X, LogOut } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { createClient } from '@/lib/supabase'

export default function AdminProfilePage() {
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    role: '',
    is_active: false
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        router.push('/admin/login')
        return
      }

      // Get admin data from admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (adminError || !adminUser) {
        console.error('Error getting admin data:', adminError)
        router.push('/admin/login')
        return
      }

      setAdminData(adminUser)
      setEditData({
        name: adminUser.name || '',
        email: adminUser.email || ''
      })
    } catch (error) {
      console.error('Error fetching admin data:', error)
      router.push('/admin/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('User not found')
        return
      }

      // Update admin_users table
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({
          name: editData.name,
          email: editData.email
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating admin data:', updateError)
        alert('Error updating profile. Please try again.')
        return
      }

      // Update auth user email if it changed
      if (editData.email !== adminData.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: editData.email
        })

        if (authError) {
          console.error('Error updating auth email:', authError)
          alert('Profile updated but email change requires verification.')
        }
      }

      setAdminData(prev => ({
        ...prev,
        name: editData.name,
        email: editData.email
      }))
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error updating profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-lays-orange-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Admin Profile" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <User className="w-6 h-6 text-lays-dark-red" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 text-lays-dark-red hover:text-lays-bright-red transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-lays-dark-red text-white px-4 py-2 rounded-lg hover:bg-lays-bright-red transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditData({
                      name: adminData.name || '',
                      email: adminData.email || ''
                    })
                  }}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="bbq-input w-full"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-gray-900 font-medium">{adminData.name || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                  className="bbq-input w-full"
                  placeholder="Enter your email"
                />
              ) : (
                <p className="text-gray-900 font-medium">{adminData.email || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <p className="text-gray-900 font-medium capitalize">{adminData.role || 'Not set'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                adminData.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {adminData.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
