'use client';

import React, { useState, useEffect } from 'react';
import { useCrewMonitoring } from '@/lib/crew-monitoring-context';
import { crewRealtime, RealtimeCrewUpdate } from '@/lib/crew-realtime';
import { CrewOnlineStatus, CrewSession, CrewActivityLog } from '@/lib/crew-monitoring';

interface CrewMonitoringDashboardProps {
  selectedBranch?: string;
  onBranchChange?: (branchId: string) => void;
}

export const CrewMonitoringDashboard: React.FC<CrewMonitoringDashboardProps> = ({
  selectedBranch,
  onBranchChange
}) => {
  const {
    onlineCrew,
    loading,
    error,
    refreshOnlineStatus,
    getSessionHistory,
    getActivityLogs,
    getWorkHoursSummary
  } = useCrewMonitoring();

  const [activeTab, setActiveTab] = useState<'online' | 'sessions' | 'activity' | 'summary'>('online');
  const [sessionHistory, setSessionHistory] = useState<CrewSession[]>([]);
  const [activityLogs, setActivityLogs] = useState<CrewActivityLog[]>([]);
  const [workHoursSummary, setWorkHoursSummary] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    end: new Date().toISOString().split('T')[0] // today
  });

  // Real-time updates
  useEffect(() => {
    const handleRealtimeUpdate = (update: RealtimeCrewUpdate) => {
      if (update.table === 'crew_online_status') {
        refreshOnlineStatus();
      } else if (update.table === 'crew_activity_logs') {
        // Refresh activity logs if we're on that tab
        if (activeTab === 'activity') {
          loadActivityLogs();
        }
      }
    };

    crewRealtime.subscribeToCrewUpdates(handleRealtimeUpdate);

    return () => {
      crewRealtime.unsubscribeFromCrewUpdates(handleRealtimeUpdate);
    };
  }, [activeTab, refreshOnlineStatus]);

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'sessions':
        loadSessionHistory();
        break;
      case 'activity':
        loadActivityLogs();
        break;
      case 'summary':
        loadWorkHoursSummary();
        break;
    }
  }, [activeTab, selectedBranch, dateRange]);

  const loadSessionHistory = async () => {
    const sessions = await getSessionHistory(undefined, selectedBranch);
    setSessionHistory(sessions);
  };

  const loadActivityLogs = async () => {
    const logs = await getActivityLogs(undefined, selectedBranch);
    setActivityLogs(logs);
  };

  const loadWorkHoursSummary = async () => {
    const summary = await getWorkHoursSummary(dateRange.start, dateRange.end, selectedBranch);
    setWorkHoursSummary(summary);
  };

  const formatDuration = (duration: string): string => {
    if (!duration) return '0m';
    
    const match = duration.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    }
    
    return duration;
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getStatusColor = (isOnline: boolean): string => {
    return isOnline ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const getStatusDot = (isOnline: boolean): string => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  const formatActivityData = (activityData: any, activityType: string) => {
    if (!activityData) return null;

    try {
      // Parse if it's a string
      const data = typeof activityData === 'string' ? JSON.parse(activityData) : activityData;

      switch (activityType) {
        case 'login':
          return (
            <div className="space-y-1">
              <div className="text-green-600">✓ Logged in successfully</div>
              {data.ip_address && <div>IP: {data.ip_address}</div>}
              {data.user_agent && <div>Device: {data.user_agent.split(' ')[0]}</div>}
            </div>
          );
        
        case 'logout':
          return (
            <div className="space-y-1">
              <div className="text-red-600">✗ Logged out</div>
              {data.session_duration && (
                <div>Session duration: {formatDuration(data.session_duration)}</div>
              )}
            </div>
          );
        
        case 'page_view':
          return (
            <div className="space-y-1">
              <div className="text-blue-600">👁️ Viewed page</div>
              {data.page && <div>Page: {data.page}</div>}
            </div>
          );
        
        case 'heartbeat':
          return (
            <div className="space-y-1">
              <div className="text-gray-600">💓 Activity heartbeat</div>
              {data.page && <div>Current page: {data.page}</div>}
            </div>
          );
        
        case 'action':
          return (
            <div className="space-y-1">
              <div className="text-purple-600">⚡ Action performed</div>
              {data.action && <div>Action: {data.action}</div>}
              {data.details && <div>Details: {data.details}</div>}
            </div>
          );
        
        default:
          return (
            <div className="space-y-1">
              <div className="text-gray-600">📝 Activity</div>
              {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                  {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
              ))}
            </div>
          );
      }
    } catch (error) {
      return <div className="text-red-500">Error parsing activity data</div>;
    }
  };

  if (loading && onlineCrew.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={refreshOnlineStatus}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Crew Monitoring</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time updates active</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Online Now</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : onlineCrew.filter(crew => crew.is_online).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Crew</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : onlineCrew.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Session</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : 
                  onlineCrew.length > 0 
                    ? formatDuration(onlineCrew[0].session_duration) 
                    : '0m'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Branches</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : 
                  new Set(onlineCrew.map(crew => crew.branch_name)).size
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'online', label: 'Online Now', count: onlineCrew.filter(crew => crew.is_online).length },
            { id: 'sessions', label: 'Sessions', count: sessionHistory.length },
            { id: 'activity', label: 'Activity', count: activityLogs.length },
            { id: 'summary', label: 'Summary', count: workHoursSummary.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'online' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Currently Online</h3>
            {onlineCrew.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No crew members online</p>
            ) : (
              <div className="space-y-4">
                {onlineCrew.map((crew) => (
                  <div key={crew.user_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusDot(crew.is_online)}`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{crew.name}</p>
                        <p className="text-sm text-gray-500">{crew.email}</p>
                        <p className="text-sm text-gray-500">{crew.branch_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getStatusColor(crew.is_online)}`}>
                        {crew.is_online ? 'Online' : 'Offline'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {crew.is_online ? formatDuration(crew.session_duration) : formatTimeAgo(crew.last_seen)}
                      </p>
                      {crew.current_page && (
                        <p className="text-xs text-gray-400">On: {crew.current_page}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session History</h3>
            {sessionHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No session history found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Start</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessionHistory.map((session) => (
                      <tr key={session.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {session.admin_users?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.branches?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(session.session_start).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTimeAgo(session.last_activity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.is_active)}`}>
                            {session.is_active ? 'Active' : 'Ended'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            {activityLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activity logs found</p>
            ) : (
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      log.activity_type === 'login' ? 'bg-green-500' :
                      log.activity_type === 'logout' ? 'bg-red-500' :
                      log.activity_type === 'heartbeat' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {log.admin_users?.name || 'Unknown'} - {log.activity_type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {log.branches?.name || 'Unknown'} • {formatTimeAgo(log.created_at)}
                      </p>
                      {log.activity_data && (
                        <div className="text-xs text-gray-400">
                          {formatActivityData(log.activity_data, log.activity_type)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Work Hours Summary</h3>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            {workHoursSummary.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No work hours data found</p>
            ) : (
              <div className="space-y-4">
                {workHoursSummary.map((summary) => (
                  <div key={summary.user_id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{summary.name}</p>
                        <p className="text-sm text-gray-500">{summary.email}</p>
                        <p className="text-sm text-gray-500">{summary.branch_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {summary.total_hours.toFixed(1)}h
                        </p>
                        <p className="text-sm text-gray-500">
                          {summary.sessions.length} sessions
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
