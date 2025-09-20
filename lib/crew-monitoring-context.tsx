'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { crewMonitoring, CrewOnlineStatus, CrewSession, CrewActivityLog } from './crew-monitoring';

interface CrewMonitoringContextType {
  // Online status
  onlineCrew: CrewOnlineStatus[];
  isOnline: boolean;
  currentSessionId: string | null;
  
  // Session management
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  trackPageView: (page: string) => Promise<void>;
  trackAction: (action: string, data?: any) => Promise<void>;
  
  // Data fetching
  getSessionHistory: (userId?: string, branchId?: string) => Promise<CrewSession[]>;
  getActivityLogs: (userId?: string, branchId?: string, activityType?: string) => Promise<CrewActivityLog[]>;
  getWorkHoursSummary: (startDate: string, endDate: string, branchId?: string) => Promise<any[]>;
  
  // Real-time updates
  refreshOnlineStatus: () => Promise<void>;
  
  // Loading states
  loading: boolean;
  error: string | null;
}

const CrewMonitoringContext = createContext<CrewMonitoringContextType | undefined>(undefined);

export const useCrewMonitoring = () => {
  const context = useContext(CrewMonitoringContext);
  if (!context) {
    throw new Error('useCrewMonitoring must be used within a CrewMonitoringProvider');
  }
  return context;
};

interface CrewMonitoringProviderProps {
  children: React.ReactNode;
  enableAutoTracking?: boolean;
  enableRealTimeUpdates?: boolean;
}

export const CrewMonitoringProvider: React.FC<CrewMonitoringProviderProps> = ({
  children,
  enableAutoTracking = true,
  enableRealTimeUpdates = true
}) => {
  const [onlineCrew, setOnlineCrew] = useState<CrewOnlineStatus[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start session
  const startSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sessionId = await crewMonitoring.startSession();
      if (sessionId) {
        setCurrentSessionId(sessionId);
        setIsOnline(true);
        await refreshOnlineStatus();
      } else {
        console.log('Crew monitoring: Session not started (user may not be crew member)');
      }
    } catch (err) {
      console.error('Crew monitoring context error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setLoading(false);
    }
  }, []);

  // End session
  const endSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await crewMonitoring.endSession();
      setCurrentSessionId(null);
      setIsOnline(false);
      await refreshOnlineStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setLoading(false);
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(async (page: string) => {
    try {
      await crewMonitoring.trackPageView(page);
    } catch (err) {
      console.error('Failed to track page view:', err);
    }
  }, []);

  // Track action
  const trackAction = useCallback(async (action: string, data?: any) => {
    try {
      await crewMonitoring.trackAction(action, data);
    } catch (err) {
      console.error('Failed to track action:', err);
    }
  }, []);

  // Get session history
  const getSessionHistory = useCallback(async (userId?: string, branchId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const sessions = await crewMonitoring.getCrewSessionHistory(userId, branchId);
      return sessions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get session history');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get activity logs
  const getActivityLogs = useCallback(async (userId?: string, branchId?: string, activityType?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const logs = await crewMonitoring.getCrewActivityLogs(userId, branchId, activityType);
      return logs;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get activity logs');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get work hours summary
  const getWorkHoursSummary = useCallback(async (startDate: string, endDate: string, branchId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const summary = await crewMonitoring.getCrewWorkHoursSummary(startDate, endDate, branchId);
      return summary;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get work hours summary');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh online status
  const refreshOnlineStatus = useCallback(async () => {
    try {
      const status = await crewMonitoring.getCrewOnlineStatus();
      setOnlineCrew(status);
    } catch (err) {
      console.error('Failed to refresh online status:', err);
    }
  }, []);

  // Auto-start session on mount if enabled
  useEffect(() => {
    if (enableAutoTracking) {
      startSession();
    }

    return () => {
      if (enableAutoTracking) {
        crewMonitoring.cleanup();
      }
    };
  }, [enableAutoTracking, startSession]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    // Initial load
    refreshOnlineStatus();

    // Set up interval for periodic updates
    const interval = setInterval(refreshOnlineStatus, 10000); // Every 10 seconds for better real-time feel

    return () => {
      clearInterval(interval);
    };
  }, [enableRealTimeUpdates, refreshOnlineStatus]);

  // Track page changes
  useEffect(() => {
    if (!enableAutoTracking || !isOnline) return;

    const handleRouteChange = () => {
      const currentPage = window.location.pathname;
      trackPageView(currentPage);
    };

    // Track initial page
    handleRouteChange();

    // Listen for route changes (Next.js)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [enableAutoTracking, isOnline, trackPageView]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentSessionId) {
        console.log('🧹 Cleaning up crew session on unmount');
        crewMonitoring.endSession();
      }
    };
  }, [currentSessionId]);

  // Handle page unload (browser close, refresh, navigation)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSessionId) {
        console.log('🧹 Ending crew session on page unload');
        // Use sendBeacon for reliable cleanup on page unload
        navigator.sendBeacon('/api/crew/end-session', JSON.stringify({
          sessionId: currentSessionId
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentSessionId]);

  // Periodic cleanup of stale sessions (every 5 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        await crewMonitoring.cleanupStaleSessions();
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  const value: CrewMonitoringContextType = {
    onlineCrew,
    isOnline,
    currentSessionId,
    startSession,
    endSession,
    trackPageView,
    trackAction,
    getSessionHistory,
    getActivityLogs,
    getWorkHoursSummary,
    refreshOnlineStatus,
    loading,
    error
  };

  return (
    <CrewMonitoringContext.Provider value={value}>
      {children}
    </CrewMonitoringContext.Provider>
  );
};
