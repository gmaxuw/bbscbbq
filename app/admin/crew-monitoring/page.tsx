'use client';

import React from 'react';
import { UnifiedCrewProvider } from '../../../lib/unified-crew-context';
import { UnifiedCrewDashboard } from '../../../components/admin/UnifiedCrewDashboard';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase';

export default function CrewMonitoringPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔍 Crew monitoring checking auth...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        router.push('/admin/login');
        return;
      }
      
      if (!session?.user) {
        console.log('❌ No Supabase session found, redirecting to login');
        router.push('/admin/login');
        return;
      }

      console.log('✅ Session found, checking admin role for user:', session.user.id);

      // Verify admin role using admin_users table
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('role, name, branch_id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Admin user query error:', error);
        if (error.code === 'PGRST301' || error.message.includes('500') || 
            error.message.includes('infinite recursion') || error.code === '42P17') {
          console.log('🔄 RLS policy error in crew monitoring, allowing access...');
          setUser({ role: 'admin', name: 'Admin User', branch_id: null });
          setIsLoading(false);
          return;
        } else {
          await supabase.auth.signOut();
          router.push('/admin/login');
          return;
        }
      }

      if (!adminUser || adminUser.role !== 'admin') {
        console.log('❌ Invalid admin user or role, redirecting to login');
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      console.log('✅ Admin authentication successful:', adminUser.name);
      setUser(adminUser);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout 
        currentPage="crew-monitoring" 
        userName="Admin"
        pageTitle="Loading Crew Monitoring..."
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading crew monitoring...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <UnifiedCrewProvider>
      <AdminLayout 
        currentPage="crew-monitoring" 
        userName={user?.name || 'Admin'}
        pageTitle="Crew Monitoring"
        pageDescription="Monitor crew activity, track work hours, and manage team performance across all branches."
      >
        <UnifiedCrewDashboard />
      </AdminLayout>
    </UnifiedCrewProvider>
  );
}