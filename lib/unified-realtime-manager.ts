import { createClient } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UnifiedCrewStatus {
  user_id: string;
  name: string;
  email: string;
  branch_name: string;
  is_online: boolean;
  last_seen: string;
  session_duration: string;
  current_page: string;
}

export interface UnifiedCrewSession {
  id: string;
  user_id: string;
  name: string;
  email: string;
  branch_name: string;
  session_start: string;
  last_activity: string;
  is_active: boolean;
  session_duration: string;
}

export interface UnifiedCrewActivity {
  id: string;
  user_id: string;
  name: string;
  email: string;
  branch_name: string;
  activity_type: string;
  activity_data?: any;
  created_at: string;
}

export interface UnifiedOrderUpdate {
  id: string;
  status: string;
  branch_id: string;
  customer_name?: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface UnifiedNotification {
  id: string;
  type: 'crew_status' | 'crew_activity' | 'crew_session' | 'order_update' | 'system';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  is_read: boolean;
}

class UnifiedRealtimeManager {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Event callbacks
  private onCrewStatusUpdate?: (status: UnifiedCrewStatus[]) => void;
  private onCrewSessionUpdate?: (sessions: UnifiedCrewSession[]) => void;
  private onCrewActivityUpdate?: (activities: UnifiedCrewActivity[]) => void;
  private onOrderUpdate?: (orders: UnifiedOrderUpdate[]) => void;
  private onNotification?: (notification: UnifiedNotification) => void;
  private onConnectionChange?: (connected: boolean) => void;

  constructor() {
    this.setupHeartbeat();
    this.setupCleanup();
  }

