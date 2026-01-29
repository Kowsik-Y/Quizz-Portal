import { useEffect } from 'react';
import { useRouter, Stack, Redirect, usePathname } from 'expo-router';
import { View, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuthStore } from '@/stores/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProtectedLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initializing = useAuthStore((state) => state.initializing);

  const isLoading = initializing;

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768;
  const currentRoute = String(pathname || '');
  const isFullScreenPage = currentRoute.indexOf('take-test') !== -1;
  const showSidebar = isWeb && isLargeScreen && !isFullScreenPage;
  

  const backgroundColor = colorScheme === 'dark' ? '#1a1f2e' : '#f9fafb';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (showSidebar) {
    return (
      <View className="flex-1 flex-row">
        <AppSidebar />

        {/* Main Content Area */}
        <View className="flex-1 bg-background">
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'default',
              contentStyle: {
                backgroundColor: backgroundColor
              },
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
    <Container className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'default',
          contentStyle: {
            backgroundColor: backgroundColor
          },
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
