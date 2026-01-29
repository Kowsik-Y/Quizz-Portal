import HeaderTile from '@/components/ui/headerTile';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function MaterialsLayout() {
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
          backgroundColor: '#10b981',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="add-material-to-test" 
         options={{
          header: () => <HeaderTile title='Add Material to Test' foot="Select material to add to test" />
        }}
      />
    </Stack>
  );
}
