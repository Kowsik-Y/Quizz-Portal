import React, { useState } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { GraduationCap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';
import { Mail, Lock } from 'lucide-react-native';
import { useCustomAlert } from '@/components/ui/custom-alert';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const { showAlert } = useCustomAlert();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const isWeb = Platform.OS === 'web';

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    const success = await login(formData.email, formData.password);
    if (success) {
      router.replace('/');
    }
    // Error handling is done by the store with toast notifications
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={{
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%'
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: isWeb ? 550 : '100%', maxWidth: '100%' }}>
          <View className="items-center mb-6 sm:mb-10">
             <View className="w-28 h-28 rounded-full bg-primary items-center justify-center mb-6">
              <GraduationCap size={50} color="#fff" />
            </View>
            <Text className="text-5xl font-bold mb-3 text-foreground">Quiz Portal</Text>
            <Text className="text-muted-foreground text-lg text-center font-medium">Welcome back</Text>
          </View>

          <View className="sm:bg-card rounded-3xl p-3 sm:p-8 sm:border-2 border-border">
            <View className="gap-6">
              <Input
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                leftIcon={Mail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                variant="default"
                size="lg"
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                leftIcon={Lock}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
                variant="default"
                size="lg"
              />

              <Button onPress={handleSubmit} disabled={loading} className="rounded-2xl py-4 sm:py-6 bg-primary shadow-lg mt-4 h-fit">
                <Text className="text-white font-bold text-lg">{loading ? 'Logging In...' : 'Login'}</Text>
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
