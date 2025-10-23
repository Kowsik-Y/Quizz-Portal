import { View, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { User, Settings, Award, BookOpen, LogOut, Moon, Sun, Shield, Smartphone } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useCustomAlert } from '@/components/ui/custom-alert';

export default function ProfilePage() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { stats, fetchStats } = useUserStore();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  // Fetch user stats on mount
  useEffect(() => {
    if (user?.role === 'student') {
      fetchStats();
    }
  }, [user]);
  const isWeb = Platform.OS === 'web';
  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth >= 768;
  const { showAlert } = useCustomAlert();


  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are sure to logout',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error: any) {
              const errorMessage = error.response?.data?.error || 'Failed to Log out';
              showAlert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const MenuItem = ({ icon: Icon, title, value, onPress }: any) => (
    <Pressable
      onPress={onPress}
      className={`rounded-xl p-4 mb-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}
          >
            <Icon size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
          </View>
          <View className="ml-4 flex-1">
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </Text>
            {value && (
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {value}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );

  const StatItem = ({ label, value, icon: Icon }: any) => (
    <View
      className={`flex-1 rounded-xl p-4 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
    >
      <Icon size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
      <Text className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </Text>
      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</Text>
    </View>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView
        className={`flex-1 ${isWeb ? 'px-8' : 'px-4'}`}
        contentContainerStyle={{
          paddingBottom: isWeb && isLargeScreen ? 32 : 90, // Extra padding for bottom nav on mobile
        }}
      >
        {/* Header */}
        <View className={isWeb ? 'pt-8 pb-6' : 'pt-6 pb-4'}>
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Profile
          </Text>
          <Text className={`mt-1 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your account
          </Text>
        </View>

        {/* User Info */}
        <View
          className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
        >
          <View className="items-center">
            <View className="w-24 h-24 rounded-full bg-blue-500 items-center justify-center mb-4">
              <User size={40} color="#fff" />
            </View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user?.name || 'User'}
            </Text>
            <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {user?.email || ''}
            </Text>
            <View className="bg-blue-500 rounded-full px-4 py-2 mt-3">
              <Text className="text-white font-semibold capitalize">{user?.role || 'Student'}</Text>
            </View>
          </View>
        </View>

        {/* Stats - Only for Students */}
        {user?.role === 'student' && (
          <View className="mb-6">
            <Text
              className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              YOUR ACHIEVEMENTS
            </Text>
            <View className="flex-row gap-3 mb-3">
              <StatItem
                icon={BookOpen}
                label="Tests Taken"
                value={stats?.testsCompleted || 0}
              />
              <StatItem
                icon={Award}
                label="Avg Score"
                value={stats?.averageScore ? `${Math.round(stats.averageScore)}%` : '0%'}
              />
            </View>
          </View>
        )}

        {/* Admin Management - Only for Admins */}
        {user?.role === 'admin' && (
          <View className="mb-6">
            <Pressable
              onPress={() => router.push('/admin')}
            >
              <View
                className={`flex-row items-center rounded-2xl p-6 mb-4 ${isDark ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                  }`}
              >
                <View className={`w-16 h-16 rounded-2xl items-center justify-center ${isDark ? 'bg-blue-600' : 'bg-blue-500'
                  }`}>
                  <Shield size={32} color="#fff" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Admin Management
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                    Manage users, departments, years & more
                  </Text>
                </View>
                <Text className={`text-3xl ${isDark ? 'text-blue-300' : 'text-blue-500'}`}>
                  →
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Settings */}
        <View className="mb-6">
          <Text
            className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            SETTINGS
          </Text>

          <MenuItem icon={User} title="Edit Profile" value="Update your information" />
          <MenuItem
            icon={Smartphone}
            title="Your Devices"
            value="Manage logged in devices"
            onPress={() => router.push('/profile/devices')}
          />
          <MenuItem icon={Settings} title="Preferences" value="Manage your preferences" />
          <Pressable
            onPress={toggleColorScheme}
            className={`rounded-xl p-4 mb-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                >
                  {isDark ? (
                    <Moon size={20} color="#60a5fa" />
                  ) : (
                    <Sun size={20} color="#3b82f6" />
                  )}
                </View>
                <View className="ml-4 flex-1">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Theme
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isDark ? 'Dark mode' : 'Light mode'}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable className="bg-red-500 rounded-xl p-4 mb-6" onPress={handleLogout}>
          <View className="flex-row items-center justify-center">
            <LogOut size={20} color="#fff" />
            <Text className="ml-2 text-white font-bold text-lg">Logout</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
