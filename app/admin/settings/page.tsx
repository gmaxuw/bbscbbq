'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Save, Eye, RefreshCw, Image, Type, Settings, Star, MapPin, Clock, ShoppingCart, ArrowLeft, Plus, Edit, Trash2, Search, Users, Phone, Mail, EyeOff, DollarSign, User, ImageIcon, X, Upload, Package, DollarSign as DollarSignIcon, TrendingUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface HeroSettings {
  id: number
  title: string
  subtitle: string
  description: string
  badge_text: string
  button_text: string
  button_link: string
  show_badge: boolean
  show_features: boolean
  show_trust_indicators: boolean
  image_1_url: string | null
  image_2_url: string | null
  image_3_url: string | null
  feature_1_text: string
  feature_2_text: string
  feature_3_text: string
  trust_item_1_number: string
  trust_item_1_label: string
  trust_item_2_number: string
  trust_item_2_label: string
  trust_item_3_number: string
  trust_item_3_label: string
  created_at: string
  updated_at: string
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: string
  is_available: boolean
  is_active: boolean
  commission: number
  stock_quantity: number
  min_stock_level: number
  is_out_of_stock: boolean
  image_url?: string
  created_at: string
  updated_at: string
  product_images?: ProductImage[]
}

interface ProductImage {
  id: string
  product_id: string
  image_url: string
  display_order: number
  is_primary: boolean
  created_at: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<HeroSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'branches' | 'crew' | 'products' | 'promos' | 'images' | 'features' | 'preview'>('general')
  
