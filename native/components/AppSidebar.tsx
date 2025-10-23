import { View, Pressable, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Home, BookOpen, GraduationCap, PlusCircle, User, LogOut, Users } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/stores/authStore';
import { useCustomAlert } from './ui/custom-alert';

export function AppSidebar() {
  const { colorScheme } = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const pathname = usePathname();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const { showAlert } = useCustomAlert();
  // Check user permissions
  const canCreateTests = user?.role === 'teacher' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  // Navigation items configuration
  const navItems = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Courses', path: '/courses', icon: GraduationCap },
    { name: 'Tests', path: '/tests', icon: BookOpen },
    { 
      name: 'Create Test', 
      path: '/create', 
      icon: PlusCircle, 
      requireRole: ['teacher', 'admin'] 
    },
    { 
      name: 'Manage Users', 
      path: '/admin/manage-users', 
      icon: Users, 
      requireRole: ['admin'] 
    },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(
    (item) => !item.requireRole || item.requireRole.includes(user?.role || '')
  );

  // Get role badge color
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return {
          bg: 'bg-purple-500/20',
          text: 'text-purple-500',
          border: 'border-purple-500/30',
        };
      case 'teacher':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-500',
          border: 'border-green-500/30',
        };
      default:
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-500',
          border: 'border-blue-500/30',
        };
    }
  };

  const handleLogout = async () => {
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

  const roleColors = getRoleBadgeColor(user?.role);

  return (
    <View
      className={`h-full border-r ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
      style={{ width: 256 }}
    >
      {/* Header Section */}
      <View className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Logo */}
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
           Quiz Portal
        </Text>
        
        {/* User Info */}
        <View className="mt-3">
          <Text className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
            {user?.name || 'Guest User'}
          </Text>
          <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {user?.email || 'Not logged in'}
          </Text>
        </View>

        {/* Role Badge */}
        {user?.role && (
          <View className="mt-3">
            <View
              className={`px-3 py-1.5 rounded-full self-start border ${roleColors.bg} ${roleColors.border}`}
            >
              <Text className={`text-xs font-bold ${roleColors.text}`}>
                {user.role.toUpperCase()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Navigation Section */}
      <ScrollView className="flex-1 p-4">
        <View className="space-y-1">
          {filteredNavItems.map((item) => {
            // Check if current route matches this nav item
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Pressable
                key={item.path}
                onPress={() => router.push(item.path as any)}
                className={`flex-row items-center px-4 py-3 rounded-lg mb-2 ${
                  isActive
                    ? 'bg-blue-500'
                    : isDark
                    ? 'bg-transparent active:bg-gray-700'
                    : 'bg-transparent active:bg-gray-100'
                }`}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Icon
                  size={20}
                  color={isActive ? '#fff' : isDark ? '#9ca3af' : '#6b7280'}
                />
                <Text
                  className={`ml-3 font-medium ${
                    isActive ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          })}

          {/* Logout Button */}
          <View className="mt-6">
            <Pressable
              onPress={handleLogout}
              className={`flex-row items-center px-4 py-3 rounded-lg ${
                isDark
                  ? 'bg-red-900/20 border border-red-800 active:bg-red-900/30'
                  : 'bg-red-50 border border-red-200 active:bg-red-100'
              }`}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <LogOut size={20} color={isDark ? '#f87171' : '#dc2626'} />
              <Text
                className={`ml-3 font-medium ${
                  isDark ? 'text-red-400' : 'text-red-600'
                }`}
              >
                Logout
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      
    </View>
  );
}

// Export a wrapper component that conditionally renders the sidebar
export function AppSidebarWrapper({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768; // Show sidebar on tablet/desktop
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Mobile: No sidebar, just content
  if (!isWeb || !isLargeScreen) {
    return <>{children}</>;
  }

  // Desktop: Sidebar + Content
  return (
    <View className="flex-1 flex-row">
      <AppSidebar />
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {children}
      </View>
    </View>
  );
}
