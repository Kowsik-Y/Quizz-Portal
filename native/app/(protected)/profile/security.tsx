import { View, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/input';
import {
  Lock,
  Key,
  Shield,
  Smartphone,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import HeaderTile from '@/components/ui/headerTile';
import { useCustomAlert } from '@/components/ui/custom-alert';
import SettingItem from '@/components/settingsItem';

export default function SecurityPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { showAlert } = useCustomAlert();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    loadSecuritySettings();
  }, [user, router]);

  const loadSecuritySettings = async () => {
    try {
      const response = await api.get('/security/settings');
      setTwoFactorEnabled(response.data.twoFactorEnabled || false);
      setLoginAlertsEnabled(response.data.loginAlertsEnabled !== false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.error('Failed to load security settings');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Validation Error', 'All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Validation Error', 'New passwords do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.post('/security/change-password', {
        currentPassword,
        newPassword,
      });

      showAlert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleTwoFactor = async (value: boolean) => {
    if (value) {
      showAlert('Coming Soon', 'Two-factor authentication setup will be available soon');
      return;
    }

    try {
      await api.post('/security/toggle-2fa', { enabled: value });
      setTwoFactorEnabled(value);
      showAlert('Success', `Two-factor authentication ${value ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to update setting');
    }
  };

  const handleToggleLoginAlerts = async (value: boolean) => {
    try {
      await api.post('/security/toggle-login-alerts', { enabled: value });
      setLoginAlertsEnabled(value);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to update setting');
    }
  };


  return (
    <View className="flex-1 bg-background">
      <HeaderTile title="Security" foot="Manage your account security" />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Change Password Section */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4 mt-4">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Key size={20} className="text-primary" />
            </View>
            <View>
              <Text className="text-lg font-bold text-foreground">Change Password</Text>
              <Text className="text-xs text-muted-foreground">
                Update your password regularly
              </Text>
            </View>
          </View>

          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            containerClassName="mb-4"
          />

          <PasswordInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            containerClassName="mb-4"
          />

          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            containerClassName="mb-4"
          />

          <View className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
            <View className="flex-row items-center">
              <AlertTriangle size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
              <Text className="text-xs text-blue-600 dark:text-blue-400 flex-1">
                Password must be at least 6 characters long
              </Text>
            </View>
          </View>

          <Button
            onPress={handleChangePassword}
            disabled={isChangingPassword}
            className="bg-primary sm:py-6 py-3"
          >
            <Text className="text-base font-bold text-primary-foreground">
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </Text>
          </Button>
        </View>

        {/* Security Settings */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4 gap-2">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Shield size={20} className="text-primary" />
            </View>
            <View>
              <Text className="text-lg font-bold text-foreground">Security Settings</Text>
              <Text className="text-xs text-muted-foreground">
                Additional security options
              </Text>
            </View>
          </View>

          <SettingItem
            icon={Lock}
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            value={twoFactorEnabled}
            onValueChange={handleToggleTwoFactor}
          />

          <SettingItem
            icon={Smartphone}
            title="Login Alerts"
            description="Get notified when someone logs into your account"
            value={loginAlertsEnabled}
            onValueChange={handleToggleLoginAlerts}
          />
        </View>

        {/* Security Tips */}
        <View className="bg-card border border-border rounded-2xl p-4">
          <Text className="text-lg font-bold mb-3 text-foreground">Security Tips</Text>

          <View className="flex-row items-start mb-3">
            <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
            <Text className="text-sm text-muted-foreground flex-1">
              Use a strong, unique password for your account
            </Text>
          </View>

          <View className="flex-row items-start mb-3">
            <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
            <Text className="text-sm text-muted-foreground flex-1">
              Enable two-factor authentication for extra security
            </Text>
          </View>

          <View className="flex-row items-start mb-3">
            <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
            <Text className="text-sm text-muted-foreground flex-1">
              Review your active devices regularly
            </Text>
          </View>

          <View className="flex-row items-start">
            <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
            <Text className="text-sm text-muted-foreground flex-1">
              Never share your password with anyone
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
