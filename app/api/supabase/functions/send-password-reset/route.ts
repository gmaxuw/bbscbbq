import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json()
    
    if (!email || !redirectTo) {
      return NextResponse.json(
        { success: false, error: 'Email and redirectTo are required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get Supabase project URL and service key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prqfpxrtopguvelmflhk.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    
    if (!supabaseServiceKey) {
      console.error('Missing Supabase service key configuration')
      return NextResponse.json(
        { success: false, error: 'Supabase service key not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Direct Supabase call for password reset
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    })

    if (error) {
      console.error('Supabase password reset error:', error)
      
      // Handle specific error types
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        return NextResponse.json(
          { success: false, error: 'Too many password reset requests. Please wait 5 minutes before trying again.' },
          { status: 429 }
        )
      } else if (error.message.includes('Invalid email')) {
        return NextResponse.json(
          { success: false, error: 'Invalid email address' },
          { status: 400 }
        )
      } else if (error.message.includes('User not found')) {
        return NextResponse.json(
          { success: false, error: 'No account found with this email address' },
          { status: 404 }
        )
      } else {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    }

    console.log('✅ Password reset email sent successfully to:', email)
    return NextResponse.json(
      { success: true, message: 'Password reset email sent successfully' },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
