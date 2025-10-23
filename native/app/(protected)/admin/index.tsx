import { View, ScrollView, Pressable, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { 
  Building2, 
  Calendar, 
  Users, 
  UserPlus, 
  Settings, 
  BarChart3,
  Shield,
  BookOpen,
  FileText,
  Database
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function AdminManagementPage() {
  const { colorScheme } = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  // Redirect non-admins
  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/home');
    }
  }, [user]);

  const AdminCard = ({ 
    icon: Icon, 
    title, 
    description, 
    onPress, 
    color = '#3b82f6',
    bgColor = 'bg-blue-50',
    darkBgColor = 'bg-blue-900/20'
  }: any) => (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl p-5 mb-4 ${
        isDark ? `${darkBgColor} border border-gray-700` : `${bgColor} border border-gray-200`
      }`}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <View className="flex-row items-center">
        <View
          className={`w-16 h-16 rounded-2xl items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
          style={{ shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}
        >
          <Icon size={28} color={color} />
        </View>
        <View className="ml-4 flex-1">
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {description}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text className={`text-xs font-bold uppercase tracking-wider mb-3 mt-2 ${
      isDark ? 'text-gray-400' : 'text-gray-500'
    }`}>
      {title}
    </Text>
  );

  if (user?.role !== 'admin') {
    return (
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <View className="flex-1 items-center justify-center p-6">
          <Shield size={64} color={isDark ? '#ef4444' : '#dc2626'} />
          <Text className={`text-xl font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Access Denied
          </Text>
          <Text className={`text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            This page is only accessible to administrators
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="pt-6 pb-4">
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Admin Management
          </Text>
          <Text className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage system settings and data
          </Text>
        </View>

        {/* User Management */}
        <SectionHeader title="User Management" />
        <AdminCard
          icon={Users}
          title="Manage Users"
          description="View, edit, and manage user accounts"
          onPress={() => router.push('/admin/manage-users')}
          color="#8b5cf6"
          bgColor="bg-purple-50"
          darkBgColor="bg-purple-900/20"
        />
        <AdminCard
          icon={UserPlus}
          title="Create User"
          description="Add new students, teachers, or admins"
          onPress={() => router.push('/admin/create-user')}
          color="#06b6d4"
          bgColor="bg-cyan-50"
          darkBgColor="bg-cyan-900/20"
        />

        {/* Academic Management */}
        <SectionHeader title="Academic Management" />
        <AdminCard
          icon={Building2}
          title="Manage Departments"
          description="Add, edit, or remove departments"
          onPress={() => router.push('/admin/departments')}
          color="#3b82f6"
          bgColor="bg-blue-50"
          darkBgColor="bg-blue-900/20"
        />
        <AdminCard
          icon={Calendar}
          title="Manage Academic Years"
          description="Configure academic years and terms"
          onPress={() => router.push('/admin/academic-years')}
          color="#10b981"
          bgColor="bg-green-50"
          darkBgColor="bg-green-900/20"
        />
        <AdminCard
          icon={BookOpen}
          title="Manage Courses"
          description="View and manage all courses"
          onPress={() => router.push('/courses')}
          color="#f59e0b"
          bgColor="bg-amber-50"
          darkBgColor="bg-amber-900/20"
        />

        {/* System Management */}
        <SectionHeader title="System Management" />
        <AdminCard
          icon={BarChart3}
          title="Analytics & Reports"
          description="View system statistics and reports"
          onPress={() => {
            // TODO: Navigate to analytics page
            router.push('/admin/analytics' as any);
          }}
          color="#ec4899"
          bgColor="bg-pink-50"
          darkBgColor="bg-pink-900/20"
        />
        <AdminCard
          icon={FileText}
          title="Activity Logs"
          description="View system activity and audit logs"
          onPress={() => {
            // TODO: Navigate to logs page
            router.push('/admin/logs' as any);
          }}
          color="#6366f1"
          bgColor="bg-indigo-50"
          darkBgColor="bg-indigo-900/20"
        />
        <AdminCard
          icon={Database}
          title="Database Management"
          description="Backup and restore database"
          onPress={() => {
            // TODO: Navigate to database page
            router.push('/admin/database' as any);
          }}
          color="#14b8a6"
          bgColor="bg-teal-50"
          darkBgColor="bg-teal-900/20"
        />
        <AdminCard
          icon={Settings}
          title="System Settings"
          description="Configure system preferences"
          onPress={() => {
            // TODO: Navigate to settings page
            router.push('/admin/settings' as any);
          }}
          color="#64748b"
          bgColor="bg-slate-50"
          darkBgColor="bg-slate-900/20"
        />
      </ScrollView>
    </View>
  );
}
