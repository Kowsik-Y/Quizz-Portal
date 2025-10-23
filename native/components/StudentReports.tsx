import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';
import { attemptAPI } from '@/lib/api';
import { 
  FileText, ChevronRight, AlertTriangle, CheckCircle, 
  XCircle, Clock, Calendar, Shield, Eye, TrendingUp 
} from 'lucide-react-native';
import { showToast } from '@/lib/toast';
import { useRouter } from 'expo-router';

interface StudentAttempt {
  id: number;
  status: 'in_progress' | 'submitted';
  score: number;
  total_points: number;
  percentage: number;
  started_at: string;
  submitted_at: string | null;
  violation_count: number;
  platform: string;
  browser: string;
  attempt_number: number;
}

interface Violation {
  id: number;
  violation_type: string;
  details: string | { message: string } | Record<string, any>; // JSONB can be string or object
  created_at: string;
}

interface AttemptWithViolations extends StudentAttempt {
  violations: Violation[];
  questions_attempted: number;
  total_questions: number;
}

interface StudentReportsProps {
  testId: number;
  studentId: number;
}

export default function StudentReports({ testId, studentId }: StudentReportsProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptWithViolations | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Load all attempts for this student on this test
  const loadAttempts = async () => {
    try {
      setLoading(true);
      const response = await attemptAPI.getStudentAttempts(studentId, testId);
      setAttempts(response.data.attempts || []);
    } catch (error: any) {
      showToast.error('Failed to load test attempts', { title: 'Error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, [testId, studentId]);

  // Load detailed attempt with violations
  const loadAttemptDetail = async (attemptId: number) => {
    try {
      setLoadingDetail(true);
      const response = await attemptAPI.getAttemptDetail(attemptId);
      setSelectedAttempt(response.data);
      setShowDetail(true);
    } catch (error: any) {
      showToast.error('Failed to load attempt details', { title: 'Error' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In Progress';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const minutes = Math.floor((endTime - startTime) / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getViolationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'window_switch': 'Window Switch',
      'tab_switch': 'Tab Switch',
      'screenshot': 'Screenshot Attempt',
      'copy': 'Copy Attempt',
      'paste': 'Paste Attempt',
      'phone_call': 'Phone Call',
      'app_switch': 'App Switch'
    };
    return labels[type] || type;
  };

  const getViolationColor = useCallback((type: string) => {
    const colors: Record<string, { light: string; dark: string }> = {
      'window_switch': { light: '#f59e0b', dark: '#fbbf24' },
      'tab_switch': { light: '#f59e0b', dark: '#fbbf24' },
      'screenshot': { light: '#ef4444', dark: '#f87171' },
      'copy': { light: '#ef4444', dark: '#f87171' },
      'paste': { light: '#ef4444', dark: '#f87171' },
      'phone_call': { light: '#ec4899', dark: '#f472b6' },
      'app_switch': { light: '#f59e0b', dark: '#fbbf24' }
    };
    return colors[type]?.[isDark ? 'dark' : 'light'] || (isDark ? '#9ca3af' : '#6b7280');
  }, [isDark]);

  // Helper function to safely render violation details
  const renderViolationDetails = useCallback((details: string | { message: string } | Record<string, any> | null | undefined): string => {
    if (!details) return 'No details available';
    
    // If it's already a string, return it
    if (typeof details === 'string') {
      return details;
    }
    
    // If it's an object with a message property, return that
    if (typeof details === 'object' && details !== null) {
      if ('message' in details && typeof details.message === 'string') {
        return details.message;
      }
      // Otherwise stringify the object
      try {
        return JSON.stringify(details);
      } catch (e) {
        return 'Invalid details format';
      }
    }
    
    return 'Unknown details format';
  }, []);

  if (loading) {
    return (
      <View className="p-6 items-center justify-center">
        <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#3b82f6'} />
        <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading your test reports...
        </Text>
      </View>
    );
  }

  // Detail View
  if (showDetail && selectedAttempt) {
    return (
      <View className="flex-1">
        {/* Header */}
        <View className={`p-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <Pressable
            onPress={() => setShowDetail(false)}
            className="flex-row items-center mb-3"
          >
            <Text className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              ← Back to All Attempts
            </Text>
          </Pressable>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Attempt #{selectedAttempt.attempt_number} Details
          </Text>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Score Card */}
          <View className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Test Score
            </Text>
            <View className="flex-row items-center gap-4">
              <View className="flex-1">
                <Text className={`text-4xl font-bold ${
                  selectedAttempt.percentage >= 60 
                    ? isDark ? 'text-green-400' : 'text-green-600'
                    : isDark ? 'text-red-400' : 'text-red-600'
                }`}>
                  {selectedAttempt.percentage}%
                </Text>
                <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedAttempt.score}/{selectedAttempt.total_points} points
                </Text>
              </View>
              {selectedAttempt.percentage >= 60 ? (
                <CheckCircle size={48} color={isDark ? '#86efac' : '#16a34a'} />
              ) : (
                <XCircle size={48} color={isDark ? '#fca5a5' : '#dc2626'} />
              )}
            </View>
          </View>

          {/* Test Info */}
          <View className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Test Information
            </Text>
            <View className="gap-2">
              <View className="flex-row items-center">
                <Calendar size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Started: {formatDate(selectedAttempt.started_at)}
                </Text>
              </View>
              {selectedAttempt.submitted_at && (
                <View className="flex-row items-center">
                  <Clock size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Duration: {formatDuration(selectedAttempt.started_at, selectedAttempt.submitted_at)}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center">
                <FileText size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Questions Attempted: {selectedAttempt.questions_attempted}/{selectedAttempt.total_questions}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Platform: {selectedAttempt.platform === 'web' ? '🌐 Web' : '📱 Mobile'}
                  {selectedAttempt.browser && ` (${selectedAttempt.browser})`}
                </Text>
              </View>
            </View>
          </View>

          {/* Violations Section */}
          <View className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Violations
              </Text>
              <View className={`px-3 py-1 rounded-full ${
                selectedAttempt.violation_count > 0
                  ? isDark ? 'bg-red-900/30' : 'bg-red-100'
                  : isDark ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <Text className={`text-sm font-bold ${
                  selectedAttempt.violation_count > 0
                    ? isDark ? 'text-red-400' : 'text-red-700'
                    : isDark ? 'text-green-400' : 'text-green-700'
                }`}>
                  {selectedAttempt.violation_count} Total
                </Text>
              </View>
            </View>

            {selectedAttempt.violations && selectedAttempt.violations.length > 0 ? (
              <View className="gap-2">
                {selectedAttempt.violations.map((violation, index) => (
                  <View
                    key={violation.id}
                    className={`p-3 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <View className="flex-row items-center mb-1">
                      <Shield size={16} color={getViolationColor(violation.violation_type)} />
                      <Text className={`ml-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getViolationTypeLabel(violation.violation_type)}
                      </Text>
                    </View>
                    <Text className={`text-sm ml-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {renderViolationDetails(violation.details)}
                    </Text>
                    <Text className={`text-xs ml-6 mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formatDate(violation.created_at)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center py-6">
                <CheckCircle size={32} color={isDark ? '#86efac' : '#16a34a'} />
                <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No violations detected
                </Text>
              </View>
            )}
          </View>

          {/* View Answers Button */}
          <Pressable
            onPress={() => router.push(`/tests/review?attemptId=${selectedAttempt.id}` as any)}
            className={`rounded-xl p-4 flex-row items-center justify-between ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} border ${isDark ? 'border-blue-700' : 'border-blue-200'}`}
          >
            <View className="flex-row items-center">
              <Eye size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
              <Text className={`ml-3 font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                View Detailed Answers & Solutions
              </Text>
            </View>
            <ChevronRight size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // List View
  return (
    <View className="flex-1">
      {/* Header */}
      <View className={`p-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Your Test Reports
        </Text>
        <View className="flex-row items-center gap-4 mt-3">
          <View className={`flex-1 p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <Text className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              Total Attempts
            </Text>
            <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {attempts.length}
            </Text>
          </View>
          <View className={`flex-1 p-3 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
            <Text className={`text-xs font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
              Best Score
            </Text>
            <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {attempts.length > 0 
                ? Math.max(...attempts.map(a => a.percentage)) 
                : 0}%
            </Text>
          </View>
          <View className={`flex-1 p-3 rounded-lg ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
            <Text className={`text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              Violations
            </Text>
            <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {attempts.reduce((sum, a) => sum + a.violation_count, 0)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {attempts.length === 0 ? (
          <View className="items-center py-12">
            <FileText size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text className={`mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No test attempts yet
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {attempts.map((attempt, index) => (
              <Pressable
                key={attempt.id}
                onPress={() => loadAttemptDetail(attempt.id)}
                className={`rounded-xl p-4 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Attempt #{attempts.length - index}
                    </Text>
                    {attempt.status === 'in_progress' ? (
                      <View className={`px-2 py-1 rounded ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                        <Text className={`text-xs font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                          In Progress
                        </Text>
                      </View>
                    ) : (
                      <View className={`px-2 py-1 rounded ${
                        attempt.percentage >= 60
                          ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                          : isDark ? 'bg-red-900/30' : 'bg-red-100'
                      }`}>
                        <Text className={`text-xs font-semibold ${
                          attempt.percentage >= 60
                            ? isDark ? 'text-green-400' : 'text-green-700'
                            : isDark ? 'text-red-400' : 'text-red-700'
                        }`}>
                          {attempt.percentage >= 60 ? 'Passed' : 'Failed'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <ChevronRight size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                </View>

                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Score:
                    </Text>
                    <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {attempt.score}/{attempt.total_points} ({attempt.percentage}%)
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Date:
                    </Text>
                    <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatDate(attempt.started_at)}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Violations:
                    </Text>
                    <View className="flex-row items-center">
                      {attempt.violation_count > 0 && (
                        <AlertTriangle size={16} color={isDark ? '#fca5a5' : '#dc2626'} />
                      )}
                      <Text className={`ml-1 font-semibold ${
                        attempt.violation_count > 0
                          ? isDark ? 'text-red-400' : 'text-red-600'
                          : isDark ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {attempt.violation_count}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
