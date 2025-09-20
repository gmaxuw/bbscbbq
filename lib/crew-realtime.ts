import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { CrewOnlineStatus } from './crew-monitoring';

export interface RealtimeCrewUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
}

export class CrewRealtimeService {
  private channel: RealtimeChannel | null = null;
  private subscribers: Set<(update: RealtimeCrewUpdate) => void> = new Set();

  // Subscribe to real-time crew updates
  subscribeToCrewUpdates(
    onUpdate: (update: RealtimeCrewUpdate) => void,
    onError?: (error: Error) => void
  ): void {
    // Add subscriber
    this.subscribers.add(onUpdate);

    // Create channel if it doesn't exist
    if (!this.channel) {
      this.channel = supabase
        .channel('crew-monitoring')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'crew_online_status'
          },
          (payload) => {
            const update: RealtimeCrewUpdate = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'crew_online_status',
              record: payload.new,
              old_record: payload.old
            };

            // Notify all subscribers
            this.subscribers.forEach(subscriber => {
              try {
                subscriber(update);
              } catch (error) {
                console.error('Error in crew update subscriber:', error);
                onError?.(error as Error);
              }
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'crew_activity_logs'
          },
          (payload) => {
            const update: RealtimeCrewUpdate = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'crew_activity_logs',
              record: payload.new,
              old_record: payload.old
            };

            // Notify all subscribers
            this.subscribers.forEach(subscriber => {
              try {
                subscriber(update);
              } catch (error) {
                console.error('Error in crew activity subscriber:', error);
                onError?.(error as Error);
              }
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Crew monitoring real-time subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Crew monitoring real-time subscription error');
            onError?.(new Error('Failed to subscribe to crew updates'));
          }
        });
    }
  }

  // Unsubscribe from crew updates
  unsubscribeFromCrewUpdates(onUpdate: (update: RealtimeCrewUpdate) => void): void {
    this.subscribers.delete(onUpdate);

    // If no more subscribers, close the channel
    if (this.subscribers.size === 0 && this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  // Unsubscribe all
  unsubscribeAll(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.subscribers.clear();
  }

  // Get current online crew status
  async getCurrentOnlineCrew(): Promise<CrewOnlineStatus[]> {
    try {
      const { data, error } = await supabase.rpc('get_crew_online_status');
      
      if (error) {
        console.error('Error getting current online crew:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting current online crew:', error);
      return [];
    }
  }

  // Send notification to admins about crew activity
  async notifyCrewActivity(
    activityType: 'login' | 'logout' | 'status_change',
    crewName: string,
    branchName?: string,
    additionalData?: any
  ): Promise<void> {
    try {
      // This could be extended to send actual notifications
      // For now, we'll just log it
      console.log(`Crew Activity: ${crewName} ${activityType}${branchName ? ` at ${branchName}` : ''}`, additionalData);
      
      // You could integrate with a notification service here
      // e.g., send push notifications, emails, etc.
    } catch (error) {
      console.error('Error sending crew activity notification:', error);
    }
  }
}

// Export singleton instance
export const crewRealtime = new CrewRealtimeService();
