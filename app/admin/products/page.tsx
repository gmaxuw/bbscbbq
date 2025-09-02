/**
 * 🔐 ADMIN PRODUCT MANAGEMENT PAGE 🛡️
 * 
 * This page provides comprehensive product management:
 * - View all products with images and details
 * - Add new products with image upload
 * - Edit existing products (name, price, commission)
 * - Enable/disable products
 * - Product performance analytics
 * - Bulk operations
 * 
 * ⚠️  WARNING: This is part of the admin dashboard system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /admin/products route
 * 🎯  PURPOSE: Complete menu item management for business operations
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Filter,
  Upload,
  Save,
  X,
  Package,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  Star
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: string
  is_available: boolean
  commission_rate: number
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

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'BBQ',
    commission_rate: '',
    images: [] as File[],
    is_available: true
  })

  useEffect(() => {
    checkAuth()
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, statusFilter])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }

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

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            image_url,
            display_order,
            is_primary,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isAvailable = statusFilter === 'active'
      filtered = filtered.filter(product => product.is_available === isAvailable)
    }

    setFilteredProducts(filtered)
  }

  const handleAddProduct = async () => {
    if (isSubmitting) return // Prevent double submission
    
    try {
      setIsSubmitting(true)
      console.log('🚀 Starting product creation...')
      
      // Set primary image URL if images are provided
      let imageUrl = null
      if (formData.images.length > 0) {
        // We'll set this after uploading the first image
        imageUrl = 'pending' // Placeholder
      }

      // Create product
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          category: formData.category,
          commission_rate: parseFloat(formData.commission_rate) || 0,
          image_url: imageUrl,
          is_available: formData.is_available
        }])
        .select()

      if (error) throw error

      const productId = data[0].id

      // Insert images into product_images table if any were uploaded
      if (formData.images.length > 0) {
        const imageUploads = formData.images.map(async (image, index) => {
          const fileExt = image.name.split('.').pop()
          const fileName = `${productId}_${index + 1}_${Date.now()}.${fileExt}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, image)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName)

          // Insert image record
          const { error: imageError } = await supabase
            .from('product_images')
            .insert([{
              product_id: productId,
              image_url: publicUrl,
              display_order: index + 1,
              is_primary: index === 0
            }])

          if (imageError) throw imageError

          return { publicUrl, isPrimary: index === 0 }
        })

        const uploadedImages = await Promise.all(imageUploads)
        
        // Update product with primary image URL
        const primaryImage = uploadedImages.find(img => img.isPrimary)
        if (primaryImage) {
          await supabase
            .from('products')
            .update({ image_url: primaryImage.publicUrl })
            .eq('id', productId)
        }
      }

      await loadProducts() // Reload to get the new images
      setShowAddModal(false)
      resetForm()
      
      console.log('✅ Product added successfully')
    } catch (error) {
      console.error('❌ Failed to add product:', error)
      alert('Failed to add product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = async () => {
    if (!selectedProduct || isSubmitting) return

    try {
      setIsSubmitting(true)
      console.log('🚀 Starting product update...')
      let imageUrl = selectedProduct.image_url

      // Upload new images if provided
      if (formData.images.length > 0) {
        const imageUploads = formData.images.map(async (image, index) => {
          const fileExt = image.name.split('.').pop()
          const fileName = `${selectedProduct.id}_${index + 1}_${Date.now()}.${fileExt}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, image)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName)

          // Insert image record
          const { error: imageError } = await supabase
            .from('product_images')
            .insert([{
              product_id: selectedProduct.id,
              image_url: publicUrl,
              display_order: index + 1,
              is_primary: index === 0
            }])

          if (imageError) throw imageError

          return { publicUrl, isPrimary: index === 0 }
        })

        const uploadedImages = await Promise.all(imageUploads)
        
        // Update primary image URL if new images were uploaded
        const primaryImage = uploadedImages.find(img => img.isPrimary)
        if (primaryImage) {
          imageUrl = primaryImage.publicUrl
        }
      }

      // Update product
      const { data, error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          category: formData.category,
          commission_rate: parseFloat(formData.commission_rate) || 0,
          image_url: imageUrl,
          is_available: formData.is_available,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProduct.id)
        .select()

      if (error) throw error

      console.log('Product update successful:', data[0])

      // Reload products to get the latest data including images
      await loadProducts()
      setShowEditModal(false)
      setSelectedProduct(null)
      resetForm()
      
      console.log('✅ Product updated successfully and data reloaded')
    } catch (error) {
      console.error('❌ Failed to update product:', error)
      alert('Failed to update product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    console.log('🔍 Starting delete process for product:', productId)
    
    if (!confirm('Are you sure you want to delete this product? This will permanently remove it and cannot be undone.')) {
      console.log('❌ User cancelled delete')
      return
    }

    try {
      console.log('🔍 Checking for orders...')
      // First check if product has any orders
      const { data: orderItems, error: checkError } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', productId)
        .limit(1)

      if (checkError) {
        console.error('❌ Error checking orders:', checkError)
        throw checkError
      }

      console.log('📊 Order check result:', orderItems)

      if (orderItems && orderItems.length > 0) {
        console.log('⚠️ Product has orders, offering to disable instead')
        // Product has orders - offer to disable instead
        const disable = confirm(
          'This product has been ordered by customers and cannot be deleted.\n\n' +
          'Would you like to disable it instead? (It will be hidden from customers but order history will be preserved)'
        )
        
        if (disable) {
          console.log('✅ User chose to disable product')
          // Disable the product instead of deleting
          const { error: updateError } = await supabase
            .from('products')
            .update({ is_available: false })
            .eq('id', productId)

          if (updateError) throw updateError
          
          await loadProducts()
          console.log('✅ Product disabled successfully')
          return
        } else {
          console.log('❌ User chose not to disable')
          return // User chose not to disable
        }
      }

      console.log('✅ No orders found, proceeding with deletion')
      // No orders - safe to delete
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      await loadProducts()
      console.log('✅ Product deleted successfully')
    } catch (error) {
      console.error('❌ Failed to delete product:', error)
      alert('Failed to delete product. Please try again or contact support.')
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ 
          is_available: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()

      if (error) throw error

      setProducts(products.map(product => 
        product.id === productId ? data[0] : product
      ))
      
      console.log(`Product ${!currentStatus ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Failed to toggle product status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'BBQ',
      commission_rate: '',
      images: [],
      is_available: true
    })
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '',
      category: product.category || 'BBQ',
      commission_rate: product.commission_rate ? product.commission_rate.toString() : '',
      images: [],
      is_available: product.is_available
    })
    setShowEditModal(true)
  }

  const handleDeleteImage = async (imageId: string, productId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      // Delete from database
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)

      if (error) throw error

      // Reload products to update the display
      await loadProducts()
      console.log('Image deleted successfully')
    } catch (error) {
      console.error('Failed to delete image:', error)
    }
  }

  const handleSetPrimaryImage = async (imageId: string, productId: string) => {
    try {
      // First, unset all primary images for this product
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId)

      // Then set the selected image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      if (error) throw error

      // Update the product's primary image_url
      const { data: imageData } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('id', imageId)
        .single()

      if (imageData) {
        await supabase
          .from('products')
          .update({ image_url: imageData.image_url })
          .eq('id', productId)
      }

      // Reload products to update the display
      await loadProducts()
      console.log('Primary image updated successfully')
    } catch (error) {
      console.error('Failed to set primary image:', error)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout 
        currentPage="products" 
        userName={user?.full_name || 'Admin'}
        pageTitle="Loading Products..."
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      currentPage="products" 
      userName={user?.full_name || 'Admin'}
      pageTitle="Product Management"
      pageDescription="Manage your menu items - add, edit, or disable products across all branches."
    >
      {/* Header Actions */}
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col lg:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
          >
            <option value="all">All Products</option>
            <option value="active">Available Only</option>
            <option value="inactive">Unavailable Only</option>
          </select>
        </div>

        {/* Add Product Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredProducts.length} of {products.length} products
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
                  product.is_available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">₱{product.price ? product.price.toLocaleString() : '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commission Rate:</span>
                  <span className="font-medium">{product.commission_rate ? product.commission_rate.toLocaleString() : '0'}%</span>
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

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(product)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => toggleProductStatus(product.id, product.is_available)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    product.is_available
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  title={product.is_available ? 'Make Unavailable' : 'Make Available'}
                >
                  {product.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {products.length === 0 ? 'No products found' : 'No products match your filters'}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Add New Product</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₱)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                    >
                      <option value="BBQ">BBQ</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Sides">Sides</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      placeholder="Product description"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images (up to 5 images)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setFormData({ ...formData, images: files })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  />
                  {formData.images.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">Selected images ({formData.images.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.images.map((file, index) => (
                          <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                            <span>{file.name}</span>
                            {index === 0 && <span className="text-lays-orange-gold">★</span>}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        First image will be set as primary
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="h-4 w-4 text-lays-orange-gold focus:ring-lays-orange-gold border-gray-300 rounded"
                  />
                  <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700">
                    Available (visible to customers)
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-lays-orange-gold hover:bg-lays-dark-red'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding Product...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Add Product</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Edit Product</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedProduct(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₱)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                    >
                      <option value="BBQ">BBQ</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Sides">Sides</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      placeholder="Product description"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images
                  </label>
                  
                  {/* Current Images Display */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Current images:</p>
                    {selectedProduct.product_images && selectedProduct.product_images.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.product_images.map((image, index) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.image_url}
                              alt={`${selectedProduct.name} ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                            {image.is_primary && (
                              <div className="absolute -top-1 -right-1 bg-lays-orange-gold text-white text-xs px-1 rounded-full">
                                ★
                              </div>
                            )}
                            
                            {/* Image Actions */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex gap-1">
                                {!image.is_primary && (
                                  <button
                                    onClick={() => handleSetPrimaryImage(image.id, selectedProduct.id)}
                                    className="bg-lays-orange-gold text-white p-1 rounded-full hover:bg-lays-dark-red transition-colors"
                                    title="Set as primary"
                                  >
                                    <Star className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteImage(image.id, selectedProduct.id)}
                                  className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                                  title="Delete image"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">
                        No images uploaded yet
                      </div>
                    )}
                  </div>

                  {/* Add New Images */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Add new images (up to 5 total):</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        setFormData({ ...formData, images: files })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                    />
                    {formData.images.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">New images to add:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.images.map((file, index) => (
                            <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {file.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="h-4 w-4 text-lays-orange-gold focus:ring-lays-orange-gold border-gray-300 rounded"
                  />
                  <label htmlFor="edit_is_available" className="ml-2 block text-sm text-gray-700">
                    Available (visible to customers)
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedProduct(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProduct}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-lays-orange-gold hover:bg-lays-dark-red'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating Product...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Product</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
