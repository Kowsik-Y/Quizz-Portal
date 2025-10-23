import { View, ScrollView, Pressable, Platform, TextInput, Alert, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  FileText,
  User,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ActivityLog {
  id: number;
  user: string;
  action: string;
  type: 'login' | 'logout' | 'create' | 'edit' | 'delete' | 'error' | 'success';
  details: string;
  timestamp: string;
  ip?: string;
}

export default function ActivityLogsPage() {
  const { colorScheme } = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/home');
      return;
    }
    fetchLogs();
  }, [user]);

  const token = useAuthStore((state) => state.token);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/admin/logs?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setFilteredLogs(data.logs);
    } catch (error) {
      console.error('Fetch logs error:', error);
      Alert.alert('Error', 'Failed to load activity logs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let filtered = logs;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(log =>
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [searchQuery, filterType, logs]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'login': return LogIn;
      case 'logout': return LogOut;
      case 'create': return Plus;
      case 'edit': return Edit;
      case 'delete': return Trash2;
      case 'error': return XCircle;
      case 'success': return CheckCircle;
      default: return FileText;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'login': return '#10b981';
      case 'logout': return '#6b7280';
      case 'create': return '#3b82f6';
      case 'edit': return '#f59e0b';
      case 'delete': return '#ef4444';
      case 'error': return '#ef4444';
      case 'success': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  const LogItem = ({ log }: { log: ActivityLog }) => {
    const Icon = getIconForType(log.type);
    const color = getColorForType(log.type);

    return (
      <View
        className={`rounded-xl p-4 mb-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
      >
        <View className="flex-row items-start">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center`}
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={20} color={color} />
          </View>

          <View className="ml-3 flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {log.action}
              </Text>
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {formatTimestamp(log.timestamp)}
              </Text>
            </View>

            <Text className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {log.details}
            </Text>

            <View className="flex-row items-center">
              <User size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {log.user}
              </Text>
              {log.ip && (
                <>
                  <Text className={`text-xs mx-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    •
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {log.ip}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const FilterButton = ({ label, value }: { label: string; value: string }) => (
    <Pressable
      onPress={() => setFilterType(value)}
      className={`px-4 py-2 rounded-full ${filterType === value
          ? 'bg-blue-500'
          : isDark
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white border border-gray-200'
        }`}
    >
      <Text
        className={`text-sm font-semibold ${filterType === value ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'
          }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Activity Logs
          </Text>
          <Text className={`mt-1 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            System activity and audit trail
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setIsRefreshing(true);
            fetchLogs();
          }}
          disabled={isRefreshing}
          className={`p-3 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
        >
          <RefreshCw
            size={20}
            color={isDark ? '#9ca3af' : '#6b7280'}
            className={isRefreshing ? 'animate-spin' : ''}
          />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-4">
        <View
          className={`flex-row items-center rounded-xl px-4 py-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
        >
          <Search size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search logs..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            className={`flex-1 ml-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
          />
        </View>
      </View>

      {/* Filters */}
      <View className="px-6 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <FilterButton label="All" value="all" />
            <FilterButton label="Login" value="login" />
            <FilterButton label="Logout" value="logout" />
            <FilterButton label="Create" value="create" />
            <FilterButton label="Edit" value="edit" />
            <FilterButton label="Delete" value="delete" />
            <FilterButton label="Errors" value="error" />
          </View>
        </ScrollView>
      </View>

      {/* Stats */}
      <View className="px-6 mb-4">
        <View className="flex-row gap-3">
          <View
            className={`flex-1 rounded-xl p-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
          >
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Logs
            </Text>
            <Text className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {logs.length}
            </Text>
          </View>
          <View
            className={`flex-1 rounded-xl p-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
          >
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Filtered
            </Text>
            <Text className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {filteredLogs.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Logs List */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchLogs();
            }}
            tintColor={isDark ? '#9ca3af' : '#6b7280'}
          />
        }
      >
        {isLoading && filteredLogs.length === 0 ? (
          <View className="py-20 items-center">
            <RefreshCw size={48} color={isDark ? '#6b7280' : '#9ca3af'} className="animate-spin" />
            <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading logs...
            </Text>
          </View>
        ) : filteredLogs.length === 0 ? (
          <View className="py-20 items-center">
            <FileText size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No logs found
            </Text>
          </View>
        ) : (
          filteredLogs.map((log) => <LogItem key={log.id} log={log} />)
        )}
      </ScrollView>
    </View>
  );
}
