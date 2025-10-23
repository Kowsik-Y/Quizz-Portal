// Materials Sub-Module Layout
// Handles course materials management

import HeaderTile from '@/components/ui/headerTile';
import { Stack } from 'expo-router';

export default function MaterialsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
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
        name="add-material" 
        options={{
          header: () => <HeaderTile title='Add Material' foot="Upload new course material" />
        }}
      />
      <Stack.Screen 
        name="view-materials" 
        options={{
          header: () => <HeaderTile title='View Materials' foot="Manage your course materials" />
        }}
      />
      <Stack.Screen 
        name="add-material-to-test" 
         options={{
          header: () => <HeaderTile title='Add Material to Test' foot="Select material to add to test" />
        }}
      />
    </Stack>
  );
}
