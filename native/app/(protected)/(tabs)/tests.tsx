import { View, ScrollView, Pressable, TextInput, Platform, Dimensions, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { Search, Clock, BookOpen,  FileText, Calendar, PlayCircle, AlertCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTestStore } from '@/stores/testStore';
import { LoadingState } from '@/components/LoadingState';
import { showToast } from '@/lib/toast';

export default function TestsPage() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const isWeb = Platform.OS === 'web';
  const router = useRouter();

  const tests = useTestStore(state => state.tests);
  const bookings = useTestStore(state => state.bookings);
  const fetchMyBookings = useTestStore(state => state.fetchMyBookings);
  const loading = useTestStore(state => state.loading);
  const error = useTestStore(state => state.error);
  const refreshing = useTestStore(state => state.refreshing);
  const fetchTests = useTestStore(state => state.fetchTests);
  const refreshData = useTestStore(state => state.refreshData);

  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth > 768;
  const numColumns = isWeb ? (isLargeScreen ? 3 : 2) : 1;


  useEffect(() => {
    fetchTests();
    fetchMyBookings();
  }, [fetchTests, fetchMyBookings]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'instant' | 'booking' | 'timed' | 'booked'>('all');

  const getTestType = (test: any) => {
    const t = test.test_type || test.type || test.mode || test.testType || test.mode_type;
    if (t) return t;
    if (test.booking_required || test.is_booking) return 'booking';
    if (test.test_mode === 'instant') return 'instant';
    if (test.duration_minutes || test.duration || test.duration_min) return 'timed';
    return 'timed';
  };

  // Check if test can be taken (uses normalized type and bookings)
  const canTakeTest = (test: any) => {
    if (!test.is_active) return false;
    const tType = getTestType(test);
    if (String(tType).toLowerCase() === 'instant') return true;
    if (String(tType).toLowerCase() === 'booking') {
      // user can take if they have a non-cancelled booking for this test
      return bookings.some((b: any) => (b.test_id === test.id || b.test?.id === test.id) && b.status !== 'cancelled');
    }
    // timed tests are available if active
    return true;
  };

  // Check if test is completed (reached maximum attempts)
  const isTestCompleted = (test: any) => {
    // If test has max_attempts defined and user cannot take the test, it's completed
    return test.max_attempts && !canTakeTest(test);
  };

  // Filter tests based on search and type filter
  const filteredTests = Array.isArray(tests)
    ? tests.filter(test => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        test.title?.toLowerCase().includes(q) ||
        test.description?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Filter by tab (available vs completed)
      const isCompleted = isTestCompleted(test);
      if (activeTab === 'available' && isCompleted) return false;
      if (activeTab === 'completed' && !isCompleted) return false;

      if (typeFilter === 'all') return true;
      if (typeFilter === 'booked') {
        return bookings.some((b: any) => b.test_id === test.id || b.test?.id === test.id);
      }

      const tType = getTestType(test);
      return String(tType).toLowerCase() === typeFilter;
    })
    : [];

  const TabButton = ({ title, isActive, onPress }: any) => (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-3 rounded-lg ${isActive
        ? 'bg-blue-500'
        : isDark
          ? 'bg-gray-800'
          : 'bg-gray-100'
        }`}
    >
      <Text
        className={`text-center font-semibold ${isActive ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
      >
        {title}
      </Text>
    </Pressable>
  );

  const TestCard = ({ test }: any) => {
    const isCompleted = isTestCompleted(test);
    const score = 0;
    const testCanBeTaken = canTakeTest(test);
    const maxAttemptsReached = test.max_attempts && !testCanBeTaken;    return (
      <Pressable
        onPress={() => router.push(`/tests/test-details?id=${test.id}` as any)}
        className={`rounded-xl p-5 mb-4 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        style={{
          width: isWeb
            ? numColumns === 3
              ? '32%'
              : '100%'
            : '100%',
        }}
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text
              className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
              numberOfLines={2}
            >
              {test.title}
            </Text>
            <Text
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              numberOfLines={2}
            >
              {test.description}
            </Text>
          </View>
          {maxAttemptsReached && (
            <View className="bg-orange-500 rounded-full px-3 py-1 ml-2">
              <Text className="text-white font-semibold text-xs">Max Attempts</Text>
            </View>
          )}
          {!test.is_active && (
            <View className="bg-red-500 rounded-full px-3 py-1 ml-2">
              <Text className="text-white font-semibold text-xs">Inactive</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center">
            <BookOpen size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {test.question_count || 0} questions
            </Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {test.duration_minutes} min
            </Text>
          </View>
        </View>

        {/* Type Badge */}
        <View className="mb-3">
          {(() => {
            const tt = String(getTestType(test)).toLowerCase();
            return (
              <View className={`self-start px-3 py-1 rounded-full ${tt === 'instant' ? 'bg-green-100' : tt === 'booking' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                <Text className={`text-xs font-semibold ${tt === 'instant' ? 'text-green-700' : tt === 'booking' ? 'text-blue-700' : 'text-yellow-700'}`}>
                  {tt === 'instant' ? '⚡ Instant' : tt === 'booking' ? '📅 Booking Required' : '⏰ Timed'}
                </Text>
              </View>
            );
          })()}
        </View>

        {/* Action Buttons */}
        <View className="gap-2 mb-3">
          {/* Materials Button */}
          <Pressable
            onPress={(e: any) => {
              e?.stopPropagation?.();
              router.push(`/courses/course-details?id=${test.course_id}` as any);
            }}
            className={`flex-row items-center justify-center py-2.5 rounded-lg ${isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
              }`}
          >
            <FileText size={16} color={isDark ? '#60a5fa' : '#3b82f6'} />
            <Text className={`ml-2 font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Materials
            </Text>
          </Pressable>

          {/* Book Slot Button - Only for booking type tests */}
          {String(getTestType(test)).toLowerCase() === 'booking' && (
            <Pressable
              onPress={(e: any) => {
                e?.stopPropagation?.();
                router.push(`/tests/book-test?id=${test.id}` as any);
              }}
              className={`flex-row items-center justify-center py-2.5 rounded-lg ${isDark ? 'bg-purple-900/30 border border-purple-700' : 'bg-purple-50 border border-purple-200'
                }`}
            >
              <Calendar size={16} color={isDark ? '#c084fc' : '#9333ea'} />
              <Text className={`ml-2 font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                Book Slot
              </Text>
            </Pressable>
          )}
        </View>

        {/* Take Test / Review Buttons */}
        <View className="flex-row gap-2">
          {maxAttemptsReached ? (
            <View className="flex-1">
              <View className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                <Text className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-800'} mb-1`}>
                  Maximum Attempts Reached
                </Text>
                <Text className={`text-xs ${isDark ? 'text-orange-200' : 'text-orange-700'}`}>
                  You have reached the maximum number of attempts ({test.max_attempts}) for this test
                </Text>
              </View>
              <Pressable
                onPress={(e: any) => {
                  e?.stopPropagation?.();
                  router.push(`/tests/test-details?id=${test.id}` as any);
                }}
                className="flex-1 bg-blue-500 rounded-lg py-3"
              >
                <Text className="text-white font-semibold text-center">View Reports</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={(e: any) => {
                e?.stopPropagation?.();
                if (!test.is_active) {
                  showToast.error('This test is currently not active', { title: 'Test Inactive' });
                  return;
                }
                if (testCanBeTaken) {
                  router.push(`/tests/take-test?id=${test.id}` as any);
                } else if (test.test_type === 'booking') {
                  showToast.warning('Please book a slot first', { title: 'Booking Required' });
                  router.push(`/tests/book-test?id=${test.id}` as any);
                } else {
                  showToast.error('Test is not available at this time', { title: 'Cannot Take Test' });
                }
              }}
              disabled={!test.is_active}
              className={`flex-1 rounded-lg py-3 flex-row items-center justify-center ${testCanBeTaken && test.is_active ? 'bg-green-500' : 'bg-gray-400'
                }`}
            >
              {testCanBeTaken && test.is_active ? (
                <>
                  <PlayCircle size={18} color="white" />
                  <Text className="text-white font-semibold text-center ml-2">Take Test</Text>
                </>
              ) : (
                <>
                  <AlertCircle size={18} color="white" />
                  <Text className="text-white font-semibold text-center ml-2">
                    {!test.is_active ? 'Inactive' : 'Book Slot'}
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className={`${isWeb ? 'px-8 pt-8' : 'px-4 pt-6'} pb-4`}>
        <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Tests
        </Text>
        <Text className={`mt-1 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Browse and take tests
        </Text>
      </View>

      {/* Search Bar */}
      <View className={isWeb ? 'px-8 mb-4' : 'px-4 mb-4'}>
        <View
          className={`flex-row items-center px-4 py-1 sm:py-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'
            } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <Search size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          <TextInput
            placeholder="Search tests..."
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`flex-1 ml-3 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
          />
        </View>
      </View>

      {/* Tabs */}
      <View className={isWeb ? 'px-8 mb-4' : 'px-4 mb-4'}>
        <View className="flex-row gap-2 mb-4">
          <TabButton
            title="Available"
            isActive={activeTab === 'available'}
            onPress={() => setActiveTab('available')}
          />
          <TabButton
            title="Completed"
            isActive={activeTab === 'completed'}
            onPress={() => setActiveTab('completed')}
          />
        </View>

        {/* Type filters */}
        <View className="flex-row gap-2 mt-3">
          {[
            { key: 'all', label: 'All' },
            { key: 'instant', label: 'Instant' },
            { key: 'booking', label: 'Booking' },
            { key: 'timed', label: 'Timed' },
            { key: 'booked', label: 'Booked' },
          ].map(f => (
            <Pressable
              key={f.key}
              onPress={() => setTypeFilter(f.key as any)}
              className={`px-3 py-2 rounded-lg ${typeFilter === f.key ? 'bg-blue-500' : isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
            >
              <Text className={`${typeFilter === f.key ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Test List with Loading States */}
      <LoadingState
        loading={loading}
        error={error}
        empty={filteredTests.length === 0}
        emptyMessage={activeTab === 'available' ? "No available tests" : "No completed tests"}
        emptyIcon="filter-outline"
        onRetry={fetchTests}
        skeleton="list"
      >
        <ScrollView
          className={`flex-1 ${isWeb ? 'px-4' : 'px-2'}`}
          contentContainerStyle={{
            paddingBottom: isWeb && isLargeScreen ? 32 : 90, // Extra padding for bottom nav on mobile
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
          }
        >
          <View
            className="flex-row flex-wrap"
            style={{
              gap: 12,
              justifyContent: isWeb ? 'flex-start' : 'center'
            }}
          >
            {filteredTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </View>
        </ScrollView>
      </LoadingState>
    </View>
  );
}
