import { View, ScrollView, Platform, Dimensions, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { Search } from 'lucide-react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTestStore } from '@/stores/testStore';
import { LoadingState } from '@/components/LoadingState';
import { TestCard } from '@/components/TestCard';
import { TabButton } from '@/components/ui/tab-button';
import { TestFilters } from '@/components/TestFilters';
import { Input } from '@/components';

export default function TestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const isWeb = Platform.OS === 'web';

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
  const isMediumScreen = screenWidth > 640 && screenWidth <= 768;
  const numColumns = isWeb ? (isLargeScreen ? 3 : isMediumScreen ? 2 : 1) : 1;


  const [typeFilter, setTypeFilter] = useState<'all' | 'instant' | 'booking' | 'timed' | 'booked'>('all');

  useEffect(() => {
    fetchTests();
    fetchMyBookings();
  }, [fetchTests, fetchMyBookings]);

  const getTestType = (test: any) => {
    const t = test.test_type || test.type || test.mode || test.testType || test.mode_type;
    if (t) return t;
    if (test.booking_required || test.is_booking) return 'booking';
    if (test.test_mode === 'instant') return 'instant';
    if (test.duration_minutes || test.duration || test.duration_min) return 'timed';
    return 'timed';
  };

  // Check if test can be taken
  const canTakeTest = useCallback((test: any) => {
    if (!test.is_active) return false;

    // CRITICAL: Check if user has reached max attempts - if yes, test CANNOT be taken
    if (test.max_attempts && test.user_attempts !== undefined && test.user_attempts !== null) {
      const maxAttempts = Number(test.max_attempts);
      const userAttempts = Number(test.user_attempts);

      if (userAttempts >= maxAttempts) {
        console.log(`❌ Cannot take test "${test.title}" - Max attempts reached:`, {
          userAttempts,
          maxAttempts
        });
        return false;
      }
    }

    const tType = getTestType(test);
    if (String(tType).toLowerCase() === 'instant') return true;
    if (String(tType).toLowerCase() === 'booking') {
      return bookings.some((b: any) => (b.test_id === test.id || b.test?.id === test.id) && b.status !== 'cancelled');
    }
    return true;
  }, [bookings]);

  // Check if test is completed (reached maximum attempts)
  const isTestCompleted = useCallback((test: any) => {
    // If test has max_attempts defined and user_attempts data is available
    if (test.max_attempts && test.user_attempts !== undefined && test.user_attempts !== null) {
      const maxAttempts = Number(test.max_attempts);
      const userAttempts = Number(test.user_attempts);
      const isCompleted = userAttempts >= maxAttempts;

      if (isCompleted) {
        console.log(`✅ Test "${test.title}" is COMPLETED:`, {
          userAttempts,
          maxAttempts,
          remaining: maxAttempts - userAttempts
        });
      }

      return isCompleted;
    }

    return false;
  }, []);

  // Filter tests based on search and type filter (memoized for performance)
  const filteredTests = useMemo(() => {
    if (!Array.isArray(tests)) return [];

    return tests.filter(test => {
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
    });
  }, [tests, searchQuery, activeTab, typeFilter, bookings, isTestCompleted]);

  return (
    <View className="flex-1 bg-background">
      <View className={`${isWeb ? 'px-8 pt-8' : 'px-4 pt-6'} pb-4`}>
        <Text className="text-3xl font-bold text-foreground">
          Tests
        </Text>
        <Text className="mt-1 text-base text-muted-foreground">
          Browse and take tests
        </Text>
      </View>

      {/* Search Bar */}
      <View className='px-4 mb-4 sm:px-8 sm:mb-6'>
        <Input
          leftIcon={Search}
          placeholder="Search tests..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          iconColor='#6b7280'
          onChangeText={setSearchQuery}

          className="text-sm sm:text-base text-foreground rounded-lg bg-card border border-border"
        />
      </View>

      {/* Tabs */}
      <View className='px-4 mb-3 sm:px-8 sm:mb-4 '>
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
        <TestFilters activeFilter={typeFilter} onFilterChange={setTypeFilter} />
      </View>

      {/* Test List with Loading States */}
      <LoadingState
        loading={loading}
        error={error}
        empty={filteredTests.length === 0}
        emptyMessage={activeTab === 'available' ? "No available tests" : "No completed tests"}
        emptyIcon="filter-outline"
        onRetry={fetchTests}
        skeleton="test"
      >
        <ScrollView
          className={`flex-1 ${isWeb ? 'px-4 dark' : 'px-2'}`}
          contentContainerStyle={{
            paddingBottom: isWeb && isLargeScreen ? 32 : 90, // Extra padding for bottom nav on mobile
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
          }
        >
          <View
            className={isWeb ? "flex-row flex-wrap drak" : "w-full"}
            style={isWeb ? {
              gap: 12,
              justifyContent: 'flex-start'
            } : undefined}
          >
            {filteredTests.map((test) => {
              const isCompleted = isTestCompleted(test);
              const testCanBeTaken = canTakeTest(test);
              // Check max attempts: either from user_attempts or canTakeTest logic
              const maxAttemptsReached = Boolean(
                test.max_attempts && (
                  (test.user_attempts !== undefined && test.user_attempts >= test.max_attempts) ||
                  !testCanBeTaken
                )
              );
              const testType = getTestType(test);

              // Debug logging for first test
              if (filteredTests.indexOf(test) === 0) {
                console.log('Test debug:', {
                  id: test.id,
                  title: test.title,
                  max_attempts: test.max_attempts,
                  user_attempts: test.user_attempts,
                  isCompleted,
                  testCanBeTaken,
                  maxAttemptsReached,
                  activeTab
                });
              }

              return (
                <TestCard
                  key={test.id}
                  test={test}
                  canTakeTest={testCanBeTaken}
                  isCompleted={isCompleted}
                  maxAttemptsReached={maxAttemptsReached}
                  testType={String(testType).toLowerCase()}
                  numColumns={numColumns}
                />
              );
            })}
          </View>
        </ScrollView>
      </LoadingState>
    </View>
  );
}