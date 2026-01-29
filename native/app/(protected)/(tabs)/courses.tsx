import { View, ScrollView, Platform, Dimensions, Animated } from 'react-native';
import { Text } from '@/components/ui/text';
import { Search } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { CourseCard } from '@/components/CourseCard';
import { useCourseStore } from '@/stores/courseStore';
import { useAuthStore } from '@/stores/authStore';
import { LoadingState } from '@/components/LoadingState';
import { Input } from '@/components';

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const isWeb = Platform.OS === 'web';
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const courses = useCourseStore(state => state.courses);
  const loading = useCourseStore(state => state.loading);
  const error = useCourseStore(state => state.error);
  const fetchCourses = useCourseStore(state => state.fetchCourses);

  const user = useAuthStore(state => state.user);
  const userRole = user?.role || 'student';
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth > 1024;
  const isMediumScreen = screenWidth > 768;

  useEffect(() => {
    // Teachers and admins can see inactive courses
    fetchCourses(false, isTeacherOrAdmin);
  }, [fetchCourses, isTeacherOrAdmin]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  const filteredCourses = Array.isArray(courses)
    ? courses.filter(course =>
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.department_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.department_code?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4 sm:px-8 sm:pt-8 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground">
              Courses
            </Text>
            <Text className="mt-1 text-base text-muted-foreground">
              Select a course to view materials and book slots
            </Text>
          </View>
        </View>
      </View>
      {/* Search Bar */}
      <View className='px-4 mb-4 sm:px-8 sm:mb-6'>
          <Input
          leftIcon={Search}
            placeholder="Search courses..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            iconColor='#6b7280'
            onChangeText={setSearchQuery}

            className="text-sm sm:text-base text-foreground rounded-lg bg-card border border-border"
          />
      </View>

      {/* Course Cards */}
      <LoadingState
        loading={loading}
        error={error}
        empty={filteredCourses.length === 0}
        emptyMessage={searchQuery ? 'No courses found matching your search' : 'No courses available'}
        emptyIcon="school-outline"
        onRetry={() => fetchCourses(true, isTeacherOrAdmin)}
        skeleton="test"
      >
        <ScrollView
          className='flex-1 sm:px-8 px-4'
          contentContainerStyle={{
            paddingBottom: isWeb && isLargeScreen ? 32 : 90, // Extra padding for bottom nav on mobile
          }}
        >
          <View
            className="flex-row flex-wrap"
            style={{
              gap: 12,
              justifyContent: isWeb ? 'flex-start' : 'center'
            }}
          >
            {filteredCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                width={isWeb ? (isLargeScreen ? '32%' : isMediumScreen ? '48.5%' : '100%') : '100%'}
                variant="detailed"
              />
            ))}
          </View>
        </ScrollView>
      </LoadingState>
    </View>
  );
}
