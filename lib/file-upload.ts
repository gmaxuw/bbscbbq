import { createClient } from '@/lib/supabase'

export interface UploadProgress {
  progress: number
  status: 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

export const uploadPaymentScreenshot = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadProgress> => {
  // Create a completely fresh Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    const errorResult = { 
      progress: 100, 
      status: 'error' as const, 
      error: 'Supabase configuration missing' 
    }
    onProgress?.(errorResult)
    return errorResult
  }
  
  const supabase = createClient()
  
  try {
    onProgress?.({ progress: 0, status: 'uploading' })
    
    // Get user info for filename
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || 'anonymous'
    
    console.log('📸 Starting payment screenshot upload for user:', userId)
    
    const fileExt = file.name.split('.').pop()
    const fileName = `payment-${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    console.log('📸 Uploading file:', fileName)
    
    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
      const errorResult = { 
        progress: 100, 
        status: 'error' as const, 
        error: uploadError.message 
      }
      onProgress?.(errorResult)
      return errorResult
    }

    console.log('✅ Upload successful, getting public URL...')
    onProgress?.({ progress: 90, status: 'uploading' })

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(fileName)

    const successResult = {
      progress: 100,
      status: 'success' as const,
      url: urlData.publicUrl
    }
    
    onProgress?.(successResult)
    console.log('🔗 Screenshot URL:', urlData.publicUrl)
    
    return successResult
  } catch (error) {
    console.error('❌ Upload error:', error)
    const errorResult = { 
      progress: 100, 
      status: 'error' as const, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
    onProgress?.(errorResult)
    return errorResult
  }
}
