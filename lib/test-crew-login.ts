// Test crew login functionality
import { createClient } from './supabase';

export const testCrewLogin = {
  // Test crew login with different accounts
  async testCrewLogin(email: string, password: string = 'temp123456') {
    try {
      console.log(`🧪 Testing crew login for: ${email}`);
      
      const supabase = createClient();
      
      // Try to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error(`❌ Auth failed for ${email}:`, authError.message);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        console.error(`❌ No user data for ${email}`);
        return { success: false, error: 'No user data' };
      }

      console.log(`✅ Auth successful for ${email}:`, authData.user.id);

      // Check if user is a crew member
      const { data: crewUser, error: crewError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('role', 'crew')
        .eq('is_active', true)
        .single();

      if (crewError || !crewUser) {
        console.error(`❌ Not a crew member: ${email}`, crewError);
        await supabase.auth.signOut();
        return { success: false, error: 'Not a crew member' };
      }

      console.log(`✅ Crew member verified: ${crewUser.name}`);
      
      // Sign out
      await supabase.auth.signOut();
      
      return { success: true, crewUser };
    } catch (error) {
      console.error(`❌ Error testing crew login for ${email}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Test all crew members
  async testAllCrewMembers() {
    const crewEmails = [
      'jniervg@gmail.com',
      'minbsfa@gmail.com', 
      'goldenmentorssurigao@gmail.com',
      'direaldummy@gmail.com'
    ];

    console.log('🧪 Testing all crew member logins...');
    
    const results = [];
    for (const email of crewEmails) {
      const result = await this.testCrewLogin(email);
      results.push({ email, ...result });
    }

    console.log('📊 Crew login test results:', results);
    return results;
  },

  // Reset crew member password
  async resetCrewPassword(email: string, newPassword: string = 'temp123456') {
    try {
      console.log(`🔄 Resetting password for: ${email}`);
      
      const supabase = createClient();
      
      // Get all users and find by email
      const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError || !usersData.users) {
        console.error(`❌ Error fetching users:`, userError);
        return { success: false, error: 'Failed to fetch users' };
      }
      
      const user = usersData.users.find(u => u.email === email);
      
      if (!user) {
        console.error(`❌ User not found: ${email}`);
        return { success: false, error: 'User not found' };
      }

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error(`❌ Password update failed for ${email}:`, updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`✅ Password reset for ${email}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error resetting password for ${email}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testCrewLogin = testCrewLogin;
}
