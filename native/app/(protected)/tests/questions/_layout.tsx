import HeaderTile from '@/components/ui/headerTile';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function QuestionsLayout() {
  const { colorScheme } = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#1a1f2e' : '#f9fafb';
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
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
        name="add-questions" 
        options={{
          header: () => <HeaderTile title='Add Questions' foot="Create new questions for the test" />
        }}
      />
      <Stack.Screen 
        name="view-questions" 
       options={{ 
          header: () => <HeaderTile title='View Questions' foot="Review existing questions for the test" />
        }}
      />
    </Stack>
  );
}
