import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/button';

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ backgroundColor: '#f1f5f9', borderRadius: 48, padding: 24, marginBottom: 24 }}>
          <AlertCircle size={64} color="#ef4444" />
        </View>
        <Text className="text-3xl font-bold mb-2 text-foreground" style={{ textAlign: 'center' }}>
          Oops! Page Not Found
        </Text>
        <Text className="text-base text-muted-foreground mb-8" style={{ textAlign: 'center', maxWidth: 320 }}>
          The page you are looking for doesn't exist or has been moved.
        </Text>
        <Link href="/home" asChild>
          <Button className="px-6 py-3 rounded-xl bg-primary" style={{ elevation: 2 }}>
            <Text className="text-white font-semibold text-base">Go to Home</Text>
          </Button>
        </Link>
      </View>
    </SafeAreaView>
  );
}
