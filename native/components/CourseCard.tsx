import React, { memo, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Code,
  ChevronRight,
  Users,
  BookOpen,
  Clock
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';

interface CourseCardProps {
  course: {
    // Core fields
    id: number | string;
    title?: string;
    name?: string;
    course_name?: string;
    description?: string;

    // Code fields
    code?: string;
    course_code?: string;

    // IDs
    department_id?: number;
    teacher_id?: number;

    // Teacher fields
    instructor?: string;
    teacher_name?: string;
    teacher?: string;

    // Department fields
    department?: string;
    department_code?: string;
    department_name?: string;
    dept?: string;

    // Academic info
    semester?: number | string;
    sem?: number | string;
    academic_year?: string;
    year?: string;
    credit_hours?: number;

    // Counts
    students?: number;
    student_count?: number;
    materials?: number;
    material_count?: number;
    slots?: number;
    available_slots?: number;
    test_count?: number | string;
    tests?: number;

    // Status and metadata
    is_active?: boolean;
    active?: boolean;
    created_at?: string;
    updated_at?: string;

    // Colors
    color?: string;

    // Allow any additional fields
    [key: string]: any;
  };
  width?: string | number;
  variant?: 'default' | 'detailed';
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  width = '100%',
  variant = 'default'
}) => {
  const { colorScheme: theme } = useColorScheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  // Normalize course data - handle different field names from API
  const getCourseField = (course: any, ...fields: string[]) => {
    for (const field of fields) {
      if (course[field] !== undefined && course[field] !== null && course[field] !== '') {
        return course[field];
      }
    }
    return undefined;
  };

  // Convert string numbers to actual numbers
  const toNumber = (value: any) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? undefined : num;
  };

  const courseName = getCourseField(course, 'title', 'name', 'course_name') || 'Untitled Course';
  const courseCode = getCourseField(course, 'code', 'course_code');
  const instructor = getCourseField(course, 'teacher_name', 'instructor', 'teacher');
  const students = toNumber(getCourseField(course, 'students', 'student_count'));
  const materials = toNumber(getCourseField(course, 'materials', 'material_count'));
  const slots = toNumber(getCourseField(course, 'slots', 'available_slots'));
  const department = getCourseField(course, 'department_name', 'department_code', 'department', 'dept');
  const departmentCode = getCourseField(course, 'department_code', 'dept');
  const testCount = toNumber(getCourseField(course, 'test_count', 'tests'));
  const semester = getCourseField(course, 'semester', 'sem');
  const description = getCourseField(course, 'description');
  const academicYear = getCourseField(course, 'academic_year', 'year');
  const isActive = getCourseField(course, 'is_active', 'active');

  const getColorClasses = (color: string) => {
    const colors: any = {
      blue: {
        bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
        border: isDark ? 'border-blue-700' : 'border-blue-200',
        icon: '#3b82f6',
        text: isDark ? 'text-blue-400' : 'text-blue-600',
      },
      purple: {
        bg: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
        border: isDark ? 'border-purple-700' : 'border-purple-200',
        icon: '#8b5cf6',
        text: isDark ? 'text-purple-400' : 'text-purple-600',
      },
      green: {
        bg: isDark ? 'bg-green-900/30' : 'bg-green-50',
        border: isDark ? 'border-green-700' : 'border-green-200',
        icon: '#10b981',
        text: isDark ? 'text-green-400' : 'text-green-600',
      },
      orange: {
        bg: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
        border: isDark ? 'border-orange-700' : 'border-orange-200',
        icon: '#f97316',
        text: isDark ? 'text-orange-400' : 'text-orange-600',
      },
      red: {
        bg: isDark ? 'bg-red-900/30' : 'bg-red-50',
        border: isDark ? 'border-red-700' : 'border-red-200',
        icon: '#ef4444',
        text: isDark ? 'text-red-400' : 'text-red-600',
      },
      indigo: {
        bg: isDark ? 'bg-indigo-900/30' : 'bg-indigo-50',
        border: isDark ? 'border-indigo-700' : 'border-indigo-200',
        icon: '#6366f1',
        text: isDark ? 'text-indigo-400' : 'text-indigo-600',
      },
    };
    return colors[color] || colors.blue;
  };

  const colorConfig = getColorClasses((course.color || 'blue').toString());

  const handlePress = () => {
    router.push({
      pathname: '/courses/course-details',
      params: { id: course.id, name: courseName }
    } as any);
  };

  const onPress = (course as any).onPress || handlePress;

  // (no avatar anymore; simplified instructor display)

  if (variant === 'detailed') {
    // Detailed variant used in home page
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${courseName} course card`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className={`rounded-2xl p-5 mb-4 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
        style={{ width: width as any, opacity: isActive === false ? 0.7 : 1 }}
      >
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

        {/* Inactive Badge */}
        {isActive === false && (
          <View className="absolute top-3 right-3 z-10">
            <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
              <Text className="text-gray-500 text-xs font-bold">
                INACTIVE
              </Text>
            </View>
          </View>
        )}

        {/* Header row: department + inactive */}
        <View className="flex-row items-start justify-between mb-3">
          {/* left-side spacer to keep spacing consistent */}
          <View />
          {/* right side is now occupied by the absolute department/inactive badges */}
        </View>
        {/* Description */}
        {description && description !== courseName && (
          <Text
            className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}

        {/* Meta chips */}
        {(testCount !== undefined || semester !== undefined || academicYear) && (
          <View className="flex-row flex-wrap items-center gap-2 mb-3">
            {testCount !== undefined && (
              <View className="flex-row items-center py-1 rounded">
                <BookOpen size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{testCount} Tests</Text>
              </View>
            )}

            {semester !== undefined && (
              <View className="flex-row items-center bg-gray-100/40 px-2 py-1 rounded">
                <Clock size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-1 text-xs ${isDark ? 'text-white' : 'text-gray-600'}`}>Sem {semester}</Text>
              </View>
            )}

            {academicYear && (
              <View className="flex-row items-center px-2 py-1 rounded">
                <Clock size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{academicYear}</Text>
              </View>
            )}
          </View>
        )}

        {/* Teacher info: small icon + name (no leading label) */}
        {instructor && (
          <View className="pt-3 border-t border-gray-700/20">
            <View className="flex-row items-center">
              <Users size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{instructor}</Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  }

  // Default variant used in courses page
  return (
    <Pressable
      onPress={handlePress}
      className={`rounded-xl p-5 mb-4 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
      style={{ width: width as any, opacity: isActive === false ? 0.7 : 1 }}
    >
      {/* Department code badge (top-right). Shift left if INACTIVE is present */}
      {departmentCode && (
        <View className={`absolute top-3 ${isActive === false ? 'right-14' : 'right-3'} z-20`}>
          <View className={`px-3 py-1 rounded-full border`} style={{ borderColor: isDark ? undefined : colorConfig.border.replace('border-', ''), backgroundColor: isDark ? undefined : undefined }}>
            <Text className={`text-xs font-bold`} style={{ color: colorConfig.icon }}>{departmentCode}</Text>
          </View>
        </View>
      )}

      {/* Inactive Badge */}
      {isActive === false && (
        <View className="absolute top-3 right-3 z-10">
          <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'
            }`}>
            <Text className="text-gray-500 text-xs font-bold">
              INACTIVE
            </Text>
          </View>
        </View>
      )}

      {/* Header with Icon */}
      <View className="flex-row items-start justify-between mb-4">
        <View className={`p-3 rounded-xl ${colorConfig.bg} border ${colorConfig.border}`}>
          <Code size={24} color={colorConfig.icon} />
        </View>
        <ChevronRight size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
      </View>

      {/* Course Info */}
      <View className="mb-3">
        {courseCode && (
          <Text className={`text-xs font-semibold mb-1 ${colorConfig.text}`}>
            {courseCode}
          </Text>
        )}
        <Text
          className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
          numberOfLines={2}
        >
          {courseName}
        </Text>
      </View>

      {/* Instructor (icon + name) */}
      {instructor && (
        <View className="mb-4">
          <View className="flex-row items-center">
            <Users size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{instructor}</Text>
          </View>
        </View>
      )}

      {/* Stats */}
      {(students !== undefined || materials !== undefined || slots !== undefined) && (
        <View className="flex-row items-center gap-4 mb-4 pt-4 border-t border-gray-700">
          {students !== undefined && (
            <View className="flex-row items-center">
              <Users size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`ml-2 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {students}
              </Text>
            </View>
          )}

          {materials !== undefined && (
            <View className="flex-row items-center">
              <BookOpen size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`ml-2 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {materials}
              </Text>
            </View>
          )}

          {slots !== undefined && (
            <View className="flex-row items-center">
              <Clock size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`ml-2 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {slots} slots
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Department Badge */}
      {department && (
        <View className="flex-row items-center">
          <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
            <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {department}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default CourseCard;
