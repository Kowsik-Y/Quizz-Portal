import { View, ScrollView, Pressable, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import {
   ClipboardList, PlusCircle, Edit2, Trash2, Power
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useCourseStore } from '@/stores/courseStore';
import { testAPI, courseAPI } from '@/lib/api';
import type { Test } from '@/lib/types';
import { useCustomAlert } from '@/components/ui/custom-alert';

export default function CourseDetailsPage() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const { currentCourse, loading, error, fetchCourseById } = useCourseStore();
  const { showAlert } = useCustomAlert();

  // State for tests (not in store yet)
  const [tests, setTests] = useState<Test[]>([]);
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [deletingTest, setDeletingTest] = useState<number | null>(null);
  const [togglingCourse, setTogglingCourse] = useState(false);
  const [togglingTest, setTogglingTest] = useState<number | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth > 1024;
  const isMediumScreen = screenWidth > 768;

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const loadCourseData = async () => {
    if (id) {
      await fetchCourseById(Number(id));

      try {
        const testsResponse = await testAPI.getByCourse(Number(id));
        setTests(testsResponse.data.tests || []);
      } catch (err) {
        showAlert('Error', 'Failed to load tests. Please try again.');
      }
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [id]);

  const handleDeleteCourse = () => {
    showAlert(
      'Delete Course',
      'Are you sure you want to delete this course? This will also delete all associated tests, questions, and student attempts. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingCourse(true);
              await courseAPI.delete(Number(id));
              showAlert(
                'Success',
                'Course deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(tabs)' as any)
                  }
                ]
              );
            } catch (error: any) {
              const errorMessage = error.response?.data?.error || 'Failed to delete course';
              showAlert('Error', errorMessage);
            } finally {
              setDeletingCourse(false);
            }
          }
        }
      ]
    );
  };

  // Handle course active/inactive toggle
  const handleToggleCourseActive = async () => {
    try {
      setTogglingCourse(true);
      const newStatus = !currentCourse?.is_active;
      await courseAPI.update(Number(id), { is_active: newStatus } as any);
      showAlert(
        'Success',
        `Course ${newStatus ? 'activated' : 'deactivated'} successfully!`
      );
      // Reload course data
      await loadCourseData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update course status';
      showAlert('Error', errorMessage);
    } finally {
      setTogglingCourse(false);
    }
  };

  // Handle test deletion
  const handleDeleteTest = (testId: number, testTitle: string) => {
    showAlert(
      'Delete Test',
      `Are you sure you want to delete "${testTitle}"? This will also delete all associated questions and student attempts. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingTest(testId);
              await testAPI.delete(testId);
              showAlert('Success', 'Test deleted successfully!');
              // Refresh tests list
              await loadCourseData();
            } catch (error: any) {
              const errorMessage = error.response?.data?.error || 'Failed to delete test';
              showAlert('Error', errorMessage);
            } finally {
              setDeletingTest(null);
            }
          }
        }
      ]
    );
  };

  // Handle test active/inactive toggle
  const handleToggleTestActive = async (testId: number, currentStatus: boolean) => {
    try {
      setTogglingTest(testId);
      const newStatus = !currentStatus;
      await testAPI.update(testId, { is_active: newStatus } as any);
      showAlert(
        'Success',
        `Test ${newStatus ? 'activated' : 'deactivated'} successfully!`
      );
      // Refresh tests list
      await loadCourseData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update test status';
      showAlert('Error', errorMessage);
    } finally {
      setTogglingTest(null);
    }
  };

  const TestCard = ({ test }: { test: Test }) => {
    const isInactive = !test.is_active;

    return (
      <View
        className={`rounded-xl p-5 mb-4 ${isInactive
          ? isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-100 border border-gray-300'
          : isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        style={{
          width: isWeb ? (isLargeScreen ? '32%' : isMediumScreen ? '48.5%' : '100%') : '100%',
          opacity: isInactive ? 0.7 : 1,
        }}
      >
        <Pressable
          onPress={() => router.push(`/tests/test-details?id=${test.id}`)}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <ClipboardList
                size={24}
                color={isInactive ? '#9ca3af' : (isDark ? '#60a5fa' : '#3b82f6')}
              />
              <Text
                className={`ml-3 text-lg font-bold ${isInactive
                  ? 'text-gray-500'
                  : isDark ? 'text-white' : 'text-gray-900'
                  }`}
                numberOfLines={1}
              >
                {test.title}
              </Text>
            </View>

            {/* Action Buttons (Admin/Teacher) */}
            {isTeacherOrAdmin && (
              <View className="flex-row gap-2 ml-2">
                {/* Active/Inactive Toggle */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleTestActive(test.id, test.is_active);
                  }}
                  disabled={togglingTest === test.id}
                  className={`p-2 rounded-lg ${togglingTest === test.id
                    ? isDark ? 'bg-gray-700' : 'bg-gray-300'
                    : test.is_active
                      ? isDark ? 'bg-green-900/30' : 'bg-green-50'
                      : isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                >
                  {togglingTest === test.id ? (
                    <ActivityIndicator size="small" color={test.is_active ? '#10b981' : '#6b7280'} />
                  ) : (
                    <Power size={16} color={test.is_active ? '#10b981' : '#6b7280'} />
                  )}
                </Pressable>

                {/* Edit Button */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/tests/edit-test?id=${test.id}` as any);
                  }}
                  className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'
                    }`}
                >
                  <Edit2 size={16} color={isDark ? '#60a5fa' : '#3b82f6'} />
                </Pressable>

                {/* Delete Button (Admin only) */}
                {isAdmin && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteTest(test.id, test.title);
                    }}
                    disabled={deletingTest === test.id}
                    className={`p-2 rounded-lg ${deletingTest === test.id
                      ? isDark ? 'bg-gray-700' : 'bg-gray-300'
                      : isDark ? 'bg-red-900/30' : 'bg-red-50'
                      }`}
                  >
                    {deletingTest === test.id ? (
                      <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                      <Trash2 size={16} color="#ef4444" />
                    )}
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {test.description && (
            <Text className={`mb-3 text-sm ${isInactive
              ? 'text-gray-500'
              : isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
              {test.description}
            </Text>
          )}
          <View className="flex-row flex-wrap gap-2">
            {/* Active Status Badge */}
            <View className={`px-3 py-1 rounded-full ${test.is_active
              ? isDark ? 'bg-green-900/30' : 'bg-green-100'
              : isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
              <Text className={`text-xs font-semibold ${test.is_active
                ? isDark ? 'text-green-300' : 'text-green-700'
                : isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                {test.is_active ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Text className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {test.quiz_type?.toUpperCase() || 'MIXED'}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
              <Text className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                {test.test_type ? (test.test_type.charAt(0).toUpperCase() + test.test_type.slice(1)) : 'Instant'}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
              <Text className={`text-xs ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                {test.duration_minutes} min
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
              <Text className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                {test.total_marks} marks
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView>
        <View className={`${isWeb ? 'px-8 pt-8' : 'px-4 pt-6'} pb-4`}>

          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-2">
                <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentCourse?.title || name || 'Course Details'}
                </Text>
                {currentCourse && (
                  <View className={`px-3 py-1 rounded-full ${currentCourse.is_active
                    ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                    : isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                    <Text className={`text-xs font-semibold ${currentCourse.is_active
                      ? isDark ? 'text-green-300' : 'text-green-700'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      {currentCourse.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                )}
              </View>
              <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentCourse?.description || 'View available tests for this course'}
              </Text>
            </View>

            {/* Action Buttons (Admin/Teacher) */}
            {isTeacherOrAdmin && currentCourse && (
              <View className="flex-row gap-2 ml-4">
                {/* Active/Inactive Toggle */}
                <Pressable
                  onPress={() => handleToggleCourseActive()}
                  disabled={togglingCourse}
                  className={`p-3 rounded-lg ${togglingCourse
                    ? isDark ? 'bg-gray-700' : 'bg-gray-300'
                    : currentCourse.is_active
                      ? isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
                      : isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-200 border border-gray-300'
                    }`}
                >
                  {togglingCourse ? (
                    <ActivityIndicator size="small" color={currentCourse.is_active ? '#10b981' : '#6b7280'} />
                  ) : (
                    <Power size={20} color={currentCourse.is_active ? '#10b981' : '#6b7280'} />
                  )}
                </Pressable>

                {/* Edit Button */}
                <Pressable
                  onPress={() => router.push({
                    pathname: '/courses/edit-course',
                    params: {
                      courseId: id,
                      title: currentCourse.title,
                      description: currentCourse.description || '',
                      department_id: currentCourse.department_id
                    }
                  } as any)}
                  className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                    }`}
                >
                  <Edit2 size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                </Pressable>

                {/* Delete Button (Admin only) */}
                {isAdmin && (
                  <Pressable
                    onPress={() => handleDeleteCourse()}
                    disabled={deletingCourse}
                    className={`p-3 rounded-lg ${deletingCourse
                      ? isDark ? 'bg-gray-700' : 'bg-gray-300'
                      : isDark ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
                      }`}
                  >
                    {deletingCourse ? (
                      <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                      <Trash2 size={20} color="#ef4444" />
                    )}
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Loading State */}
        {loading && (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className={`mt-4 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading course details...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View className="flex-1 items-center justify-center px-6 py-20">
            <View className={`rounded-xl p-6 ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                Failed to load course
              </Text>
              <Text className={`text-base mb-4 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                {error}
              </Text>
              <Pressable
                onPress={loadCourseData}
                className="bg-blue-500 rounded-lg py-3 px-6"
              >
                <Text className="text-white font-semibold text-center">
                  Try Again
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Content - Only show when not loading and no error */}
        {!loading && !error && (
          <>
            {/* Create Test Button for Teachers/Admins */}
            {isTeacherOrAdmin && (
              <View className={isWeb ? 'px-8 mb-4' : 'px-4 mb-4'}>
                <Pressable
                  onPress={() => router.push({
                    pathname: '/tests/create-test',
                    params: {
                      courseId: id,
                      courseName: currentCourse?.title || name
                    }
                  } as any)}
                  className="bg-blue-500 rounded-xl py-4 px-6 flex-row items-center justify-center"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <PlusCircle size={20} color="#ffffff" />
                  <Text className="text-white font-bold text-base ml-2">
                    Create Test for this Course
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Content */}
            <ScrollView className={`flex-1 ${isWeb ? 'px-8' : 'px-4'}`}>
              {/* Tests Section */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Available Tests
                  </Text>
                  {isTeacherOrAdmin && tests.some(t => !t.is_active) && (
                    <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'
                      }`}>
                      <Text className={`text-xs font-semibold ${isDark ? 'text-yellow-300' : 'text-yellow-700'
                        }`}>
                        {tests.filter(t => !t.is_active).length} Inactive
                      </Text>
                    </View>
                  )}
                </View>

                {/* Info for Teachers/Admins about inactive tests */}
                {isTeacherOrAdmin && tests.some(t => !t.is_active) && (
                  <View className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                    }`}>
                    <Text className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                      💡 <Text className="font-semibold">Note:</Text> Inactive tests are shown below with reduced opacity.
                      Students cannot see inactive tests. Click the power button to toggle test visibility.
                    </Text>
                  </View>
                )}

                <View
                  className="flex-row flex-wrap"
                  style={{
                    gap: 12,
                    justifyContent: isWeb ? 'flex-start' : 'center'
                  }}
                >
                  {tests.length > 0 ? (
                    tests.map(test => (
                      <TestCard key={test.id} test={test} />
                    ))
                  ) : (
                    <View className="w-full items-center py-12">
                      <ClipboardList size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                      <Text className={`mt-4 text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No tests available yet
                      </Text>
                      <Text className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {isTeacherOrAdmin ? 'Create a test to get started' : 'Check back later for tests'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="h-4" />
            </ScrollView>
          </>
        )}
      </ScrollView>
    </View>
  );
}

