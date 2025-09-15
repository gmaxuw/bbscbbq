import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { user_id, email, name, branch_id } = await request.json()

    if (!user_id || !email || !name || !branch_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Insert crew user using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{
        user_id,
        email: email.toLowerCase().trim(),
        name,
        role: 'crew',
        branch_id,
        is_active: false // Pending admin approval
      }])
      .select()

    if (error) {
      console.error('Crew user creation error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Crew user creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
