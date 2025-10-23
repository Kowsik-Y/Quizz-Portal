// Tests Module Layout
// Handles all test-related pages and navigation

import HeaderTile from '@/components/ui/headerTile';
import { Stack } from 'expo-router';

export default function TestsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="create-test"
        options={{
          header: () => <HeaderTile title='Create Test' foot="Set up a new test" />
        }}
      />
      <Stack.Screen
        name="test-details"
        options={{
          header: () => <HeaderTile title='Test Details' foot="View test information" />
        }}
      />
      <Stack.Screen
        name="edit-test"
        options={{
          header: () => <HeaderTile title='Edit Test' foot="Update test information" />
        }}
      />
      <Stack.Screen
        name="book-test"
        options={{
          header: () => <HeaderTile title='Book Test Slot' foot="Select a time slot for the test" />
        }}
      />
      <Stack.Screen
        name="take-test"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="take-quiz"
        options={{
          title: 'Practice Quiz',
          headerShown: false,
          gestureEnabled: false
        }}
      />
      <Stack.Screen
        name="review"
        options={{
          header: () => <HeaderTile title='Review Results' foot="View your test results" />
        }}
      />
      <Stack.Screen
        name="questions"
        options={{
          headerShown: false 
        }}
      />
    </Stack>
  );
}
