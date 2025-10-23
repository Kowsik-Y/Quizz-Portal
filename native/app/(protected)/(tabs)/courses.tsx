import { View, ScrollView, TextInput, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Search } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { CourseCard } from '@/components/CourseCard';
import { useCourseStore } from '@/stores/courseStore';

export default function CoursesPage() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const isWeb = Platform.OS === 'web';

  // Select specific store values to avoid recreating fetchCourses on each render
  const courses = useCourseStore(state => state.courses);
  const loading = useCourseStore(state => state.loading);
  const error = useCourseStore(state => state.error);
  const fetchCourses = useCourseStore(state => state.fetchCourses);

  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth > 1024;
  const isMediumScreen = screenWidth > 768;

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

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
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="px-4 pt-4 sm:px-8 sm:pt-8 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Courses
            </Text>
            <Text className={`mt-1 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Select a course to view materials and book slots
            </Text>
          </View>
        </View>
      </View>
      {/* Search Bar */}
      <View className='px-4 mb-6 sm:px-8 sm:mb-6'>
        <View
          className='flex-row items-center px-4 py-1 sm:py-3 rounded-lg dark:bg-gray-800 bg-white border dark:border-gray-700 border-gray-200'
        >
          <Search size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          <TextInput
            placeholder="Search courses..."
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`flex-1 ml-3 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
          />
        </View>
      </View>

      {/* Course Cards */}
      <ScrollView
        className='flex-1 sm:px-8 px-4'
        contentContainerStyle={{
          paddingBottom: isWeb && isLargeScreen ? 32 : 90, // Extra padding for bottom nav on mobile
        }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#3b82f6'} />
            <Text className='mt-4 dark:text-gray-400 text-gray-600'>
              Loading courses...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className={`text-base ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </Text>
            <Text
              className='mt-2 text-sm dark:text-blue-400 text-blue-600'
              onPress={() => fetchCourses(true)}
            >
              Tap to retry
            </Text>
          </View>
        ) : filteredCourses.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className='text-base dark:text-gray-400 text-gray-600'>
              {searchQuery ? 'No courses found matching your search' : 'No courses available'}
            </Text>
          </View>
        ) : (
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
        )}
      </ScrollView>
    </View>
  );
}
