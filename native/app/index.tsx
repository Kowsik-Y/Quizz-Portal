import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function Screen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initializing = useAuthStore((state) => state.initializing);

  // Show loading while checking auth (root layout handles checkAuth)
  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect based on auth status
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(protected)/(tabs)/home" />;
}
