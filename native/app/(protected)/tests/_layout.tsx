import HeaderTile from '@/components/ui/headerTile';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function TestsLayout() {
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
        name="certificate"
        options={{
          header: () => <HeaderTile title='Certificate' foot="View your certificate" />
        }}
      />
      <Stack.Screen
        name="attempt-detail"
        options={{
          header: () => <HeaderTile title='Attempt Detail' foot="View attempt details" />
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
