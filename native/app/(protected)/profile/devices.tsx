import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import HeaderTile from '@/components/ui/headerTile';
import { useCustomAlert } from '@/components/ui/custom-alert';

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
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { showAlert } = useCustomAlert();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/devices');
      setDevices(response.data.devices || []);
    } catch (error) {
      showAlert('Error', 'Failed to load devices');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchDevices();
  }, [user, router, fetchDevices]);

  const handleRemoveDevice = (deviceId: number, deviceName: string) => {
    showAlert(
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
              showAlert('Success', 'Device removed successfully');
              fetchDevices();
            } catch (error: any) {
              showAlert('Error', error.response?.data?.error || 'Failed to remove device');
            }
          }
        }
      ]
    );
  };

  const handleRemoveAllOthers = () => {
    showAlert(
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
              showAlert('Success', 'Logged out from all other devices');
              fetchDevices();
            } catch (error: any) {
              showAlert('Error', error.response?.data?.error || 'Failed to log out devices');
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
      <View className="rounded-xl p-4 mb-3 bg-card border border-border">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: `${statusColor}20` }}
            >
              <DeviceIcon size={24} color={statusColor} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-base text-foreground">
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
            <Button
              onPress={() => handleRemoveDevice(device.id, device.device_name)}
              variant="destructive"
              size="icon"
            >
              <Trash2 size={18} color="#ffffff" />
            </Button>
          )}
        </View>

        <View className="gap-2">
          <View className="flex-row items-center">
            <Text className="text-xs font-semibold w-20 text-muted-foreground">
              Browser
            </Text>
            <Text className="text-xs flex-1 text-foreground">
              {device.browser}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className="text-xs font-semibold w-20 text-muted-foreground">
              OS
            </Text>
            <Text className="text-xs flex-1 text-foreground">
              {device.os}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xs font-semibold w-20 text-muted-foreground">
              IP
            </Text>
            <Text className="text-xs flex-1 text-foreground">
              {device.ip_address}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xs font-semibold w-20 text-muted-foreground">
              Last Seen
            </Text>
            <Text className="text-xs flex-1 text-foreground">
              {formatDate(device.last_active)}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  return (
    <View className="flex-1 bg-background">

      <HeaderTile title='Your Devices' foot="Manage where you're logged in" />
      {/* Header */}
      <View className="px-6 pb-4">
        {/* Stats */}
        <View className="rounded-xl p-4 mt-4 bg-card border border-border">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-muted-foreground">
                Active Devices
              </Text>
              <Text className="text-2xl font-bold mt-1 text-foreground">
                {devices.filter(d => d.status === 'active' || d.status === 'recent').length}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">
                Total Devices
              </Text>
              <Text className="text-2xl font-bold mt-1 text-foreground">
                {devices.length}
              </Text>
            </View>
            {devices.length > 1 && (
              <Button
                onPress={handleRemoveAllOthers}
                variant="destructive"
                size="icon"
              >
                <LogOut size={18} color="#ffffff" />
              </Button>
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
            tintColor="#6b7280"
          />
        }
      >
        {isLoading && devices.length === 0 ? (
          <View className="py-20 items-center">
            <RefreshCw size={48} color="#6b7280" />
            <Text className="mt-4 text-lg text-muted-foreground">
              Loading devices...
            </Text>
          </View>
        ) : devices.length === 0 ? (
          <View className="py-20 items-center">
            <Smartphone size={48} color="#6b7280" />
            <Text className="mt-4 text-lg text-muted-foreground">
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
    </View>
  );
}
