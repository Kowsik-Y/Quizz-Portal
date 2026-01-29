import React, { useEffect } from 'react';
import { View, ScrollView, Platform, Dimensions } from 'react-native';

import { Text } from '@/components/ui/text';

import {
  BookOpen,
  Trophy,
  TrendingUp,
  Award,
} from 'lucide-react-native';


import { useAuthStore } from '@/stores/authStore';
import { useCourseStore } from '@/stores/courseStore';
import { useUserStore } from '@/stores/userStore';
import { User } from '@/lib/types';
import { Badge, CourseCard, StatCard } from '@/components';
import { LoadingState } from '@/components/LoadingState';
import { NotificationBell } from '@/components/NotificationBell';

export default function HomePage() {
  const isWeb = Platform.OS === 'web';

  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth > 1024;
  const isMediumScreen = screenWidth > 768;


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

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className={`flex-1 ${isWeb ? 'px-8' : 'px-4'}`}
        contentContainerStyle={{
          paddingBottom: isWeb && isLargeScreen ? 32 : 90, // Extra padding for bottom nav on mobile
        }}
      >
        {/* Header */}
        <View className={isWeb ? 'pt-8 pb-6' : 'pt-6 pb-4'}>
          <View className='flex justify-end flex-row flex-1 mb-5 mr-3'>

          <NotificationBell iconSize={22} iconColor="#6b7280" />
          </View>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-foreground">
                {user?.role === 'teacher' ? 'My Courses' : user?.role === 'admin' ? 'All Courses' : 'My Learning'}
              </Text>
              <Text className="mt-1 text-base text-muted-foreground">
                Welcome back, {user?.name || 'Guest'}!
              </Text>
            </View>
            {/* Role Badge */}
            {user?.role && (
              <Badge variant='default' size="lg"
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
              </Badge>
            )}
          </View>

          {/* Department Info */}
          {user?.department.id && (
            <Badge variant='info' className='self-start mt-2 py-2 px-4' >
              {user.department.code} - {user.department.name}
              {user.roll_number && (
                ` | Roll: ${user.roll_number}`
              )}
            </Badge>
          )}
        </View>

        {/* Stats - Only for Students */}
        {user?.role === 'student' && (
          <View className="mb-6">
            <Text className="text-sm font-semibold mb-3 text-foreground/70">
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


            <Text className="text-sm font-semibold text-foreground">
              {user?.role === 'teacher'
                ? 'YOUR COURSES'
                : user?.role === 'admin'
                  ? 'ALL COURSES'
                  : 'AVAILABLE COURSES'}
            </Text>
            <Text className='text-sm text-purple-500' onPress={() => refreshData()}>Refresh</Text>
          </View>

          <LoadingState
            loading={loading}
            empty={courses.length === 0}
            emptyMessage={
              user?.role !== 'student'
                ? 'Create your first course to get started'
                : 'Check back soon for new courses'
            }
            emptyIcon="school-outline"
            skeleton="test"
          >
            <View
              className="flex-row flex-wrap"
              style={{
                gap: 12,
                justifyContent: isWeb ? 'flex-start' : 'center'
              }}
            >
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  width={isWeb ? (isLargeScreen ? '32%' : isMediumScreen ? '48.5%' : '100%') : '100%'}
                />
              ))}
            </View>
          </LoadingState>
        </View>
      </ScrollView>
    </View>
  );
}
