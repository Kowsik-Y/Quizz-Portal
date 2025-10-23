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
import { Button } from '@/components/ui/button';

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

  // User stats (with real data from Zustand)
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

  // Stat card component
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

  // Course card component with full width grid support
  const CourseCard = ({ course }: any) => {
    const hasCode = course.test_count > 0; // Check if course has coding tests
    console.log(course);
    return (
      <Pressable
        onPress={() => router.push({
          pathname: '/courses/course-details',
          params: { id: course.id }
        } as any)}
        className={`rounded-2xl p-5 mb-4 w-full md:w-[calc(50%-12px)] xl:w-[calc(33.333%-12px)] flex-wrap ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
      >
        <View className='items-stretch w-full'>
          {/* Department Badge */}

          {course.department_code && (
            <View className="flex-row items-center">
              <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {course.department_code}
                </Text>
              </View>
            </View>
          )}

          {/* Course Title */}

          <Text
            className={`text-lg mb-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
            numberOfLines={2}
          >
            {course.title}
          </Text>

          {/* Course Code */}
          {course.code && (
            <Text className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {course.code}
            </Text>
          )}

          {/* Description */}
          {course.description && (
            <Text
              className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              numberOfLines={2}
            >
              {course.description}
            </Text>
          )}

          {/* Course Info */}
          <View className="flex-row flex-wrap gap-3 mb-3">
            {/* Tests Count */}
            <View className="flex-row items-center">
              <FileText size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`ml-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {course.test_count || 0} Tests
              </Text>
            </View>

            {/* Has Code Compiler Badge */}
            {hasCode && (
              <View className="flex-row items-center bg-green-500/20 px-2 py-1 rounded">
                <Code2 size={12} color="#10b981" />
                <Text className="text-green-500 text-xs font-medium ml-1">Code</Text>
              </View>
            )}

            {/* Semester */}
            {course.semester && (
              <View className="flex-row items-center">
                <Clock size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Sem {course.semester}
                </Text>
              </View>
            )}

          </View>

          {/* Teacher Info */}
          {course.teacher_name && (
            <View className="flex-row items-center justify-between pt-3 w-full border-t border-gray-700/50">
              <View className="flex-row items-center">
                <GraduationCap size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {course.teacher_name}
                </Text>
              </View>
              <ChevronRight size={16} color="#3b82f6" />
            </View>
          )}
        </View>
      </Pressable>
    );
  };
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

        {/* Quick Actions - Teacher/Admin Only */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <View className="mb-6">
            <Text
              className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
            >
              QUICK ACTIONS
            </Text>
            <View className="flex-row gap-3">
              <Button variant={'default'} size={'lg'} ><Text>Hello</Text></Button>
              <Pressable
                onPress={() => router.push('/courses/create-course')}
                className="flex-1 bg-blue-500 rounded-xl p-4 flex-row items-center justify-center"
              >
                <BookOpen size={20} color="#fff" />
                <Text className="text-white font-bold ml-2">Create Course</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/tests/create-test')}
                className="flex-1 bg-green-500 rounded-xl p-4 flex-row items-center justify-center"
              >
                <FileText size={20} color="#fff" />
                <Text className="text-white font-bold ml-2">Create Test</Text>
              </Pressable>
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

        {/* Achievement Banner */}
        {user?.role === 'student' && (
          <View className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6">
            <View className="flex-row items-center">
              <View className="bg-white/20 rounded-full p-3">
                <Zap size={24} color="#fff" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-white font-bold text-lg">Keep Going!</Text>
                <Text className="text-white/80 text-sm mt-1">
                  You're on a 7-day streak. Complete one more quiz today!
                </Text>
              </View>
              <CheckCircle2 size={32} color="#fff" />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
