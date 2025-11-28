'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, User, MapPin, Monitor, Clock } from 'lucide-react';
import { UserActivity } from '@/types/audit';
import DateRangePicker from './DateRangePicker';
import InteractiveChart from './InteractiveChart';

interface UserActivityTrackingProps {
  userId?: string;
}

export default function UserActivityTracking({ userId }: UserActivityTrackingProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [selectedUser, setSelectedUser] = useState<string>(userId || 'all');

  useEffect(() => {
    fetchActivities();
  }, [selectedUser, dateRange]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedUser !== 'all') params.set('userId', selectedUser);
      if (dateRange.start) params.set('startDate', dateRange.start.toISOString());
      if (dateRange.end) params.set('endDate', dateRange.end.toISOString());

      const res = await fetch(`/api/admin/user-activity?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group activities by hour for chart
  const hourlyData = activities.reduce((acc, activity) => {
    const hour = new Date(activity.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });

  const chartData = Array.from({ length: 24 }, (_, i) => ({
    label: `${i.toString().padStart(2, '0')}:00`,
    value: hourlyData[i] || 0,
  }));

  // Get unique users
  const uniqueUsers = Array.from(new Set(activities.map((a) => a.userId)));

  // Activity summary
  const activityCount = activities.length;
  const uniqueUsersCount = uniqueUsers.length;
  const todayActivities = activities.filter(
    (a) => new Date(a.timestamp).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-[#2F6FED]" />
          <h2 className="text-2xl font-bold text-[#E6EDF3]">User Activity Tracking</h2>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-[#141A22] border border-[#2A3440] rounded-lg">
          <div className="text-sm text-[#AEBAC7] mb-1">Total Activities</div>
          <div className="text-2xl font-bold text-[#E6EDF3]">{activityCount}</div>
        </div>
        <div className="p-4 bg-[#141A22] border border-[#2A3440] rounded-lg">
          <div className="text-sm text-[#AEBAC7] mb-1">Active Users</div>
          <div className="text-2xl font-bold text-[#E6EDF3]">{uniqueUsersCount}</div>
        </div>
        <div className="p-4 bg-[#141A22] border border-[#2A3440] rounded-lg">
          <div className="text-sm text-[#AEBAC7] mb-1">Today</div>
          <div className="text-2xl font-bold text-[#E6EDF3]">{todayActivities}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-[#141A22] border border-[#2A3440] rounded-lg">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
        >
          <option value="all">All Users</option>
          {uniqueUsers.map((uid) => {
            const user = activities.find((a) => a.userId === uid);
            return (
              <option key={uid} value={uid}>
                {user?.userName || uid}
              </option>
            );
          })}
        </select>

        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Chart */}
      <InteractiveChart
        data={chartData}
        title="Activity by Hour"
        height={200}
      />

      {/* Activity List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-[#AEBAC7]">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-[#AEBAC7]">No activities found</div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-[#141A22] border border-[#2A3440] rounded-lg hover:border-[#2F6FED]/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-[#2F6FED]" />
                    <span className="text-[#E6EDF3] font-semibold">{activity.userName}</span>
                    <span className="px-2 py-1 bg-[#1A2332] border border-[#2A3440] rounded text-xs text-[#AEBAC7]">
                      {activity.action}
                    </span>
                  </div>
                  <p className="text-[#AEBAC7] mb-2">{activity.description}</p>
                  <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                    {activity.metadata?.ipAddress && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{activity.metadata.ipAddress}</span>
                      </div>
                    )}
                    {activity.metadata?.userAgent && (
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{activity.metadata.userAgent}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