  // Branch Management State
  const [branches, setBranches] = useState<any[]>([])
  const [filteredBranches, setFilteredBranches] = useState<any[]>([])
  const [branchSearchTerm, setBranchSearchTerm] = useState('')
  const [branchStatusFilter, setBranchStatusFilter] = useState('all')
  const [showAddBranchForm, setShowAddBranchForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState<any>(null)
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    operating_hours: '',
    is_active: true
  })

  // Product Management State
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [productStatusFilter, setProductStatusFilter] = useState('all')
  const [showAddProductForm, setShowAddProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'BBQ',
    commission: '',
    stock_quantity: '',
    min_stock_level: '5',
    images: [] as File[],
    is_available: true
  })

  // Branch Management Functions
  const filterBranches = () => {
    let filtered = branches

    if (branchSearchTerm) {
      filtered = filtered.filter(branch =>
        branch.name && branch.name.toLowerCase().includes(branchSearchTerm.toLowerCase())
      )
    }

    if (branchStatusFilter !== 'all') {
      const isActive = branchStatusFilter === 'active'
      filtered = filtered.filter(branch => branch.is_active === isActive)
    }

    setFilteredBranches(filtered)
  }

  useEffect(() => {
    fetchSettings()
    if (activeTab === 'branches') {
      loadBranches()
    }
    if (activeTab === 'products') {
      loadProducts()
    }
  }, [activeTab])

  // Product Management Functions
  const filterProducts = () => {
    let filtered = products

    if (productSearchTerm) {
      filtered = filtered.filter(product =>
        product.name && product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
      )
    }

    if (productStatusFilter !== 'all') {
      if (productStatusFilter === 'available') {
        filtered = filtered.filter(product => product.stock_quantity > 0 && product.is_active)
      } else if (productStatusFilter === 'out_of_stock') {
        filtered = filtered.filter(product => product.stock_quantity === 0)
      } else if (productStatusFilter === 'low_stock') {
        filtered = filtered.filter(product => product.stock_quantity > 0 && product.stock_quantity <= (product.min_stock_level || 5))
      }
    }

    setFilteredProducts(filtered)
  }

  useEffect(() => {
    filterBranches()
  }, [branches, branchSearchTerm, branchStatusFilter])

  useEffect(() => {
    filterProducts()
  }, [products, productSearchTerm, productStatusFilter])

  const fetchSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('hero_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) {
        console.error('Error fetching hero settings:', error)
        setMessage('Error loading settings')
        return
      }

      setSettings(data)
    } catch (error) {
      console.error('Error:', error)
      setMessage('Error loading settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    setMessage('')

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('hero_settings')
        .update(settings)
        .eq('id', 1)

      if (error) {
        console.error('Error saving settings:', error)
        setMessage('Error saving settings')
        return
      }

      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMessage('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof HeroSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
  }

  const resetToDefaults = () => {
    if (!settings) return
    
    setSettings({
      ...settings,
      title: 'Surigao City',
      subtitle: 'BBQ Stalls',
      description: 'Experience the authentic taste of slow-smoked BBQ perfection. Every bite tells a story of tradition, passion, and fire.',
      badge_text: '#1 BBQ Restaurant in Surigao',
      button_text: 'ORDER NOW',
      button_link: '/cart',
      show_badge: true,
      show_features: true,
      show_trust_indicators: true,
      feature_1_text: '2+ Hours Advance Order',
      feature_2_text: '4 Convenient Locations',
      feature_3_text: 'Premium Quality',
      trust_item_1_number: '15+',
      trust_item_1_label: 'Menu Items',
      trust_item_2_number: '4',
      trust_item_2_label: 'Branch Locations',
      trust_item_3_number: '100%',
      trust_item_3_label: 'Fresh & Local'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-lays-dark-red" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Settings not found</p>
        </div>
      </div>
    )
  }

  // Branch Management Functions
  const loadBranches = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Failed to load branches:', error)
    }
  }

  const openEditBranch = (branch: any) => {
    setEditingBranch(branch)
    setBranchFormData({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      operating_hours: branch.operating_hours || '',
      is_active: branch.is_active
    })
    setShowAddBranchForm(true)
  }

  const toggleBranchStatus = async (branchId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('branches')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', branchId)

      if (error) throw error
      await loadBranches()
    } catch (error) {
      console.error('Failed to toggle branch status:', error)
    }
  }

  // Product Management Functions
  const loadProducts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '0',
      category: product.category || 'BBQ',
      commission: product.commission ? product.commission.toString() : '0',
      stock_quantity: product.stock_quantity ? product.stock_quantity.toString() : '0',
      min_stock_level: product.min_stock_level ? product.min_stock_level.toString() : '5',
      images: [],
      is_available: product.is_available
    })
    setShowAddProductForm(true)
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error
      await loadProducts()
    } catch (error) {
      console.error('Failed to toggle product status:', error)
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = createClient()
      
      // Validate form data
      if (!productFormData.name.trim()) {
        setMessage('Product name is required')
        return
      }
      
      if (!productFormData.price || parseFloat(productFormData.price) < 0) {
        setMessage('Valid price is required')
        return
      }
      
      if (!productFormData.commission || parseFloat(productFormData.commission) < 0) {
        setMessage('Valid commission amount is required')
        return
      }
      
      if (!productFormData.stock_quantity || parseInt(productFormData.stock_quantity) < 0) {
        setMessage('Valid stock quantity is required')
        return
      }
      
      const productData = {
        name: productFormData.name.trim(),
        description: productFormData.description.trim(),
        price: parseFloat(productFormData.price),
        commission: parseFloat(productFormData.commission),
        category: productFormData.category,
        stock_quantity: parseInt(productFormData.stock_quantity),
        min_stock_level: parseInt(productFormData.min_stock_level) || 5,
        is_active: productFormData.is_available,
        is_out_of_stock: parseInt(productFormData.stock_quantity) === 0,
        updated_at: new Date().toISOString()
      }

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
        setMessage('Product updated successfully!')
        await loadProducts()
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()

        if (error) throw error
        setMessage('Product created successfully!')
        await loadProducts()
      }

      // Close modal and reset form
      setShowAddProductForm(false)
      setEditingProduct(null)
      setProductFormData({
        name: '',
        description: '',
        price: '0',
        category: 'BBQ',
        commission: '0',
        stock_quantity: '0',
        min_stock_level: '5',
        images: [],
        is_available: true
      })

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000)

    } catch (error) {
      console.error('Failed to save product:', error)
      setMessage('Error saving product. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Settings className="w-8 h-8 text-lays-dark-red" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hero Section Settings</h1>
                <p className="text-sm text-gray-500">Configure your homepage hero section content</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lays-dark-red flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white bg-lays-dark-red rounded-lg hover:bg-lays-bright-red focus:outline-none focus:ring-2 focus:ring-lays-dark-red disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
                    {[
          { id: 'general', label: 'General Settings', icon: Settings },
          { id: 'profile', label: 'Profile Settings', icon: User },
          { id: 'branches', label: 'Branch Management', icon: MapPin },
          { id: 'crew', label: 'Crew Management', icon: Star },
          { id: 'products', label: 'Product Management', icon: ShoppingCart },
          { id: 'promos', label: 'Promo Management', icon: Type },
          { id: 'images', label: 'Images', icon: Image },
          { id: 'features', label: 'Features', icon: Star },
          { id: 'preview', label: 'Preview', icon: Eye }
        ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'general' | 'profile' | 'branches' | 'crew' | 'products' | 'promos' | 'images' | 'features' | 'preview')}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-lays-dark-red text-lays-dark-red'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Main Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Title
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={settings.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={settings.badge_text}
                  onChange={(e) => handleInputChange('badge_text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Show Badge
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.show_badge}
                    onChange={(e) => handleInputChange('show_badge', e.target.checked)}
                    className="h-4 w-4 text-lays-dark-red focus:ring-lays-dark-red border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Display badge</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Hero Images</h2>
            <div className="space-y-6">
              {[
                { key: 'image_1_url', label: 'Image 1 URL', placeholder: 'https://images.unsplash.com/...' },
                { key: 'image_2_url', label: 'Image 2 URL', placeholder: 'https://images.unsplash.com/...' },
                { key: 'image_3_url', label: 'Image 3 URL', placeholder: 'https://images.unsplash.com/...' }
              ].map((image) => (
                <div key={image.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {image.label}
                  </label>
                                     <input
                     type="url"
                     value={(settings[image.key as keyof HeroSettings] as string) || ''}
                     onChange={(e) => handleInputChange(image.key as keyof HeroSettings, e.target.value)}
                     placeholder={image.placeholder}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                   />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use default fallback images
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            {/* Button Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Button Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={settings.button_text}
                    onChange={(e) => handleInputChange('button_text', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={settings.button_link}
                    onChange={(e) => handleInputChange('button_link', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                  />
                </div>
              </div>
            </div>

            {/* Feature Items */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Feature Items
              </h2>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={settings.show_features}
                  onChange={(e) => handleInputChange('show_features', e.target.checked)}
                  className="h-4 w-4 text-lays-dark-red focus:ring-lays-dark-red border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Show feature items</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { key: 'feature_1_text', label: 'Feature 1', icon: Clock },
                  { key: 'feature_2_text', label: 'Feature 2', icon: MapPin },
                  { key: 'feature_3_text', label: 'Feature 3', icon: Star }
                ].map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Icon className="w-4 h-4 mr-2" />
                        {feature.label}
                      </label>
                      <input
                        type="text"
                        value={settings[feature.key as keyof HeroSettings] as string}
                        onChange={(e) => handleInputChange(feature.key as keyof HeroSettings, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Trust Indicators</h2>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={settings.show_trust_indicators}
                  onChange={(e) => handleInputChange('show_trust_indicators', e.target.checked)}
                  className="h-4 w-4 text-lays-dark-red focus:ring-lays-dark-red border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Show trust indicators</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { numberKey: 'trust_item_1_number', labelKey: 'trust_item_1_label', label: 'Item 1' },
                  { numberKey: 'trust_item_2_number', labelKey: 'trust_item_2_label', label: 'Item 2' },
                  { numberKey: 'trust_item_3_number', labelKey: 'trust_item_3_label', label: 'Item 3' }
                ].map((item) => (
                  <div key={item.numberKey} className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {item.label}
                    </label>
                    <input
                      type="text"
                      value={settings[item.numberKey as keyof HeroSettings] as string}
                      onChange={(e) => handleInputChange(item.numberKey as keyof HeroSettings, e.target.value)}
                      placeholder="Number/Value"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                    />
                    <input
                      type="text"
                      value={settings[item.labelKey as keyof HeroSettings] as string}
                      onChange={(e) => handleInputChange(item.labelKey as keyof HeroSettings, e.target.value)}
                      placeholder="Label"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Preview</h2>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-center text-gray-600">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Hero Section Preview</p>
                <p className="text-sm">
                  Title: <span className="font-semibold">{settings.title}</span>
                </p>
                <p className="text-sm">
                  Subtitle: <span className="font-semibold">{settings.subtitle}</span>
                </p>
                <p className="text-sm">
                  Button: <span className="font-semibold">{settings.button_text}</span>
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  Full preview will be available after saving changes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Settings Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value="Gabriel Sacro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value="gabu.sacro@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value="Admin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    value="Main Branch"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                    disabled
                  />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lays-dark-red"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-lays-dark-red text-white rounded-lg hover:bg-red-800 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branch Management Tab */}
        {activeTab === 'branches' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Branch Management</h2>
              <button
                onClick={() => setShowAddBranchForm(true)}
                className="px-4 py-2 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Branch</span>
              </button>
            </div>
            
            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={branchSearchTerm}
                  onChange={(e) => setBranchSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent w-full"
                />
              </div>
              <select
                value={branchStatusFilter}
                onChange={(e) => setBranchStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
              >
                <option value="all">All Branches</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Branches List */}
            <div className="space-y-4">
              {filteredBranches.map((branch) => (
                <div key={branch.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          branch.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{branch.address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{branch.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{branch.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{branch.operating_hours}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{branch.crew_count || 0} crew</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ShoppingCart className="w-4 h-4" />
                          <span>{branch.order_count || 0} orders</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>₱{(branch.total_revenue || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => openEditBranch(branch)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => toggleBranchStatus(branch.id, branch.is_active)}
                        className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 ${
                          branch.is_active
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {branch.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span>{branch.is_active ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredBranches.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
                <p className="text-gray-500">Add your first branch to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Crew Management Tab */}
        {activeTab === 'crew' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Crew Management</h2>
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Crew Management</h3>
              <p className="text-gray-500 mb-4">Manage your staff members and crew</p>
              <p className="text-sm text-gray-400">This section will be implemented soon</p>
            </div>
          </div>
        )}

        {/* Product Management Tab */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
              <button
                onClick={() => setShowAddProductForm(true)}
                className="px-4 py-2 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Product Count Summary */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Products</p>
                    <p className="text-2xl font-bold text-blue-900">{products.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Available</p>
                    <p className="text-2xl font-bold text-green-900">
                      {products.filter(p => p.stock_quantity > 0 && p.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-900">
                      {products.filter(p => p.stock_quantity === 0).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-600">Low Stock</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.min_stock_level || 5)).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent w-full"
                />
              </div>
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
              >
                <option value="all">All Products</option>
                <option value="available">Available Only</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="low_stock">Low Stock</option>
              </select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Product Images Gallery */}
                  <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                    {product.product_images && product.product_images.length > 0 ? (
                      <div className="w-full h-full relative">
                        {/* Primary Image */}
                        <img
                          src={product.product_images.find(img => img.is_primary)?.image_url || product.product_images[0]?.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Image Count Badge */}
                        {product.product_images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                            +{product.product_images.length - 1} more
                          </div>
                        )}
                      </div>
                    ) : product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">No Image</p>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock_quantity > 0 && product.is_active
                          ? 'bg-green-100 text-green-800' 
                          : product.stock_quantity === 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.stock_quantity === 0 
                          ? 'Out of Stock' 
                          : product.stock_quantity <= (product.min_stock_level || 5)
                          ? 'Low Stock'
                          : 'Available'
                        }
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">₱{product.price ? product.price.toLocaleString() : '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commission:</span>
                        <span className="font-medium">₱{product.commission ? product.commission.toLocaleString() : '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-medium ${
                          product.stock_quantity === 0 
                            ? 'text-red-600' 
                            : product.stock_quantity <= (product.min_stock_level || 5)
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}>
                          {product.stock_quantity || 0} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{product.category || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-sm text-gray-500">
                          {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditProduct(product)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                        className={`flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 ${
                          product.is_active
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span>{product.is_active ? 'Disable' : 'Enable'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Add your first product to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Promo Management Tab */}
        {activeTab === 'promos' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Promo Management</h2>
            <div className="text-center py-12">
              <Type className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Promo Management</h3>
              <p className="text-gray-500 mb-4">Manage promotional codes and discounts</p>
              <p className="text-sm text-gray-400">This section will be implemented soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Add/Edit Modal */}
      {showAddProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddProductForm(false)
                    setEditingProduct(null)
                    setProductFormData({
                      name: '',
                      description: '',
                      price: '0',
                      category: 'BBQ',
                      commission: '0',
                      stock_quantity: '0',
                      min_stock_level: '5',
                      images: [],
                      is_available: true
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productFormData.name}
                      onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={productFormData.category}
                      onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                    >
                      <option value="BBQ">BBQ</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Sides">Sides</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₱) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.price || '0'}
                      onChange={(e) => setProductFormData({...productFormData, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission (₱) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.commission || '0'}
                      onChange={(e) => setProductFormData({...productFormData, commission: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter commission amount in pesos (e.g., 3.00 for ₱3.00)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productFormData.stock_quantity || '0'}
                      onChange={(e) => setProductFormData({...productFormData, stock_quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Stock Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productFormData.min_stock_level || '5'}
                      onChange={(e) => setProductFormData({...productFormData, min_stock_level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      placeholder="5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={productFormData.is_available}
                    onChange={(e) => setProductFormData({...productFormData, is_available: e.target.checked})}
                    className="w-4 h-4 text-lays-orange-gold border-gray-300 rounded focus:ring-lays-orange-gold"
                  />
                  <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
                    Available for sale
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProductForm(false)
                      setEditingProduct(null)
                      setProductFormData({
                        name: '',
                        description: '',
                        price: '0',
                        category: 'BBQ',
                        commission: '0',
                        stock_quantity: '0',
                        min_stock_level: '5',
                        images: [],
                        is_available: true
                      })
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
