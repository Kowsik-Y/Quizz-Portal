import { View, ScrollView, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { PlusCircle, GraduationCap, Users } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { ProfileMenuItem } from '@/components';

export default function CreatePage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  const createOptions = [
    {
      title: 'Create Course',
      description: 'Set up a new course with details and materials',
      icon: GraduationCap,
      color: '#3b82f6',
      route: '/courses/create-course',
      roles: ['teacher', 'admin']
    },
    {
      title: 'Admin Management',
      description: 'Manage users and their roles in the system',
      icon: Users,
      color: '#8b5cf6',
      route: '/admin',
      roles: ['admin']
    },
  ];

  const filteredOptions = createOptions.filter(
    option => option.roles.includes(user?.role || '')
  );


  return (
    <View className="flex-1 bg-background">
      <ScrollView className={`flex-1 ${isWeb ? 'px-8 py-6' : 'px-4 py-4'}`}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">
            Create New
          </Text>
          <Text className="text-base mt-2 text-muted-foreground">
            Choose what you want to create
          </Text>
        </View>

        {/* Role Badge */}
        {user?.role && (
          <View className="mb-6">
            <View
              className={`px-4 py-2 rounded-full self-start ${user.role === 'admin'
                ? 'bg-purple-500/20'
                : 'bg-green-500/20'
                }`}
            >
              <Text
                className={`text-sm font-semibold ${user.role === 'admin'
                  ? 'text-purple-500'
                  : 'text-green-500'
                  }`}
              >
                {user.role === 'admin' ? '👨‍💼 Admin Access' : '👨‍🏫 Teacher Access'}
              </Text>
            </View>
          </View>
        )}

        {/* Create Options */}
        <View>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <ProfileMenuItem key={index} icon={option.icon} title={option.title} value={option.description} onPress={() => router.push(option.route as any)} />
            ))
          ) : (
            <View className="items-center justify-center py-12">
              <PlusCircle size={64} className="text-muted-foreground" />
              <Text className="mt-4 text-lg font-semibold text-muted-foreground">
                No creation options available
              </Text>
              <Text className="mt-2 text-sm text-muted-foreground">
                Contact admin for access
              </Text>
            </View>
          )}
        </View>
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
