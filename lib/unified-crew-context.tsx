'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'

// Types for crew monitoring
export interface CrewOnlineStatus {
  user_id: string
  name: string
  email: string
  branch_name: string
  is_online: boolean
  last_seen: string
  session_duration: string
  current_page: string
}

export interface CrewSession {
  id: string
  user_id: string
  admin_user_id: string
  branch_id: string
  session_start: string
  last_activity: string
  is_active: boolean
  ip_address?: string
  user_agent?: string
  admin_users?: {
    name: string
    email: string
  }
  branches?: {
    name: string
  }
}

export interface CrewActivityLog {
  id: string
  user_id: string
  admin_user_id: string
  branch_id: string
  activity_type: 'login' | 'logout' | 'heartbeat' | 'page_view' | 'action'
  activity_data?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  admin_users?: {
    name: string
    email: string
  }
  branches?: {
    name: string
  }
}

export interface CrewWorkHoursSummary {
  user_id: string
  name: string
  email: string
  branch_name: string
  total_hours: number
  total_sessions: number
  avg_session_duration: string
}

export interface Branch {
  id: string
  name: string
}

interface UnifiedCrewContextType {
  onlineCrews: CrewOnlineStatus[]
  sessionHistory: CrewSession[]
  activityLogs: CrewActivityLog[]
  workHoursSummary: CrewWorkHoursSummary[]
  branches: Branch[]
  selectedBranch: string
  setSelectedBranch: (branchId: string) => void
  isLoading: boolean
  realtimeStatus: string
  refreshData: () => Promise<void>
  startCrewSession: (ipAddress?: string, userAgent?: string) => Promise<void>
  endCrewSession: () => Promise<void>
  updateCrewActivity: (activityType: string, activityData?: any, currentPage?: string) => Promise<void>
}

const UnifiedCrewContext = createContext<UnifiedCrewContextType | undefined>(undefined)

export const UnifiedCrewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = createClient()
  const realtimeManager = useRef<any>(null)

  const [onlineCrews, setOnlineCrews] = useState<CrewOnlineStatus[]>([])
  const [sessionHistory, setSessionHistory] = useState<CrewSession[]>([])
  const [activityLogs, setActivityLogs] = useState<CrewActivityLog[]>([])
  const [workHoursSummary, setWorkHoursSummary] = useState<CrewWorkHoursSummary[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState<string>('DISCONNECTED')

  // --- Data Fetching Functions ---
  const fetchOnlineCrews = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_crew_online_status')
    if (error) console.error('Error fetching online crews:', error)
    else setOnlineCrews(data || [])
  }, [supabase])

  const fetchSessionHistory = useCallback(async () => {
    const { data, error } = await supabase.from('crew_sessions')
      .select(`*, admin_users!inner(name, email), branches!inner(name)`)
      .order('session_start', { ascending: false })
      .limit(50)
    if (error) console.error('Error fetching session history:', error)
    else setSessionHistory(data || [])
  }, [supabase])

  const fetchActivityLogs = useCallback(async () => {
    const { data, error } = await supabase.from('crew_activity_logs')
      .select(`*, admin_users!inner(name, email), branches!inner(name)`)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) console.error('Error fetching activity logs:', error)
    else setActivityLogs(data || [])
  }, [supabase])

  const fetchWorkHoursSummary = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_crew_work_hours_summary')
    if (error) console.error('Error fetching work hours summary:', error)
    else setWorkHoursSummary(data || [])
  }, [supabase])

  const fetchBranches = useCallback(async () => {
    const { data, error } = await supabase.from('branches').select('id, name').eq('is_active', true)
    if (error) console.error('Error fetching branches:', error)
    else setBranches(data || [])
  }, [supabase])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([
      fetchOnlineCrews(),
      fetchSessionHistory(),
      fetchActivityLogs(),
      fetchWorkHoursSummary(),
      fetchBranches(),
    ])
    setIsLoading(false)
  }, [fetchOnlineCrews, fetchSessionHistory, fetchActivityLogs, fetchWorkHoursSummary, fetchBranches])

  // --- Session Management Functions ---
  const startCrewSession = useCallback(async (ipAddress?: string, userAgent?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return
    
    const { data, error } = await supabase.rpc('start_crew_session', {
      p_user_id: user.id,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    })
    if (error) console.error('Error starting crew session:', error)
    else console.log('Crew session started:', data)
    refreshData()
  }, [supabase, refreshData])

  const endCrewSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return
    
    const { data, error } = await supabase.rpc('end_crew_session', { p_user_id: user.id })
    if (error) console.error('Error ending crew session:', error)
    else console.log('Crew session ended:', data)
    refreshData()
  }, [supabase, refreshData])

  const updateCrewActivity = useCallback(async (activityType: string, activityData?: any, currentPage?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return
    
    const { data, error } = await supabase.rpc('update_crew_activity', {
      p_user_id: user.id,
      p_activity_type: activityType,
      p_activity_data: activityData,
      p_current_page: currentPage
    })
    if (error) console.error('Error updating crew activity:', error)
    else console.log('Crew activity updated:', activityType)
  }, [supabase])

  // --- Realtime Setup ---
  useEffect(() => {
    if (!supabase) return

    // Set up real-time subscriptions
    const channel = supabase
      .channel('unified_crew_monitoring')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_online_status' }, (payload) => {
        console.log('Crew online status update:', payload)
        fetchOnlineCrews()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_sessions' }, (payload) => {
        console.log('Crew session update:', payload)
        fetchSessionHistory()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_activity_logs' }, (payload) => {
        console.log('Crew activity update:', payload)
        fetchActivityLogs()
      })
      .subscribe((status) => {
        console.log('Realtime status:', status)
        setRealtimeStatus(status)
        if (status === 'SUBSCRIBED') {
          refreshData()
        }
      })

    realtimeManager.current = channel

    return () => {
      if (realtimeManager.current) {
        realtimeManager.current.unsubscribe()
      }
    }
  }, [supabase, fetchOnlineCrews, fetchSessionHistory, fetchActivityLogs, refreshData])

  // Initial data load
  useEffect(() => {
    refreshData()
  }, [refreshData])

  const value = {
    onlineCrews,
    sessionHistory,
    activityLogs,
    workHoursSummary,
    branches,
    selectedBranch,
    setSelectedBranch,
    isLoading,
    realtimeStatus,
    refreshData,
    startCrewSession,
    endCrewSession,
    updateCrewActivity,
  }

  return (
    <UnifiedCrewContext.Provider value={value}>
      {children}
    </UnifiedCrewContext.Provider>
  )
}

export const useUnifiedCrewMonitoring = () => {
  const context = useContext(UnifiedCrewContext)
  if (context === undefined) {
    throw new Error('useUnifiedCrewMonitoring must be used within a UnifiedCrewProvider')
  }
  return context
}
