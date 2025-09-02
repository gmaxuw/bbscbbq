'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Save, Eye, RefreshCw, Image, Type, Settings, Star, MapPin, Clock, ShoppingCart } from 'lucide-react'

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

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<HeroSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'content' | 'images' | 'features' | 'preview'>('content')

  useEffect(() => {
    fetchSettings()
  }, [])

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
              { id: 'content', label: 'Content', icon: Type },
              { id: 'images', label: 'Images', icon: Image },
              { id: 'features', label: 'Features', icon: Star },
              { id: 'preview', label: 'Preview', icon: Eye }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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

        {/* Content Tab */}
        {activeTab === 'content' && (
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
      </div>
    </div>
  )
}
