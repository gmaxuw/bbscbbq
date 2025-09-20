import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface CrewSession {
  id: string;
  user_id: string;
  admin_user_id: string;
  branch_id: string;
  session_start: string;
  last_activity: string;
  is_active: boolean;
  ip_address?: string;
  user_agent?: string;
  // Joined data from related tables
  admin_users?: {
    name: string;
    email: string;
  };
  branches?: {
    name: string;
  };
}

export interface CrewOnlineStatus {
  user_id: string;
  name: string;
  email: string;
  branch_name: string;
  is_online: boolean;
  last_seen: string;
  session_duration: string;
  current_page?: string;
}

export interface CrewActivityLog {
  id: string;
  user_id: string;
  admin_user_id: string;
  branch_id: string;
  activity_type: 'login' | 'logout' | 'heartbeat' | 'page_view' | 'action';
  activity_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Joined data from related tables
  admin_users?: {
    name: string;
    email: string;
  };
  branches?: {
    name: string;
  };
}

class CrewMonitoringService {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
  private currentSessionId: string | null = null;

  // Start a new crew session
  async startSession(ipAddress?: string, userAgent?: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found for crew session');
        return null;
      }

      // Check if user is a crew member or admin
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('role, is_active, id, branch_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminUser) {
        console.log('User is not a crew member or admin, skipping crew monitoring');
        return null;
      }

      if (adminUser.role !== 'crew' && adminUser.role !== 'admin') {
        console.log('User role is not crew or admin, skipping crew monitoring');
        return null;
      }

      // Check if there's already an active session
      if (this.currentSessionId) {
        console.log('Session already active, skipping new session creation');
        return this.currentSessionId;
      }

      console.log('Starting crew session for user:', user.id, 'Role:', adminUser.role);

      const { data, error } = await supabase.rpc('start_crew_session', {
        p_user_id: user.id,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) {
        console.error('Error starting crew session:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      console.log('Crew session started successfully:', data);
      this.currentSessionId = data;
      this.startHeartbeat();
      return data;
    } catch (error) {
      console.error('Error starting crew session:', error);
      return null;
    }
  }

  // End the current crew session
  async endSession(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found for ending crew session');
        return;
      }

      console.log('Ending crew session for user:', user.id);

      const { error } = await supabase.rpc('end_crew_session', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error ending crew session:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      } else {
        console.log('Crew session ended successfully');
      }

      this.stopHeartbeat();
      this.currentSessionId = null;
    } catch (error) {
      console.error('Error ending crew session:', error);
    }
  }

  // Update activity heartbeat
  async updateActivity(
    activityType: 'heartbeat' | 'page_view' | 'action' = 'heartbeat',
    activityData?: any,
    currentPage?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('update_crew_activity', {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_activity_data: activityData,
        p_current_page: currentPage
      });
    } catch (error) {
      console.error('Error updating crew activity:', error);
    }
  }

  // Start heartbeat system
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      this.updateActivity('heartbeat');
    }, this.HEARTBEAT_INTERVAL);
  }

  // Stop heartbeat system
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Track page view
  async trackPageView(page: string): Promise<void> {
    await this.updateActivity('page_view', { page }, page);
  }

  // Track specific action
  async trackAction(action: string, data?: any): Promise<void> {
    await this.updateActivity('action', { action, ...data });
  }

  // Get current crew online status
  async getCrewOnlineStatus(): Promise<CrewOnlineStatus[]> {
    try {
      const { data, error } = await supabase.rpc('get_crew_online_status');
      
      if (error) {
        console.error('Error getting crew online status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting crew online status:', error);
      return [];
    }
  }

  // Get crew session history
  async getCrewSessionHistory(
    userId?: string,
    branchId?: string,
    limit: number = 50
  ): Promise<CrewSession[]> {
    try {
      let query = supabase
        .from('crew_sessions')
        .select(`
          *,
          admin_users!inner(name, email),
          branches!inner(name)
        `)
        .order('session_start', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting crew session history:', error);
        return [];
      }

      // Remove duplicates based on user_id and session_start
      const uniqueSessions = (data || []).reduce((acc: CrewSession[], session: CrewSession) => {
        const exists = acc.find(s => 
          s.user_id === session.user_id && 
          s.session_start === session.session_start
        );
        if (!exists) {
          acc.push(session);
        }
        return acc;
      }, []);

      return uniqueSessions;
    } catch (error) {
      console.error('Error getting crew session history:', error);
      return [];
    }
  }

  // Get crew activity logs
  async getCrewActivityLogs(
    userId?: string,
    branchId?: string,
    activityType?: string,
    limit: number = 100
  ): Promise<CrewActivityLog[]> {
    try {
      let query = supabase
        .from('crew_activity_logs')
        .select(`
          *,
          admin_users!inner(name, email),
          branches!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      if (activityType) {
        query = query.eq('activity_type', activityType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting crew activity logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting crew activity logs:', error);
      return [];
    }
  }

  // Get crew work hours summary
  async getCrewWorkHoursSummary(
    startDate: string,
    endDate: string,
    branchId?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('crew_activity_logs')
        .select(`
          user_id,
          admin_users!inner(name, email),
          branches!inner(name),
          activity_type,
          created_at
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .in('activity_type', ['login', 'logout']);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting crew work hours summary:', error);
        return [];
      }

      // Process the data to calculate work hours
      const summary = this.processWorkHoursData(data || []);
      return summary;
    } catch (error) {
      console.error('Error getting crew work hours summary:', error);
      return [];
    }
  }

  // Process work hours data
  private processWorkHoursData(data: any[]): any[] {
    const crewMap = new Map();

    data.forEach(log => {
      const userId = log.user_id;
      if (!crewMap.has(userId)) {
        crewMap.set(userId, {
          user_id: userId,
          name: log.admin_users.name,
          email: log.admin_users.email,
          branch_name: log.branches.name,
          sessions: [],
          total_hours: 0
        });
      }

      const crew = crewMap.get(userId);
      if (log.activity_type === 'login') {
        crew.sessions.push({
          login_time: log.created_at,
          logout_time: null,
          duration: 0
        });
      } else if (log.activity_type === 'logout' && crew.sessions.length > 0) {
        const lastSession = crew.sessions[crew.sessions.length - 1];
        if (!lastSession.logout_time) {
          lastSession.logout_time = log.created_at;
          const loginTime = new Date(lastSession.login_time);
          const logoutTime = new Date(log.created_at);
          lastSession.duration = (logoutTime.getTime() - loginTime.getTime()) / (1000 * 60 * 60); // hours
          crew.total_hours += lastSession.duration;
        }
      }
    });

    return Array.from(crewMap.values());
  }

  // Clean up stale sessions (sessions that should have ended but didn't)
  async cleanupStaleSessions(): Promise<void> {
    try {
      console.log('🧹 Cleaning up stale crew sessions...');
      
      const { error } = await supabase.rpc('cleanup_stale_crew_sessions');
      
      if (error) {
        console.error('Error cleaning up stale sessions:', error);
      } else {
        console.log('✅ Stale crew sessions cleaned up');
      }
    } catch (error) {
      console.error('Error cleaning up stale sessions:', error);
    }
  }

  // Cleanup on page unload
  cleanup(): void {
    this.endSession();
  }
}

// Export singleton instance
export const crewMonitoring = new CrewMonitoringService();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    crewMonitoring.cleanup();
  });
}
