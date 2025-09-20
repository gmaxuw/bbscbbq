import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const supabase = createClient()
    
    // End the crew session
    const { error } = await supabase.rpc('end_crew_session', {
      p_session_id: sessionId
    })

    if (error) {
      console.error('Error ending crew session via API:', error)
      return NextResponse.json({ error: 'Failed to end session' }, { status: 500 })
    }

    console.log('✅ Crew session ended via API:', sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in end-session API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
