'use client'

import { useState, useEffect } from 'react'
import { MapPin, Phone, Clock, Star, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  manager_name: string
  is_active: boolean
  hours?: string
  rating?: number
  features: string[]
  image?: string
}

export default function BranchLocations() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, address, phone, manager_name, is_active')
        .eq('is_active', true)
        .order('created_at')

      if (error) {
        console.error('Error loading branches:', error)
        setError('Failed to load branch locations')
        return
      }

      // Add default features and images for each branch
      const branchesWithDefaults = (data || []).map((branch, index) => ({
        ...branch,
        hours: '10:00 AM - 10:00 PM',
        rating: 4.5 + (index * 0.1), // Vary ratings slightly
        features: getBranchFeatures(branch.name),
        image: getBranchImage(branch.name, index)
      }))

      setBranches(branchesWithDefaults)
    } catch (err) {
      console.error('Error loading branches:', err)
      setError('Failed to load branch locations')
    } finally {
      setLoading(false)
    }
  }

  const getBranchFeatures = (branchName: string): string[] => {
    const name = branchName.toLowerCase()
    if (name.includes('siargao')) {
      return ['Beach View', 'Tourist Friendly', 'Takeout', 'Delivery']
    } else if (name.includes('highway')) {
      return ['Highway Access', 'Takeout', 'Drive-thru', 'Parking Available']
    } else if (name.includes('main') || name.includes('borromeo')) {
      return ['Parking Available', 'Dine-in', 'Takeout', 'Delivery']
    } else {
      return ['Takeout', 'Delivery', 'Dine-in']
    }
  }

  const getBranchImage = (branchName: string, index: number): string => {
    const name = branchName.toLowerCase()
    if (name.includes('siargao')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center'
    } else if (name.includes('highway')) {
      return 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop&crop=center'
    } else if (name.includes('main') || name.includes('borromeo')) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center'
    } else {
      return 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop&crop=center'
    }
  }
  return (
    <section className="bbq-section bg-white">
      <div className="bbq-container">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-lays-dark-red/10 text-lays-dark-red rounded-full px-4 py-2 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="font-medium text-sm">Our Locations</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bbq-display font-bold text-gray-900 mb-6">
            Find Us Near You
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {loading ? (
              'Loading our branch locations...'
            ) : (
              `With ${branches.length} convenient locations across Surigao and Siargao, 
              we're never too far from serving you the best BBQ in town.`
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-lays-dark-red" />
              <span className="text-gray-600">Loading branch locations...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={loadBranches}
                className="bbq-button-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Branch Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {branches.map((branch, index) => (
            <div 
              key={branch.id} 
              className="bbq-card group hover:shadow-2xl transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden rounded-t-2xl">
                <div 
                  className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${branch.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-lays-dark-red font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{branch.rating}</span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-lays-dark-red transition-colors duration-200">
                  {branch.name}
                </h3>

                <div className="flex items-start space-x-2 mb-3">
                  <MapPin className="w-5 h-5 text-lays-dark-red mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {branch.address}
                  </p>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <Phone className="w-5 h-5 text-lays-dark-red" />
                  <span className="text-gray-600 text-sm">{branch.phone}</span>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="w-5 h-5 text-lays-dark-red" />
                  <span className="text-gray-600 text-sm">{branch.hours}</span>
                </div>

                {branch.manager_name && (
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-5 h-5 bg-lays-orange-gold rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">M</span>
                    </div>
                    <span className="text-gray-600 text-sm">
                      Manager: {branch.manager_name}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {branch.features.map((feature, featureIndex) => (
                    <span 
                      key={featureIndex}
                      className="text-xs bg-lays-dark-red/10 text-lays-dark-red px-2 py-1 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <button className="w-full bg-lays-dark-red hover:bg-lays-bright-red text-white font-semibold py-2 rounded-lg transition-colors duration-200">
                  Order from This Branch
                </button>
              </div>
            </div>
            ))}
          </div>
        )}

        <div className="text-center mt-16 animate-fade-in">
          <p className="text-gray-600 mb-6">
            Can't decide which branch to visit? Check out our interactive map!
          </p>
          <button className="bbq-button-secondary text-lg px-8 py-4">
            View Interactive Map
          </button>
        </div>
      </div>
    </section>
  )
}
