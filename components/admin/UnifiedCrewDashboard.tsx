'use client'

import React, { useState } from 'react'
import { useUnifiedCrewMonitoring } from '@/lib/unified-crew-context'
import {
  Users,
  Clock,
  Activity,
  BarChart3,
  MapPin,
  RefreshCw,
  AlertCircle,
  Calendar,
  Eye,
  TrendingUp,
  Bell
} from 'lucide-react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const UnifiedCrewDashboard: React.FC = () => {
  const {
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
  } = useUnifiedCrewMonitoring()

  const [activeTab, setActiveTab] = useState<'status' | 'sessions' | 'activities' | 'summary'>('status')

  const filteredOnlineCrews = selectedBranch
    ? onlineCrews.filter(crew => crew.branch_name === branches.find(b => b.id === selectedBranch)?.name)
    : onlineCrews

  const filteredSessionHistory = selectedBranch
    ? sessionHistory.filter(session => session.branches?.name === branches.find(b => b.id === selectedBranch)?.name)
    : sessionHistory

  const filteredActivityLogs = selectedBranch
    ? activityLogs.filter(log => log.branches?.name === branches.find(b => b.id === selectedBranch)?.name)
    : activityLogs

  const filteredWorkHoursSummary = selectedBranch
    ? workHoursSummary.filter(summary => summary.branch_name === branches.find(b => b.id === selectedBranch)?.name)
    : workHoursSummary

  const totalOnline = filteredOnlineCrews.filter(crew => crew.is_online).length
  const totalActiveToday = new Set(filteredActivityLogs.map(log => log.admin_users?.email)).size
  const totalWorkHours = filteredWorkHoursSummary.reduce((sum, s) => sum + (s.total_hours || 0), 0)

  const avgSessionDuration = filteredWorkHoursSummary.length > 0
    ? filteredWorkHoursSummary.reduce((sum, s) => sum + (s.avg_session_duration ? parseIntervalToSeconds(s.avg_session_duration) : 0), 0) / filteredWorkHoursSummary.length
    : 0

  function parseIntervalToSeconds(interval: string): number {
    const parts = interval.split(' ')
    let seconds = 0
    for (let i = 0; i < parts.length; i += 2) {
      const value = parseInt(parts[i])
      const unit = parts[i + 1]
      if (unit.startsWith('hour')) seconds += value * 3600
      else if (unit.startsWith('minute')) seconds += value * 60
      else if (unit.startsWith('second')) seconds += value
    }
    return seconds
  }

  function formatSecondsToHMS(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = Math.floor(totalSeconds % 60)
    return `${hours}h ${minutes}m ${seconds}s`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading crew monitoring data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Branch Filter and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crew Monitoring</h1>
          <p className="text-gray-600">Real-time crew activity and performance tracking</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Branch Filter */}
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-lays-dark-red focus:border-transparent"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={refreshData}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Online Now</p>
            <p className="text-2xl font-semibold text-gray-900">{totalOnline}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Avg Session</p>
            <p className="text-2xl font-semibold text-gray-900">{formatSecondsToHMS(avgSessionDuration)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Activity className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Today</p>
            <p className="text-2xl font-semibold text-gray-900">{totalActiveToday}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Hours</p>
            <p className="text-2xl font-semibold text-gray-900">{totalWorkHours.toFixed(2)}h</p>
          </div>
        </div>
      </div>

      {/* Realtime Status */}
      <div className={`p-3 rounded-lg text-sm flex items-center space-x-2 ${
        realtimeStatus === 'SUBSCRIBED' ? 'bg-green-100 text-green-800' :
        realtimeStatus === 'DISCONNECTED' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        <AlertCircle className="w-4 h-4" />
        <span>Real-time Status: {realtimeStatus}</span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('status')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'status'
                ? 'border-lays-dark-red text-lays-dark-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Online Status
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-lays-dark-red text-lays-dark-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Session History
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activities'
                ? 'border-lays-dark-red text-lays-dark-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activity Logs
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-lays-dark-red text-lays-dark-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Work Hours Summary
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        {activeTab === 'status' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Currently Online</h3>
            {filteredOnlineCrews.length === 0 ? (
              <p className="text-gray-500">No crew members online.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew Member</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On Page</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOnlineCrews.map((crew) => (
                      <tr key={crew.user_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{crew.name}</div>
                          <div className="text-sm text-gray-500">{crew.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{crew.branch_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            crew.is_online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {crew.is_online ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {crew.last_seen ? formatDistanceToNow(parseISO(crew.last_seen), { addSuffix: true }) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{crew.current_page || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session History</h3>
            {filteredSessionHistory.length === 0 ? (
              <p className="text-gray-500">No session history available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew Member</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Start</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSessionHistory.map((session) => (
                      <tr key={session.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{session.admin_users?.name}</div>
                          <div className="text-sm text-gray-500">{session.admin_users?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.branches?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(session.session_start), 'MM/dd/yyyy, hh:mm:ss a')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.last_activity ? formatDistanceToNow(parseISO(session.last_activity), { addSuffix: true }) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            session.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
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

        {activeTab === 'activities' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
            {filteredActivityLogs.length === 0 ? (
              <p className="text-gray-500">No recent activities.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew Member</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredActivityLogs.map((activity) => (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{activity.admin_users?.name}</div>
                          <div className="text-sm text-gray-500">{activity.admin_users?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.branches?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.activity_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Work Hours Summary</h3>
            {filteredWorkHoursSummary.length === 0 ? (
              <p className="text-gray-500">No work hours summary available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew Member</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sessions</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Session Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWorkHoursSummary.map((summary) => (
                      <tr key={summary.user_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{summary.name}</div>
                          <div className="text-sm text-gray-500">{summary.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{summary.branch_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{summary.total_hours?.toFixed(2) || '0.00'}h</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{summary.total_sessions}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {summary.avg_session_duration ? formatSecondsToHMS(parseIntervalToSeconds(summary.avg_session_duration)) : '0h 0m 0s'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
