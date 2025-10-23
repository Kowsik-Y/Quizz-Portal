// Protected Layout - Authentication required
// Redirects to login if not authenticated
// Contains all authenticated routes with persistent sidebar navigation

import { useEffect } from 'react';
import { useRouter, Stack, Redirect, useSegments, usePathname } from 'expo-router';
import { View, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { AppSidebar } from '@/components/AppSidebar';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/stores/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProtectedLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get auth state from Zustand store (root layout handles checkAuth)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initializing = useAuthStore((state) => state.initializing);

  const isLoading = initializing;

  // Platform and screen size detection
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768; // Tablet/Desktop breakpoint

  // Check if current route is take-test (full-screen page)
  // Review page should show sidebar for navigation
  const currentRoute = String(pathname || '');
  const isFullScreenPage = currentRoute.indexOf('take-test') !== -1;

  // Show sidebar only on desktop and NOT on full-screen pages
  const showSidebar = isWeb && isLargeScreen && !isFullScreenPage;

  // Redirect to login if not authenticated (no checkAuth call needed here)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Desktop layout with sidebar
  if (showSidebar) {
    return (
      <View className="flex-1 flex-row">
        {/* Persistent Sidebar - Always visible on desktop */}
        <AppSidebar />

        {/* Main Content Area */}
        <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="tests"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="courses"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="admin"
              options={{ headerShown: false }}
            />
          </Stack>
        </View>
      </View>
    );
  }
  const Container = isWeb ? View : SafeAreaView;
  // Mobile layout without sidebar (uses bottom tabs)
  return (
    <Container className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 20,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="tests"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="courses"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="admin"
          options={{ headerShown: false }}
        />
      </Stack>
    </Container>
  );
}
