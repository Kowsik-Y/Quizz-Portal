import { View, ScrollView, Pressable, Platform, Alert, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Smartphone,
  Monitor,
  Tablet,
  Trash2,
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  MapPin,
  ChevronLeft
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useWebAlert } from '@/components/ui/web-alert';
import HeaderTile from '@/components/ui/headerTile';

interface Device {
  id: number;
  device_name: string;
  device_type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  ip_address: string;
  last_active: string;
  created_at: string;
  status: 'active' | 'recent' | 'inactive' | 'expired';
}

export default function UserDevicesPage() {
  const { colorScheme } = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showAlert, AlertComponent } = useWebAlert();
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchDevices();
  }, [user]);


  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/devices');
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Fetch devices error:', error);
      const errorAlertFunc = isWeb ? showAlert : Alert.alert;
      errorAlertFunc('Error', 'Failed to load devices');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRemoveDevice = (deviceId: number, deviceName: string) => {
    const alertFunc = isWeb ? showAlert : Alert.alert;

    alertFunc(
      'Remove Device',
      `Remove "${deviceName}" from your account? You'll need to log in again on that device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/devices/${deviceId}`);
              const successAlertFunc = isWeb ? showAlert : Alert.alert;
              successAlertFunc('Success', 'Device removed successfully');
              fetchDevices();
            } catch (error: any) {
              const errorAlertFunc = isWeb ? showAlert : Alert.alert;
              errorAlertFunc('Error', error.response?.data?.error || 'Failed to remove device');
            }
          }
        }
      ]
    );
  };

  const handleRemoveAllOthers = () => {
    const alertFunc = isWeb ? showAlert : Alert.alert;

    alertFunc(
      'Log Out All Other Devices',
      'This will log you out from all devices except this one. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out All',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/devices/remove-all-except-current');
              const successAlertFunc = isWeb ? showAlert : Alert.alert;
              successAlertFunc('Success', 'Logged out from all other devices');
              fetchDevices();
            } catch (error: any) {
              const errorAlertFunc = isWeb ? showAlert : Alert.alert;
              errorAlertFunc('Error', error.response?.data?.error || 'Failed to log out devices');
            }
          }
        }
      ]
    );
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Monitor;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'; // green
      case 'recent': return '#3b82f6'; // blue
      case 'inactive': return '#f59e0b'; // orange
      case 'expired': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'recent': return Clock;
      case 'inactive': return Clock;
      case 'expired': return XCircle;
      default: return Clock;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active Now';
      case 'recent': return 'Recent';
      case 'inactive': return 'Inactive';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  const DeviceCard = ({ device }: { device: Device }) => {
    const DeviceIcon = getDeviceIcon(device.device_type);
    const StatusIcon = getStatusIcon(device.status);
    const statusColor = getStatusColor(device.status);

    return (
      <View
        className={`rounded-xl p-4 mb-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: `${statusColor}20` }}
            >
              <DeviceIcon size={24} color={statusColor} />
            </View>
            <View className="flex-1">
              <Text className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {device.device_name}
              </Text>
              <View className="flex-row items-center mt-1">
                <StatusIcon size={14} color={statusColor} />
                <Text className="text-xs ml-1" style={{ color: statusColor }}>
                  {getStatusLabel(device.status)}
                </Text>
              </View>
            </View>
          </View>

          {device.status !== 'active' && (
            <Pressable
              onPress={() => handleRemoveDevice(device.id, device.device_name)}
              className={`p-2 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'
                }`}
            >
              <Trash2 size={18} color="#ef4444" />
            </Pressable>
          )}
        </View>

        <View className="gap-2">
          <View className="flex-row items-center">
            <Text className={`text-xs font-semibold w-20 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Browser
            </Text>
            <Text className={`text-xs flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {device.browser}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className={`text-xs font-semibold w-20 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              OS
            </Text>
            <Text className={`text-xs flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {device.os}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className={`text-xs font-semibold w-20 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              IP
            </Text>
            <Text className={`text-xs flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {device.ip_address}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className={`text-xs font-semibold w-20 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Last Seen
            </Text>
            <Text className={`text-xs flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {formatDate(device.last_active)}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  const canGoBack = router.canGoBack?.() ?? false;
  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>

      <HeaderTile title='Your Devices' foot="Manage where you're logged in" />
      {/* Header */}
      <View className="px-6 pb-4">
        {/* Stats */}
        <View
          className={`rounded-xl p-4 mt-4 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Devices
              </Text>
              <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {devices.filter(d => d.status === 'active' || d.status === 'recent').length}
              </Text>
            </View>
            <View>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Devices
              </Text>
              <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {devices.length}
              </Text>
            </View>
            {devices.length > 1 && (
              <Pressable
                onPress={handleRemoveAllOthers}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'
                  }`}
              >
                <LogOut size={18} color="#ef4444" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Devices List */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchDevices();
            }}
            tintColor={isDark ? '#9ca3af' : '#6b7280'}
          />
        }
      >
        {isLoading && devices.length === 0 ? (
          <View className="py-20 items-center">
            <RefreshCw size={48} color={isDark ? '#6b7280' : '#9ca3af'} className="animate-spin" />
            <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading devices...
            </Text>
          </View>
        ) : devices.length === 0 ? (
          <View className="py-20 items-center">
            <Smartphone size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No devices found
            </Text>
          </View>
        ) : (
          <>
            {devices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Web Alert Component */}
      {isWeb && <AlertComponent />}
    </View>
  );
}
