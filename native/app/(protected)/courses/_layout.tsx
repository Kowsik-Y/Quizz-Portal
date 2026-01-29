// Courses Module Layout
// Handles all course-related pages and navigation

import HeaderTile from '@/components/ui/headerTile';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function CoursesLayout() {
  const { colorScheme } = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#1a1f2e' : '#f9fafb';
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'default',
        contentStyle: {
          backgroundColor: backgroundColor
        },
        headerStyle: {
          backgroundColor: '#10b981',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="create-course"
        options={{
          header: () => <HeaderTile title='Create Course' foot="Set up your course details" />
        }}
      />
      <Stack.Screen
        name="course-details"
        options={{
          header: () => <HeaderTile title='Course Details' foot="Course Information" />
        }}
      />
      <Stack.Screen
        name="edit-course"
        options={{
          header: () => <HeaderTile title='Edit Course' foot="Update Course Information" />
        }}
      />
      <Stack.Screen
        name="materials"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
