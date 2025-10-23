import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
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

export {
  ErrorBoundary,
} from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { colorScheme } = useColorScheme();
  const initializing = useAuthStore((state) => state.initializing);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [fontsConfigured, setFontsConfigured] = useState(false);
  
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Check authentication on app start
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Configure fonts AFTER they are loaded
    if (fontsLoaded && !fontError && !fontsConfigured) {
      configureFonts();
      setFontsConfigured(true);
    }
  }, [fontsLoaded, fontError, fontsConfigured]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !initializing) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, initializing]);

  if ((!fontsLoaded && !fontError) || initializing) {
    return null;
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <CustomAlertProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack   screenOptions={{ headerShown: false,animation:'slide_from_right',animationDuration:20 }} />
        <PortalHost />
        <Toast config={toastConfig} />
      </CustomAlertProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutContent />;
}