  /**
   * Initialize the unified real-time connection
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initializing UnifiedRealtimeManager...');
      
      // Clean up existing connection
      await this.disconnect();

      // Create single channel for all crew monitoring
      this.channel = this.supabase
        .channel('unified-crew-monitoring')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'crew_online_status'
          },
          this.handleCrewStatusChange.bind(this)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'crew_sessions'
          },
          this.handleCrewSessionChange.bind(this)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'crew_activity_logs'
          },
          this.handleCrewActivityChange.bind(this)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          this.handleOrderChange.bind(this)
        )
        .subscribe((status) => {
          this.isConnected = status === 'SUBSCRIBED';
          this.reconnectAttempts = 0;
          this.onConnectionChange?.(this.isConnected);
          
          if (this.isConnected) {
            console.log('✅ UnifiedRealtimeManager connected');
            this.refreshAllData();
          } else {
            console.log('❌ UnifiedRealtimeManager disconnected');
          }
        });

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize UnifiedRealtimeManager:', error);
      this.handleReconnect();
      return false;
    }
  }

  /**
   * Disconnect from real-time updates
   */
  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.isConnected = false;
    this.onConnectionChange?.(false);
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onCrewStatusUpdate?: (status: UnifiedCrewStatus[]) => void;
    onCrewSessionUpdate?: (sessions: UnifiedCrewSession[]) => void;
    onCrewActivityUpdate?: (activities: UnifiedCrewActivity[]) => void;
    onOrderUpdate?: (orders: UnifiedOrderUpdate[]) => void;
    onNotification?: (notification: UnifiedNotification) => void;
    onConnectionChange?: (connected: boolean) => void;
  }): void {
    this.onCrewStatusUpdate = callbacks.onCrewStatusUpdate;
    this.onCrewSessionUpdate = callbacks.onCrewSessionUpdate;
    this.onCrewActivityUpdate = callbacks.onCrewActivityUpdate;
    this.onOrderUpdate = callbacks.onOrderUpdate;
    this.onNotification = callbacks.onNotification;
    this.onConnectionChange = callbacks.onConnectionChange;
  }

  /**
   * Get current crew online status
   */
  async getCrewStatus(): Promise<UnifiedCrewStatus[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_crew_online_status');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching crew status:', error);
      return [];
    }
  }

  /**
   * Get crew session history
   */
  async getCrewSessions(limit = 50): Promise<UnifiedCrewSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('crew_sessions')
        .select(`
          *,
          admin_users!inner(name, email),
          branches!inner(name)
        `)
        .order('session_start', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(session => ({
        id: session.id,
        user_id: session.user_id,
        name: session.admin_users?.name || 'Unknown',
        email: session.admin_users?.email || 'Unknown',
        branch_name: session.branches?.name || 'Unknown',
        session_start: session.session_start,
        last_activity: session.last_activity,
        is_active: session.is_active,
        session_duration: session.is_active 
          ? this.calculateDuration(session.session_start, new Date().toISOString())
          : this.calculateDuration(session.session_start, session.last_activity)
      }));
    } catch (error) {
      console.error('❌ Error fetching crew sessions:', error);
      return [];
    }
  }

  /**
   * Get crew activity logs
   */
  async getCrewActivities(limit = 100): Promise<UnifiedCrewActivity[]> {
    try {
      const { data, error } = await this.supabase
        .from('crew_activity_logs')
        .select(`
          *,
          admin_users!inner(name, email),
          branches!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(activity => ({
        id: activity.id,
        user_id: activity.user_id,
        name: activity.admin_users?.name || 'Unknown',
        email: activity.admin_users?.email || 'Unknown',
        branch_name: activity.branches?.name || 'Unknown',
        activity_type: activity.activity_type,
        activity_data: activity.activity_data,
        created_at: activity.created_at
      }));
    } catch (error) {
      console.error('❌ Error fetching crew activities:', error);
      return [];
    }
  }

  /**
   * Start crew session
   */
  async startCrewSession(ipAddress?: string, userAgent?: string): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await this.supabase.rpc('start_crew_session', {
        p_user_id: user.id,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error starting crew session:', error);
      return null;
    }
  }

  /**
   * End crew session
   */
  async endCrewSession(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return false;

      const { error } = await this.supabase.rpc('end_crew_session', {
        p_user_id: user.id
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error ending crew session:', error);
      return false;
    }
  }

  /**
   * Update crew activity
   */
  async updateCrewActivity(
    activityType: string,
    activityData?: any,
    currentPage?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return false;

      const { error } = await this.supabase.rpc('update_crew_activity', {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_activity_data: activityData,
        p_current_page: currentPage
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error updating crew activity:', error);
      return false;
    }
  }

  /**
   * Refresh all data
   */
  async refreshAllData(): Promise<void> {
    try {
      const [crewStatus, crewSessions, crewActivities] = await Promise.all([
        this.getCrewStatus(),
        this.getCrewSessions(),
        this.getCrewActivities()
      ]);

      this.onCrewStatusUpdate?.(crewStatus);
      this.onCrewSessionUpdate?.(crewSessions);
      this.onCrewActivityUpdate?.(crewActivities);
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    }
  }

  /**
   * Handle crew status changes
   */
  private async handleCrewStatusChange(payload: any): Promise<void> {
    console.log('🔄 Crew status changed:', payload);
    const crewStatus = await this.getCrewStatus();
    this.onCrewStatusUpdate?.(crewStatus);
    
    this.createNotification({
      type: 'crew_status',
      title: 'Crew Status Update',
      message: 'Crew online status has been updated',
      data: payload
    });
  }

  /**
   * Handle crew session changes
   */
  private async handleCrewSessionChange(payload: any): Promise<void> {
    console.log('🔄 Crew session changed:', payload);
    const crewSessions = await this.getCrewSessions();
    this.onCrewSessionUpdate?.(crewSessions);
    
    this.createNotification({
      type: 'crew_session',
      title: 'Crew Session Update',
      message: 'Crew session has been updated',
      data: payload
    });
  }

  /**
   * Handle crew activity changes
   */
  private async handleCrewActivityChange(payload: any): Promise<void> {
    console.log('🔄 Crew activity changed:', payload);
    const crewActivities = await this.getCrewActivities();
    this.onCrewActivityUpdate?.(crewActivities);
    
    this.createNotification({
      type: 'crew_activity',
      title: 'Crew Activity Update',
      message: 'New crew activity detected',
      data: payload
    });
  }

  /**
   * Handle order changes
   */
  private async handleOrderChange(payload: any): Promise<void> {
    console.log('🔄 Order changed:', payload);
    
    this.createNotification({
      type: 'order_update',
      title: 'Order Update',
      message: 'Order status has been updated',
      data: payload
    });
  }

  /**
   * Create notification
   */
  private createNotification(notification: Omit<UnifiedNotification, 'id' | 'timestamp' | 'is_read'>): void {
    const fullNotification: UnifiedNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      is_read: false
    };
    
    this.onNotification?.(fullNotification);
  }

  /**
   * Setup heartbeat for connection monitoring
   */
  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.updateCrewActivity('heartbeat', { timestamp: new Date().toISOString() });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Setup cleanup for stale sessions
   */
  private setupCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.supabase.rpc('cleanup_stale_crew_sessions');
      } catch (error) {
        console.error('❌ Error cleaning up stale sessions:', error);
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initialize();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  /**
   * Calculate duration between two timestamps
   */
  private calculateDuration(start: string, end: string): string {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const unifiedRealtimeManager = new UnifiedRealtimeManager();
export default unifiedRealtimeManager;
