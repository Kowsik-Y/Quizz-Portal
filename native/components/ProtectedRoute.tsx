import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const initializing = useAuthStore((state) => state.initializing);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (initializing) return;

    const publicRoutes = ['/login', '/register'];
    const isPublicRoute = publicRoutes.includes(pathname);

    // Redirect logic
    if (!user && !isPublicRoute) {
      router.replace('/login');
    } else if (user && isPublicRoute) {
      router.replace('/(protected)/(tabs)/home');
    }
  }, [user, initializing, pathname, router]);

  // Show loading screen while checking authentication
  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
