import { View, ScrollView, Pressable, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { PlusCircle, GraduationCap, FileText, Users, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';

export default function CreatePage() {
  const { colorScheme } = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isDark = colorScheme === 'dark';
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

  const OptionCard = ({ option }: any) => (
    <Pressable
      onPress={() => router.push(option.route as any)}
      className={`rounded-xl p-6 mb-4 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: option.color + '20' }}
            >
              <option.icon size={24} color={option.color} />
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {option.title}
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {option.description}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
      </View>
    </Pressable>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className={`flex-1 ${isWeb ? 'px-8 py-6' : 'px-4 py-4'}`}>
        {/* Header */}
        <View className="mb-6">
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Create New
          </Text>
          <Text className={`text-base mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose what you want to create
          </Text>
        </View>

        {/* Role Badge */}
        {user?.role && (
          <View className="mb-6">
            <View
              className={`px-4 py-2 rounded-full self-start ${user.role === 'admin'
                  ? isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                  : isDark ? 'bg-green-900/30' : 'bg-green-100'
                }`}
            >
              <Text
                className={`text-sm font-semibold ${user.role === 'admin'
                    ? isDark ? 'text-purple-300' : 'text-purple-700'
                    : isDark ? 'text-green-300' : 'text-green-700'
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
              <OptionCard key={index} option={option} />
            ))
          ) : (
            <View className="items-center justify-center py-12">
              <PlusCircle size={64} color={isDark ? '#6b7280' : '#9ca3af'} />
              <Text className={`mt-4 text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No creation options available
              </Text>
              <Text className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
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
