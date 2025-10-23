import { Tabs } from 'expo-router';
import { Home, PlusCircle, User, BookOpen, GraduationCap } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Platform, useWindowDimensions } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const iconColor = colorScheme === 'dark' ? '#9ca3af' : '#6b7280';
  const activeColor = '#3b82f6';

  const canCreateTests = user?.role === 'teacher' || user?.role === 'admin';
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768;
  const showBottomTabs = !isWeb || !isLargeScreen;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: iconColor,
        headerShown: false,
        tabBarStyle: {
          display: showBottomTabs ? 'flex' : 'none',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 7,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Poppins_600SemiBold',
          ...(Platform.OS !== 'android' && { fontWeight: '600' as const }),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: 'Tests',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
          href: canCreateTests ? '/create' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
