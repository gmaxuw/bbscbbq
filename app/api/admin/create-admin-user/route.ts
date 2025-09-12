import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { user_id, email, name, role, is_active } = await request.json()

    // Validate required fields
    if (!user_id || !email || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, email, name, role' },
        { status: 400 }
      )
    }

    // Create server client with service role
    const supabase = createServerClient()

    // Insert admin user record
    const { error } = await supabase
      .from('admin_users')
      .insert([{
        user_id,
        email: email.toLowerCase().trim(),
        name,
        role,
        is_active: is_active ?? true
      }])

    if (error) {
      console.error('❌ Server-side admin user creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create admin user: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ Admin user created successfully:', { email, name, role })
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Admin user creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
