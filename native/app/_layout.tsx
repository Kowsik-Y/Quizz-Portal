import '../global.css';

// Disable Reanimated strict mode warnings
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['[Reanimated]']);

// import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { configureFonts } from '@/lib/fontConfig';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/lib/toast';
import { CustomAlertProvider } from '@/components/ui/custom-alert';
import { View, ActivityIndicator, Text } from 'react-native';
import { GraduationCap } from 'lucide-react-native';

export {
  ErrorBoundary,
} from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const initializing = useAuthStore((state) => state.initializing);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [fontsConfigured, setFontsConfigured] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Load saved theme preference on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load theme immediately
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setColorScheme(savedTheme);
        }

        await checkAuth();

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsReady(true);
      }
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fontsLoaded && !fontError && !fontsConfigured) {
      configureFonts();
      setFontsConfigured(true);
    }
  }, [fontsLoaded, fontError, fontsConfigured]);

  // Hide splash screen only when everything is truly ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && isReady && !initializing) {
      // Small delay to ensure styles are applied
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontError, isReady, initializing]);

  // Show a minimal loading state instead of null to prevent blank screens
  if ((!fontsLoaded && !fontError) || !isReady || initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <View className="items-center gap-6">
          {/* App Icon/Logo */}
          <View className="w-28 h-28 rounded-full bg-primary items-center justify-center mb-6">
            <GraduationCap size={50} color="#fff" />
          </View>
          <Text className="text-5xl font-bold mb-3 text-foreground">Quiz Portal</Text>
          {/* Loading Indicator */}
          <ActivityIndicator size="large" className='text-primary' />
        </View>
      </View >
    );
  }

  return (
    <CustomAlertProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'default',
          contentStyle: { 
            backgroundColor: colorScheme === 'dark' ? '#1a1f2e' : '#f9fafb'
          },
        }}
      />
      {/* <PortalHost /> */}
      <Toast config={toastConfig} />
    </CustomAlertProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutContent />;
}
