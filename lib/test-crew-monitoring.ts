// Test utilities for crew monitoring
import { supabase } from './supabase';

export const testCrewMonitoring = {
  // Create a test crew session
  async createTestCrewSession() {
    try {
      console.log('🧪 Creating test crew session...');
      
      // First, let's see if we have any crew members
      const { data: crewMembers, error: crewError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('role', 'crew')
        .eq('is_active', true)
        .limit(1);

      if (crewError || !crewMembers || crewMembers.length === 0) {
        console.log('❌ No crew members found. Creating a test crew member...');
        
        // Create a test crew member
        const { data: testCrew, error: createError } = await supabase
          .from('admin_users')
          .insert({
            email: 'test-crew@example.com',
            name: 'Test Crew Member',
            role: 'crew',
            branch_id: null, // Will be set to first available branch
            is_active: true
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Failed to create test crew member:', createError);
          return null;
        }

        console.log('✅ Test crew member created:', testCrew);
        return testCrew;
      }

      console.log('✅ Found existing crew member:', crewMembers[0]);
      return crewMembers[0];
    } catch (error) {
      console.error('❌ Error creating test crew session:', error);
      return null;
    }
  },

  // Test the crew monitoring functions
  async testCrewMonitoringFunctions() {
    try {
      console.log('🧪 Testing crew monitoring functions...');
      
      // Test get_crew_online_status
      const { data: onlineStatus, error: statusError } = await supabase.rpc('get_crew_online_status');
      
      if (statusError) {
        console.error('❌ get_crew_online_status failed:', statusError);
      } else {
        console.log('✅ get_crew_online_status success:', onlineStatus);
      }

      // Test if we can insert into crew_online_status
      const { data: testStatus, error: insertError } = await supabase
        .from('crew_online_status')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          admin_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          branch_id: null,
          is_online: false,
          last_seen: new Date().toISOString(),
          session_duration: '0 minutes',
          current_page: '/test'
        })
        .select();

      if (insertError) {
        console.error('❌ Cannot insert into crew_online_status:', insertError);
      } else {
        console.log('✅ Can insert into crew_online_status');
        
        // Clean up test data
        await supabase
          .from('crew_online_status')
          .delete()
          .eq('user_id', '00000000-0000-0000-0000-000000000000');
      }

      return { onlineStatus, statusError };
    } catch (error) {
      console.error('❌ Error testing crew monitoring functions:', error);
      return { onlineStatus: null, statusError: error };
    }
  },

  // Check if crew monitoring tables exist and are accessible
  async checkCrewMonitoringTables() {
    try {
      console.log('🔍 Checking crew monitoring tables...');
      
      const tables = ['crew_sessions', 'crew_activity_logs', 'crew_online_status'];
      const results: Record<string, { accessible: boolean; error?: string; count: number }> = {};

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        results[table] = {
          accessible: !error,
          error: error?.message,
          count: data?.length || 0
        };

        console.log(`${table}: ${error ? '❌' : '✅'} ${error?.message || 'accessible'}`);
      }

      return results;
    } catch (error) {
      console.error('❌ Error checking crew monitoring tables:', error);
      return {};
    }
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testCrewMonitoring = testCrewMonitoring;
}
