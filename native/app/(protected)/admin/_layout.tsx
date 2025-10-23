import { useEffect } from 'react';
import { useRouter, Stack, Redirect } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import HeaderTile from '@/components/ui/headerTile';

export default function AdminLayout() {
  const router = useRouter();
  const user = { role: 'admin' }; 

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'teacher') {
      router.replace('/home');
    }
  }, [user]);

  if (user?.role !== 'admin' && user?.role !== 'teacher') {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-white">
        <Text className="text-xl font-bold text-red-600 mb-4">
          ⛔ Access Denied
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          You don't have permission to access this area.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/home')}
          className="bg-blue-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation:'slide_from_right',
        headerStyle: {
          backgroundColor: '#dc2626',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          header: () => <HeaderTile title='Admin Management' foot="Manage all aspects of the admin panel" />
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          header: () => <HeaderTile title='Admin Dashboard' foot="Overview of admin activities" />
        }}
      />
      <Stack.Screen
        name="manage-users"
        options={{
          header: () => <HeaderTile title='Manage Users' foot="View and edit user accounts" />,
        }}
      />
      <Stack.Screen
        name="create-user"
        
        options={{
          presentation: 'modal',
          webModalStyle: {'height': '80%'},
          header: () => <HeaderTile title='Create User' foot="Add a new user account" />
        }}
      />
      <Stack.Screen
        name="departments"
        options={{
          header: () => <HeaderTile title='Manage Departments' foot="View and edit departments" />
        }}
      />
      <Stack.Screen
        name="academic-years"
        options={{
          header: () => <HeaderTile title='Manage Academic Years' foot="Set up academic year details" />
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          header: () => <HeaderTile title='Analytics & Reports' foot="View and analyze reports" />
        }}
      />
      <Stack.Screen
        name="logs"
        options={{
          header: () => <HeaderTile title='Activity Logs' foot="View user activity logs" />
        }}
      />
      <Stack.Screen
        name="database"
        options={{
          header: () => <HeaderTile title='Database Management' foot="Manage the database and its contents" />
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          header: () => <HeaderTile title='System Settings' foot="Configure system-wide settings" />
        }}
      />
    </Stack>
  );
}
