import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { user_id, email, name } = await request.json()

    if (!user_id || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient()

    // Insert admin user record
    const { error } = await supabase
      .from('admin_users')
      .insert([{
        user_id,
        email: email.toLowerCase().trim(),
        name,
        role: 'admin',
        is_active: true
      }])

    if (error) {
      console.error('Admin user creation error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin user creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}