import { View, ScrollView, Pressable, Platform, Dimensions, RefreshControl, Animated } from 'react-native';
import { Text } from '@/components/ui/text';
import { Award, BookOpen, LogOut, Moon, Sun, Shield, Smartphone, Bell, Lock, HelpCircle, Mail } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useCustomAlert } from '@/components/ui/custom-alert';
import { ProfileStatCard, ProfileMenuItem, ProfileHeader } from '@/components';
import AdminCard from '@/components/AdminCard';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { stats, fetchStats, loading } = useUserStore();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();

  const [refreshing, setRefreshing] = useState(false);
  const [themeTransitioning, setThemeTransitioning] = useState(false);


  const handleToggleTheme = async () => {
    try {
      setThemeTransitioning(true);

      // Calculate the new theme
      const newTheme = colorScheme === "light" ? "dark" : "light";

      // Set the theme immediately (this triggers re-render)
      setColorScheme(newTheme);

      // Save to AsyncStorage
      await AsyncStorage.setItem('theme', newTheme);

      setTimeout(() => setThemeTransitioning(false), 300);
    } catch (error) {
      console.error('Failed to save theme:', error);
      setThemeTransitioning(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user?.role === 'student') {
      await fetchStats();
    }
    setRefreshing(false);
  };


  // Fetch user stats on mount
  useEffect(() => {
    if (user?.role === 'student') {
      fetchStats();
    }
  }, [user, fetchStats]);
  const isWeb = Platform.OS === 'web';
  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth >= 1024;
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

  return (
    <View className="flex-1 bg-background ease-in-out transition-all">
      <ScrollView
        className='px-4 sm:px-7'
        contentContainerStyle={{
          paddingBottom: isWeb && isLargeScreen ? 32 : 90,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6', '#8b5cf6', '#10b981']}
          />
        }
      >
        {/* Page Header */}
        <View className='sm:pt-8 sm:pb-6 pt-6 pb-4'>
          <Text className={`${isWeb ? 'text-4xl' : 'text-3xl'} font-bold text-foreground`}>
            Profile
          </Text>
          <Text className={`mt-2 ${isWeb ? 'text-lg' : 'text-base'} text-muted-foreground`}>
            Manage your account and preferences
          </Text>
        </View>

        {/* User Profile Card */}
        <ProfileHeader
          name={user?.name}
          email={user?.email}
          role={user?.role}
        />

        {/* Stats Grid - Only for Students */}
        {user?.role === 'student' && (
          <View className="mb-6">
            <Text className={`${isWeb ? 'text-sm' : 'text-xs'} font-bold mb-4 text-muted-foreground dark:text-muted-foreground uppercase tracking-wider px-1`}>
              Your Statistics
            </Text>
            {loading ? (
              <View className={`flex-row ${isWeb && isLargeScreen ? 'gap-6' : 'gap-3'}`}>
                <View className="flex-1 rounded-2xl p-6 bg-card border border-border h-32 animate-pulse" />
                <View className="flex-1 rounded-2xl p-6 bg-card border border-border h-32 animate-pulse" />
              </View>
            ) : (
              <View className={`flex-row ${isWeb && isLargeScreen ? 'gap-6' : 'gap-3'}`}>
                <ProfileStatCard
                  icon={BookOpen}
                  label="Tests Completed"
                  value={stats?.testsCompleted || 0}
                  color="#3b82f6"
                />
                <ProfileStatCard
                  icon={Award}
                  label="Average Score"
                  value={stats?.averageScore ? `${Math.round(stats.averageScore)}%` : '0%'}
                  color="#10b981"
                />
              </View>
            )}
          </View>
        )}

        {/* Admin Management - Only for Admins */}
        {user?.role === 'admin' && (

          <View className="mb-6">
            <AdminCard
              icon={Shield}
              title="Admin Panel"
              description="Manage users, departments, and settings"
              onPress={() => router.push('/admin')}
              color="#8b5cf6"
              bgColor="bg-cyan-50"
              darkBgColor="bg-cyan-900/20"
            />
          </View>
        )}

        {/* Account Settings Section */}
        <View className="mb-6">
          <Text className={`${isWeb ? 'text-sm' : 'text-xs'} font-bold mb-4 text-muted-foreground uppercase tracking-wider px-1`}>
            Account Settings
          </Text>

          <ProfileMenuItem
            icon={Smartphone}
            title="Manage Devices"
            value="View and manage logged in devices"
            onPress={() => router.push('/profile/devices')}
            iconColor="#8b5cf6"
          />

          <ProfileMenuItem
            icon={Lock}
            title="Security & Privacy"
            value="Password and security settings"
            onPress={() => router.push('/profile/security')}
            iconColor="#ef4444"
          />

          <ProfileMenuItem
            icon={Bell}
            title="Notifications"
            value="Manage your notification preferences"
            onPress={() => router.push('/profile/notifications')}
            iconColor="#f59e0b"
          />
        </View>

        {/* Appearance Section */}
        <View className="mb-6">
          <Text className={`${isWeb ? 'text-sm' : 'text-xs'} font-bold mb-4 text-muted-foreground uppercase tracking-wider px-1`}>
            Appearance
          </Text>

          <Pressable
            onPress={handleToggleTheme}
            disabled={themeTransitioning}
            className={`rounded-2xl ${isWeb ? 'p-5' : 'p-4'} mb-3 bg-card border border-border transition-all`}
            style={({ pressed }) => ({
              opacity: themeTransitioning ? 0.7 : pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            })}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Animated.View
                  className={`p-3 rounded-xl items-center justify-center`}
                >
                  {colorScheme === 'dark' ? (
                    <Moon size={isWeb ? 22 : 20} color="#60a5fa" />
                  ) : (
                    <Sun size={isWeb ? 22 : 20} color="#fbbf24" />
                  )}
                </Animated.View>
                <View className="ml-4 flex-1">
                  <Text className={`${isWeb ? 'text-base' : 'text-sm'} font-semibold text-foreground`}>
                    Theme
                  </Text>
                  <Text className={`${isWeb ? 'text-sm' : 'text-xs'} mt-1 text-muted-foreground`}>
                    {themeTransitioning ? 'Switching...' : colorScheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Help & Support Section */}
        <View className="mb-6">
          <Text className={`${isWeb ? 'text-sm' : 'text-xs'} font-bold mb-4 text-muted-foreground uppercase tracking-wider px-1`}>
            Help & Support
          </Text>

          <ProfileMenuItem
            icon={HelpCircle}
            title="Help Center"
            value="FAQs and support articles"
            onPress={() => router.push('/profile/help')}
            iconColor="#06b6d4"
          />

          <ProfileMenuItem
            icon={Mail}
            title="Contact Support"
            value="Get help from our team"
            onPress={() => router.push('/profile/contact')}
            iconColor="#14b8a6"
          />
        </View>

        {/* Logout Button */}
        <Pressable
          className={`rounded-2xl ${isWeb ? 'p-6' : 'p-5'} mb-6 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/40 hover:bg-red-500/20 active:bg-red-500/30`}
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
          onPress={handleLogout}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-3">
              <LogOut size={20} color="#ef4444" strokeWidth={2.5} />
            </View>
            <Text className={`text-red-500 dark:text-red-400 font-bold ${isWeb ? 'text-lg' : 'text-base'}`}>
              Logout
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}