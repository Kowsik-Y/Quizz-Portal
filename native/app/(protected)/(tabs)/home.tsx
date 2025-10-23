import React, { memo } from 'react';
import { View, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  TrendingUp,
  Clock,
  Code2,
  FileText,
  Award,
  Zap,
  CheckCircle2,
  ChevronRight
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
// Zustand stores
import { useAuthStore } from '@/stores/authStore';
import { useCourseStore } from '@/stores/courseStore';
import { useUserStore } from '@/stores/userStore';
import { User } from '@/lib/types';

export default function HomePage() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';

  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth > 768;

  // Zustand stores
  const user: User | null = useAuthStore((state) => state.user);
  const { courses, loading, fetchCourses, refreshData } = useCourseStore();
  const { stats: userStats, fetchStats } = useUserStore();

  // Fetch data on mount
  useEffect(() => {
    fetchCourses();
    if (user?.role === 'student') {
      fetchStats();
    }
  }, [user, fetchCourses, fetchStats]);

  const stats = [
    {
      icon: BookOpen,
      label: 'Courses',
      value: userStats?.coursesEnrolled || courses.length,
      color: '#3b82f6'
    },
    {
      icon: Trophy,
      label: 'Score',
      value: userStats?.averageScore ? `${Math.round(userStats.averageScore)}%` : '0%',
      color: '#10b981'
    },
    {
      icon: TrendingUp,
      label: 'Streak',
      value: userStats?.streak ? `${userStats.streak}d` : '0d',
      color: '#f59e0b'
    },
    {
      icon: Award,
      label: 'Rank',
      value: userStats?.rank ? `#${userStats.rank}` : '-',
      color: '#8b5cf6'
    },
  ];

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <View
      className={`flex-1 rounded-xl p-4 w-full ${isDark ? 'bg-gray-800' : 'bg-white'
        } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
    >
      <Icon size={20} color={color} />
      <Text className={`mt-2 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </Text>
      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</Text>
    </View>
  );

  const CourseCard = memo(({ course }: any) => {
    const hasCode = (course?.test_count || 0) > 0;

    const handlePress = () => {
      router.push({ pathname: '/courses/course-details', params: { id: course.id } } as any);
    };

    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${course.title} course card`}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className={`rounded-2xl p-4 mb-4 w-full md:w-[calc(50%-12px)] xl:w-[calc(33.333%-12px)] ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
      >
        <View className="w-full">
          <View className="flex-row justify-between items-start">
            <View style={{ flex: 1 }}>
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={2}>
                {course.title}
              </Text>
            </View>

            {course.department_code && (
              <View className={`ml-3 px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{course.department_code}</Text>
              </View>
            )}
          </View>

          {course.description && (
            <Text className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={2}>
              {course.description}
            </Text>
          )}

          <View className="flex-row flex-wrap items-center gap-3 mt-3">
            <View className="flex-row items-center">
              <FileText size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`ml-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{course.test_count || 0} Tests</Text>
            </View>

            {hasCode && (
              <View className="flex-row items-center bg-green-500/10 px-2 py-1 rounded">
                <Code2 size={12} color="#10b981" />
                <Text className="text-green-500 text-xs font-medium ml-1">Code</Text>
              </View>
            )}

            {course.semester && (
              <View className="flex-row items-center">
                <Clock size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sem {course.semester}</Text>
              </View>
            )}
          </View>

          {course.teacher_name && (
            <View className="flex-row items-center justify-between pt-3 w-full border-t mt-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
              <View className="flex-row items-center">
                <GraduationCap size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{course.teacher_name}</Text>
              </View>
              <ChevronRight size={16} color="#3b82f6" />
            </View>
          )}
        </View>
      </Pressable>
    );
  });
  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView
        className={`flex-1 ${isWeb ? 'px-8' : 'px-4'}`}
        contentContainerStyle={{
          paddingBottom: isWeb && isLargeScreen ? 32 : 90, // Extra padding for bottom nav on mobile
        }}
      >
        {/* Header */}
        <View className={isWeb ? 'pt-8 pb-6' : 'pt-6 pb-4'}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.role === 'teacher' ? 'My Courses' : user?.role === 'admin' ? 'All Courses' : 'My Learning'}
              </Text>
              <Text className={`mt-1 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Welcome back, {user?.name || 'Guest'}!
              </Text>
            </View>
            {/* Role Badge */}
            {user?.role && (
              <View
                className={`px-4 py-2 rounded-full ${user.role === 'admin'
                  ? 'bg-purple-500/20'
                  : user.role === 'teacher'
                    ? 'bg-green-500/20'
                    : 'bg-blue-500/20'
                  }`}
              >
                <Text
                  className={`text-sm font-bold ${user.role === 'admin'
                    ? 'text-purple-500'
                    : user.role === 'teacher'
                      ? 'text-green-500'
                      : 'text-blue-500'
                    }`}
                >
                  {user.role.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Department Info */}
          {user?.department.id && (
            <View className="mt-3 flex-row items-center">
              <View className="bg-blue-500/10 px-3 py-1.5 rounded-lg">
                <Text className="text-blue-500 text-sm font-semibold">
                  {user.department.code} - {user.department.name}
                </Text>
              </View>
              {user.roll_number && (
                <View className="ml-2 bg-gray-700/50 px-3 py-1.5 rounded-lg">
                  <Text className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Roll: {user.roll_number}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Stats - Only for Students */}
        {user?.role === 'student' && (
          <View className="mb-6">
            <Text
              className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
            >
              YOUR PERFORMANCE
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {stats.map((stat, index) => (
                <View
                  key={index}
                  className="w-[48%] md:w-[32%] lg:w-[24%]"
                >
                  <StatCard {...stat} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Courses Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              {user?.role === 'teacher'
                ? 'YOUR COURSES'
                : user?.role === 'admin'
                  ? 'ALL COURSES'
                  : 'AVAILABLE COURSES'}
            </Text>
            <Pressable onPress={() => refreshData()}>
              <Text className="text-blue-500 font-semibold text-sm">Refresh</Text>
            </Pressable>
          </View>

          {/* Loading State */}
          {loading && (
            <View className="items-center py-8">
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading courses...
              </Text>
            </View>
          )}

          {/* Empty State */}
          {!loading && courses.length === 0 && (
            <View className={`rounded-2xl p-8 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <BookOpen size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
              <Text className={`mt-4 text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                No Courses Yet
              </Text>
              <Text className={`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {user?.role === 'teacher'
                  ? 'Create your first course to get started'
                  : 'Check back soon for new courses'}
              </Text>
              {user?.role === 'teacher' && (
                <Pressable
                  onPress={() => router.push('/courses/create-course')}
                  className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
                >
                  <Text className="text-white font-semibold">Create Course</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Courses Grid */}
          {!loading && courses.length > 0 && (
            <View
              className="flex-row flex-wrap"
              style={{
                gap: 12,
                justifyContent: isWeb ? 'flex-start' : 'center'
              }}
            >
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
