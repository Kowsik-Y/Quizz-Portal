import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Users,
  BookOpen,
  Calendar,
  CalendarClock,
  ChevronRight
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { Badge } from './ui/badge';

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
  const instructor = getCourseField(course, 'teacher_name', 'instructor', 'teacher');
  const testCount = toNumber(getCourseField(course, 'test_count', 'tests'));
  const semester = getCourseField(course, 'semester', 'sem');
  const description = getCourseField(course, 'description');
  const academicYear = getCourseField(course, 'academic_year', 'year');
  const isActive = getCourseField(course, 'is_active', 'active');

  const handlePress = () => {
    router.push({
      pathname: '/courses/course-details',
      params: { id: course.id, name: courseName }
    } as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${courseName} course card`}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className={'rounded-2xl px-5 py-4 mb-4 bg-card border border-border'}
      style={{ 
        width: width as any, 
        opacity: isActive === false ? 0.65 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.01,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="justify-between flex-1 gap-3">
        <View className='gap-3'>
          <View className="flex-row justify-between items-start">
            <View style={{ flex: 1 }}>
              <Text className="text-xl font-bold text-foreground leading-tight" numberOfLines={2}>
                {course.title}
              </Text>
            </View>
            <View className="flex-row justify-between items-start gap-2">

              {course.department_code && (
                <Badge variant='secondary' size='sm' className='py-1.5 px-3 rounded-lg' >
                  {course.department_code}
                </Badge>
              )}
              {/* Inactive Badge */}
              {isActive === false && (
                <Badge variant='danger' size='sm' className='py-1.5 px-3 rounded-lg' >
                  INACTIVE
                </Badge>

              )}
            </View>
          </View>

          {/* Description */}
          <View className="justify-center">
            {description && description !== courseName && (
              <Text
                className="text-sm text-muted-foreground leading-relaxed"
                numberOfLines={2}
              >
                {description}
              </Text>
            )}
          </View>
        </View>

        <View className='gap-3'>
          {/* Meta chips */}
          {(testCount !== undefined || semester !== undefined || academicYear) && (
            <View className="flex-row flex-wrap items-center gap-2">
              {testCount !== undefined && (
                <View className="flex-row items-center bg-blue-500/10 px-3 py-1.5 rounded-lg">
                  <BookOpen size={14} color="#3b82f6" />
                  <Text className="ml-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {testCount} {testCount === 1 ? 'Test' : 'Tests'}
                  </Text>
                </View>
              )}

              {semester !== undefined && (
                <View className="flex-row items-center bg-purple-500/10 px-3 py-1.5 rounded-lg">
                  <Calendar size={14} color="#8b5cf6" />
                  <Text className="ml-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">Sem {semester}</Text>
                </View>
              )}

              {academicYear && (
                <View className="flex-row items-center bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                  <CalendarClock size={14} color="#10b981" />
                  <Text className="ml-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">{academicYear}</Text>
                </View>
              )}
            </View>
          )}

          {instructor && (
            <View className="pt-3 mt-1 border-t border-border flex-row justify-between items-center">
              <View className="flex-row items-center flex-1">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2.5">
                  <Users size={16} color="#3b82f6" />
                </View>
                <Text className="text-sm font-medium text-foreground flex-1" numberOfLines={1}>{instructor}</Text>
              </View>
              <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                <ChevronRight size={14} color="#3b82f6" />
              </View>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

};

export default CourseCard;
