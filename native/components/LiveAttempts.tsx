// Live Test Attempts Component
// Shows real-time list of students taking/who took the test

import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';
import { attemptAPI } from '@/lib/api';
import { Users, CheckCircle, Clock, User, Calendar, Monitor, Globe, AlertCircle } from 'lucide-react-native';
import { showToast } from '@/lib/toast';

interface Attempt {
  id: number;
  status: 'in_progress' | 'submitted';
  score: number;
  total_points: number;
  platform: string;
  browser: string;
  started_at: string;
  submitted_at: string | null;
  student_id: number;
  student_name: string;
  student_email: string;
  enrollment_number: string;
  answered_count: number;
  total_questions: number;
}

interface LiveAttemptsProps {
  testId: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export default function LiveAttempts({ 
  testId, 
  autoRefresh = true, 
  refreshInterval = 10 
}: LiveAttemptsProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [accessDenied, setAccessDenied] = useState(false);

  const loadAttempts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await attemptAPI.getLiveAttempts(testId);
      setAttempts(response.data.attempts || []);
      setLiveCount(response.data.live_count || 0);
      setCompletedCount(response.data.completed_count || 0);
      setLastUpdated(new Date());
      setAccessDenied(false); // Reset access denied on success
    } catch (error: any) {
      console.error('Error loading live attempts:', error);
      
      // Check if it's a 403 Forbidden error
      if (error.response?.status === 403) {
        setAccessDenied(true);
        if (!isRefresh) {
          showToast.warning('You need teacher or admin permissions to view attempters', { 
            title: 'Access Denied' 
          });
        }
      } else if (!isRefresh) {
        showToast.error('Failed to load attempters', { title: 'Error' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    // Only load if component is still mounted
    const safeLoadAttempts = async (isRefresh = false) => {
      if (mounted) {
        await loadAttempts(isRefresh);
      }
    };

    // Initial load
    safeLoadAttempts();

    // Auto-refresh if enabled
    if (autoRefresh) {
      interval = setInterval(() => {
        safeLoadAttempts(true);
      }, refreshInterval * 1000);
    }

    // Cleanup function - always runs on unmount or dependency change
    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
        console.log('🛑 Live attempts polling stopped');
      }
    };
  }, [testId, autoRefresh, refreshInterval]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date().getTime();
    const started = new Date(dateString).getTime();
    const diffMinutes = Math.floor((now - started) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getProgressPercentage = (answered: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((answered / total) * 100);
  };

  // Access Denied State
  if (accessDenied) {
    return (
      <View className="flex-1 p-6 items-center justify-center">
        <AlertCircle size={64} color={isDark ? '#f87171' : '#ef4444'} />
        <Text className={`mt-4 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Access Denied
        </Text>
        <Text className={`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          You need teacher or admin permissions to view attempters.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="p-6 items-center justify-center">
        <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#3b82f6'} />
        <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading attempters...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header Stats */}
      <View className={`p-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <View className="flex-row justify-between items-center mb-3">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Attempters
          </Text>
          <View className="flex-row items-center gap-2">
            <View className={`w-2 h-2 rounded-full ${liveCount > 0 ? 'bg-green-500' : 'bg-gray-400'}`} 
                  style={{ opacity: liveCount > 0 ? 1 : 0.5 }} />
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Updated {getTimeSince(lastUpdated.toISOString())}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className={`flex-1 p-3 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
            <View className="flex-row items-center gap-2 mb-1">
              <Clock size={16} color={isDark ? '#86efac' : '#16a34a'} />
              <Text className={`text-xs font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                Live Now
              </Text>
            </View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {liveCount}
            </Text>
          </View>

          <View className={`flex-1 p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <View className="flex-row items-center gap-2 mb-1">
              <CheckCircle size={16} color={isDark ? '#93c5fd' : '#2563eb'} />
              <Text className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                Completed
              </Text>
            </View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {completedCount}
            </Text>
          </View>

          <View className={`flex-1 p-3 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
            <View className="flex-row items-center gap-2 mb-1">
              <Users size={16} color={isDark ? '#c4b5fd' : '#7c3aed'} />
              <Text className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                Total
              </Text>
            </View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {attempts.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Attempts List */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAttempts(true)}
            tintColor={isDark ? '#60a5fa' : '#3b82f6'}
          />
        }
      >
        {attempts.length === 0 ? (
          <View className="p-8 items-center justify-center">
            <Users size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text className={`mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No attempts yet
            </Text>
            <Text className={`mt-2 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Students will appear here when they start the test
            </Text>
          </View>
        ) : (
          <View className="p-4 gap-3">
            {attempts.map((attempt) => (
              <View
                key={attempt.id}
                className={`rounded-xl p-4 border ${
                  attempt.status === 'in_progress'
                    ? isDark
                      ? 'bg-green-900/10 border-green-700/50'
                      : 'bg-green-50 border-green-200'
                    : isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Student Info */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <User size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                      <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {attempt.student_name}
                      </Text>
                    </View>
                    {attempt.enrollment_number && (
                      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {attempt.enrollment_number}
                      </Text>
                    )}
                    <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {attempt.student_email}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    className={`px-3 py-1 rounded-full ${
                      attempt.status === 'in_progress'
                        ? isDark
                          ? 'bg-green-900/30'
                          : 'bg-green-100'
                        : isDark
                        ? 'bg-blue-900/30'
                        : 'bg-blue-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        attempt.status === 'in_progress'
                          ? isDark
                            ? 'text-green-300'
                            : 'text-green-700'
                          : isDark
                          ? 'text-blue-300'
                          : 'text-blue-700'
                      }`}
                    >
                      {attempt.status === 'in_progress' ? '🟢 Live' : '✅ Done'}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar (for in-progress) */}
                {attempt.status === 'in_progress' && (
                  <View className="mb-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Progress
                      </Text>
                      <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {attempt.answered_count}/{attempt.total_questions} questions
                      </Text>
                    </View>
                    <View className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <View
                        className="h-full bg-green-500"
                        style={{ width: `${getProgressPercentage(attempt.answered_count, attempt.total_questions)}%` }}
                      />
                    </View>
                  </View>
                )}

                {/* Score (for completed) */}
                {attempt.status === 'submitted' && (
                  <View className={`mb-3 p-3 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Score
                      </Text>
                      <Text className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {attempt.score}/{attempt.total_points}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mt-1">
                      <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Percentage
                      </Text>
                      <Text className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {Math.round((attempt.score / attempt.total_points) * 100)}%
                      </Text>
                    </View>
                  </View>
                )}

                {/* Meta Info */}
                <View className="flex-row flex-wrap gap-3">
                  <View className="flex-row items-center gap-1">
                    <Calendar size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Started: {formatDate(attempt.started_at)}
                    </Text>
                  </View>
                  {attempt.submitted_at && (
                    <View className="flex-row items-center gap-1">
                      <CheckCircle size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Submitted: {formatDate(attempt.submitted_at)}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row items-center gap-1">
                    <Monitor size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {attempt.platform}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Globe size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {attempt.browser}
                    </Text>
                  </View>
                </View>

                {/* Time Indicator for In Progress */}
                {attempt.status === 'in_progress' && (
                  <View className="mt-3 pt-3 border-t border-gray-600">
                    <Text className={`text-xs text-center ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      ⏱️ Active for {getTimeSince(attempt.started_at)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <View className={`p-2 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <Text className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            🔄 Auto-refreshing every {refreshInterval}s • Pull down to refresh manually
          </Text>
        </View>
      )}
    </View>
  );
}
