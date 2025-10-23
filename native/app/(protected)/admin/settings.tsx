import { View, ScrollView, Pressable, Platform, TextInput, Switch, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Mail,
  Bell,
  Shield,
  Globe,
  Zap,
  Save,
  RotateCcw
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SystemSettingsPage() {
  const { colorScheme } = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Quiz Portal',
    siteDescription: 'Online Quiz and Test Management System',
    maintenanceMode: false,

    // Email Settings
    emailEnabled: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@quizportal.com',

    // Notification Settings
    enableEmailNotifications: true,
    enablePushNotifications: false,
    notifyOnNewUser: true,
    notifyOnTestSubmission: true,

    // Security Settings
    requireEmailVerification: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    maxDevicesPerUser: 3,

    // Performance Settings
    apiRateLimit: 100,
    enableCaching: true,
    cacheDuration: 3600,
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/home');
    }
  }, [user]);


  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load settings');
    }
  };

  const handleSaveSettings = () => {
    Alert.alert(
      'Save Settings',
      'Are you sure you want to save these settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            try {
              setLoading(true);
              await api.put('/admin/settings', settings);
              Alert.alert('Success', 'Settings saved successfully');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to save settings');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to default values. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.post('/admin/settings/reset');
              await loadSettings();
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to reset settings');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const SectionHeader = ({ icon: Icon, title }: any) => (
    <View className="flex-row items-center mb-4 mt-6">
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'
          }`}
      >
        <Icon size={20} color="#3b82f6" />
      </View>
      <Text className={`ml-3 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </Text>
    </View>
  );

  const SettingInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
    <View className="mb-4">
      <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
        className={`rounded-xl px-4 py-3 border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
      />
    </View>
  );

  const SettingSwitch = ({ label, description, value, onValueChange }: any) => (
    <View
      className={`flex-row items-center justify-between p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
    >
      <View className="flex-1 mr-4">
        <Text className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </Text>
        {description && (
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#3b82f6' }}
        thumbColor={value ? '#fff' : '#f3f4f6'}
      />
    </View>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="pt-6 pb-2">
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            System Settings
          </Text>
          <Text className={`mt-1 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure system preferences
          </Text>
        </View>

        {/* General Settings */}
        <SectionHeader icon={Globe} title="General Settings" />
        <SettingInput
          label="Site Name"
          value={settings.siteName}
          onChangeText={(text: string) => setSettings({ ...settings, siteName: text })}
          placeholder="Enter site name"
        />
        <SettingInput
          label="Site Description"
          value={settings.siteDescription}
          onChangeText={(text: string) => setSettings({ ...settings, siteDescription: text })}
          placeholder="Enter site description"
        />
        <SettingSwitch
          label="Maintenance Mode"
          description="Enable to temporarily disable site access"
          value={settings.maintenanceMode}
          onValueChange={(value: boolean) => setSettings({ ...settings, maintenanceMode: value })}
        />

        {/* Email Settings */}
        <SectionHeader icon={Mail} title="Email Configuration" />
        <SettingSwitch
          label="Enable Email"
          description="Allow system to send emails"
          value={settings.emailEnabled}
          onValueChange={(value: boolean) => setSettings({ ...settings, emailEnabled: value })}
        />
        {settings.emailEnabled && (
          <>
            <SettingInput
              label="SMTP Host"
              value={settings.smtpHost}
              onChangeText={(text: string) => setSettings({ ...settings, smtpHost: text })}
              placeholder="smtp.gmail.com"
            />
            <SettingInput
              label="SMTP Port"
              value={settings.smtpPort}
              onChangeText={(text: string) => setSettings({ ...settings, smtpPort: text })}
              placeholder="587"
              keyboardType="number-pad"
            />
            <SettingInput
              label="SMTP Username"
              value={settings.smtpUser}
              onChangeText={(text: string) => setSettings({ ...settings, smtpUser: text })}
              placeholder="noreply@example.com"
            />
          </>
        )}

        {/* Notification Settings */}
        <SectionHeader icon={Bell} title="Notifications" />
        <SettingSwitch
          label="Email Notifications"
          description="Send notifications via email"
          value={settings.enableEmailNotifications}
          onValueChange={(value: boolean) => setSettings({ ...settings, enableEmailNotifications: value })}
        />
        <SettingSwitch
          label="Push Notifications"
          description="Send push notifications to mobile apps"
          value={settings.enablePushNotifications}
          onValueChange={(value: boolean) => setSettings({ ...settings, enablePushNotifications: value })}
        />
        <SettingSwitch
          label="Notify on New User"
          description="Alert admins when new users register"
          value={settings.notifyOnNewUser}
          onValueChange={(value: boolean) => setSettings({ ...settings, notifyOnNewUser: value })}
        />
        <SettingSwitch
          label="Notify on Test Submission"
          description="Alert teachers when students submit tests"
          value={settings.notifyOnTestSubmission}
          onValueChange={(value: boolean) => setSettings({ ...settings, notifyOnTestSubmission: value })}
        />

        {/* Security Settings */}
        <SectionHeader icon={Shield} title="Security" />
        <SettingSwitch
          label="Require Email Verification"
          description="Users must verify email before login"
          value={settings.requireEmailVerification}
          onValueChange={(value: boolean) => setSettings({ ...settings, requireEmailVerification: value })}
        />
        <SettingInput
          label="Session Timeout (minutes)"
          value={settings.sessionTimeout.toString()}
          onChangeText={(text: string) => setSettings({ ...settings, sessionTimeout: parseInt(text) || 30 })}
          placeholder="30"
          keyboardType="number-pad"
        />
        <SettingInput
          label="Max Login Attempts"
          value={settings.maxLoginAttempts.toString()}
          onChangeText={(text: string) => setSettings({ ...settings, maxLoginAttempts: parseInt(text) || 5 })}
          placeholder="5"
          keyboardType="number-pad"
        />
        <SettingInput
          label="Password Min Length"
          value={settings.passwordMinLength.toString()}
          onChangeText={(text: string) => setSettings({ ...settings, passwordMinLength: parseInt(text) || 8 })}
          placeholder="8"
          keyboardType="number-pad"
        />
        <SettingInput
          label="Max Devices Per User"
          value={settings.maxDevicesPerUser.toString()}
          onChangeText={(text: string) => setSettings({ ...settings, maxDevicesPerUser: parseInt(text) || 3 })}
          placeholder="3"
          keyboardType="number-pad"
        />

        {/* Performance Settings */}
        <SectionHeader icon={Zap} title="Performance" />
        <SettingInput
          label="API Rate Limit (requests/minute)"
          value={settings.apiRateLimit.toString()}
          onChangeText={(text: string) => setSettings({ ...settings, apiRateLimit: parseInt(text) || 100 })}
          placeholder="100"
          keyboardType="number-pad"
        />
        <SettingSwitch
          label="Enable Caching"
          description="Cache responses for better performance"
          value={settings.enableCaching}
          onValueChange={(value: boolean) => setSettings({ ...settings, enableCaching: value })}
        />
        {settings.enableCaching && (
          <SettingInput
            label="Cache Duration (seconds)"
            value={settings.cacheDuration.toString()}
            onChangeText={(text: string) => setSettings({ ...settings, cacheDuration: parseInt(text) || 3600 })}
            placeholder="3600"
            keyboardType="number-pad"
          />
        )}

        {/* Action Buttons */}
        <View className="mt-8 gap-3">
          <Pressable
            onPress={handleSaveSettings}
            disabled={loading}
            className="bg-blue-500 rounded-xl p-4 flex-row items-center justify-center"
            style={({ pressed }) => [{ opacity: pressed || loading ? 0.5 : 1 }]}
          >
            <Save size={20} color="#fff" />
            <Text className="ml-2 text-white font-bold text-lg">
              {loading ? 'Saving...' : 'Save Settings'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleResetSettings}
            disabled={loading}
            className={`rounded-xl p-4 flex-row items-center justify-center border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            style={({ pressed }) => [{ opacity: pressed || loading ? 0.5 : 1 }]}
          >
            <RotateCcw size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`ml-2 font-bold text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Reset to Defaults
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
