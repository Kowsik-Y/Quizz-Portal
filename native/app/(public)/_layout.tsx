import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function PublicLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initializing = useAuthStore((state) => state.initializing);

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      router.replace('/(protected)/(tabs)/home');
    }
  }, [isAuthenticated, initializing]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Welcome' }}
      />
      <Stack.Screen 
        name="login" 
        options={{ title: 'Login' }}
      />
      <Stack.Screen 
        name="register" 
        options={{ title: 'Register' }}
      />
    </Stack>
  );
}
