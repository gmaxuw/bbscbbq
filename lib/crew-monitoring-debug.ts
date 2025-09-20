// Debug utilities for crew monitoring
import { supabase } from './supabase';

export const debugCrewMonitoring = {
  // Check if user is crew member
  async checkUserRole() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user');
        return false;
      }

      console.log('✅ User authenticated:', user.id, user.email);

      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('role, is_active, name, branch_id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Error checking user role:', error);
        return false;
      }

      if (!adminUser) {
        console.log('❌ User not found in admin_users table');
        return false;
      }

      console.log('✅ User role:', adminUser.role, 'Active:', adminUser.is_active);
      return adminUser.role === 'crew' || adminUser.role === 'admin';
    } catch (error) {
      console.error('❌ Error in checkUserRole:', error);
      return false;
    }
  },

  // Test crew monitoring functions
  async testCrewFunctions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user for testing');
        return;
      }

      console.log('🧪 Testing crew monitoring functions...');

      // Test start_crew_session
      const { data: startData, error: startError } = await supabase.rpc('start_crew_session', {
        p_user_id: user.id,
        p_ip_address: '127.0.0.1',
        p_user_agent: 'Debug Test'
      });

      if (startError) {
        console.error('❌ start_crew_session failed:', startError);
      } else {
        console.log('✅ start_crew_session success:', startData);
      }

      // Test update_crew_activity
      const { error: activityError } = await supabase.rpc('update_crew_activity', {
        p_user_id: user.id,
        p_activity_type: 'heartbeat',
        p_activity_data: { test: true },
        p_current_page: '/admin'
      });

      if (activityError) {
        console.error('❌ update_crew_activity failed:', activityError);
      } else {
        console.log('✅ update_crew_activity success');
      }

      // Test get_crew_online_status
      const { data: statusData, error: statusError } = await supabase.rpc('get_crew_online_status');

      if (statusError) {
        console.error('❌ get_crew_online_status failed:', statusError);
      } else {
        console.log('✅ get_crew_online_status success:', statusData);
      }

      // Test end_crew_session
      const { error: endError } = await supabase.rpc('end_crew_session', {
        p_user_id: user.id
      });

      if (endError) {
        console.error('❌ end_crew_session failed:', endError);
      } else {
        console.log('✅ end_crew_session success');
      }

    } catch (error) {
      console.error('❌ Error in testCrewFunctions:', error);
    }
  },

  // Check database permissions
  async checkPermissions() {
    try {
      console.log('🔍 Checking database permissions...');

      // Test basic table access
      const { data: sessions, error: sessionsError } = await supabase
        .from('crew_sessions')
        .select('*')
        .limit(1);

      if (sessionsError) {
        console.error('❌ Cannot access crew_sessions:', sessionsError);
      } else {
        console.log('✅ Can access crew_sessions');
      }

      const { data: logs, error: logsError } = await supabase
        .from('crew_activity_logs')
        .select('*')
        .limit(1);

      if (logsError) {
        console.error('❌ Cannot access crew_activity_logs:', logsError);
      } else {
        console.log('✅ Can access crew_activity_logs');
      }

      const { data: status, error: statusError } = await supabase
        .from('crew_online_status')
        .select('*')
        .limit(1);

      if (statusError) {
        console.error('❌ Cannot access crew_online_status:', statusError);
      } else {
        console.log('✅ Can access crew_online_status');
      }

    } catch (error) {
      console.error('❌ Error checking permissions:', error);
    }
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugCrewMonitoring = debugCrewMonitoring;
}
