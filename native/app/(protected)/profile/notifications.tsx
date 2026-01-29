import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  Bell,
  BellOff,
  CheckCircle,
  Trash2,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '@/lib/api';
import HeaderTile from '@/components/ui/headerTile';
import { useCustomAlert } from '@/components/ui/custom-alert';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationList } from '@/components/NotificationList';
import ToggleSwitch from '@/components/ui/switch';

export default function NotificationsPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { showAlert } = useCustomAlert();
  const { notifications, setNotifications, markAllAsRead, clearAll, setLoading } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    testReminders: true,
    gradeUpdates: true,
    courseUpdates: true,
    systemAnnouncements: true,
    achievementNotifications: true,
    discussionReplies: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll({ limit: 50 });
      setNotifications(response.data.notifications || []);
    } catch {
      console.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setNotifications]);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    loadNotificationSettings();
    loadNotifications();
  }, [user, router, loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const loadNotificationSettings = async () => {
    try {
      const response = await notificationAPI.getSettings();
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.error('Failed to load notification settings');
    }
  };

  const handleToggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await notificationAPI.updateSettings(settings);
      showAlert('Success', 'Notification preferences saved');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationAPI.sendTest();
      showAlert('Success', 'Test notification sent! Check your email and notifications.');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to send test notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      markAllAsRead();
      showAlert('Success', 'All notifications marked as read');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to mark as read');
    }
  };

  const handleClearAll = async () => {
    showAlert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationAPI.deleteAll();
              clearAll();
              showAlert('Success', 'All notifications cleared');
            } catch (error: any) {
              showAlert('Error', error.response?.data?.error || 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };



  const getActiveNotificationsCount = () => {
    return Object.values(settings).filter(Boolean).length;
  };

  return (
    <View className="flex-1 bg-background">
      <HeaderTile title="Notifications" foot="Manage your notification preferences" />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <View className="bg-card border border-border rounded-2xl mb-4 mt-4 overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
              <Text className="text-lg font-bold text-foreground">
                Recent Notifications
              </Text>
              <View className="flex-row gap-2">
                <Button
                  onPress={handleMarkAllRead}
                  variant="ghost"
                  size="sm"
                >
                  <CheckCircle size={16} color="#10b981" />
                  <Text className="text-xs font-medium text-foreground ml-1">
                    Mark all read
                  </Text>
                </Button>
                <Button
                  onPress={handleClearAll}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text className="text-xs font-medium text-destructive ml-1">
                    Clear
                  </Text>
                </Button>
              </View>
            </View>
            <NotificationList maxHeight={400} />
          </View>
        )}

        {/* Stats Card */}
        <View className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-4 mb-4 mt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-primary-foreground/80 mb-1">
                Active Notifications
              </Text>
              <Text className="text-3xl font-bold text-primary-foreground">
                {getActiveNotificationsCount()}
              </Text>
              <Text className="text-xs text-primary-foreground/80 mt-1">
                out of {Object.keys(settings).length}
              </Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
              <Bell size={32} color="#ffffff" />
            </View>
          </View>
        </View>

        {/* Delivery Methods */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4 gap-2">
          <Text className="text-lg font-bold mb-4 text-foreground">Delivery Methods</Text>

          <ToggleSwitch
            value={settings.emailNotifications}
            label="Email Notifications"
            description="Receive notifications via email"
            onToggle={() => handleToggleSetting("emailNotifications")}
          />

          <ToggleSwitch
            value={settings.pushNotifications}
            label="Push Notifications"
            description="Receive push notifications on your device"
            onToggle={() => handleToggleSetting("pushNotifications")}
          />
        </View>

        {/* Course & Academic */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4 gap-2">
          <Text className="text-lg font-bold mb-4 text-foreground">Course & Academic</Text>

          <ToggleSwitch
            value={settings.testReminders}
            label="Test Reminders"
            description="Get reminded about upcoming tests"
            onToggle={() => handleToggleSetting("testReminders")}
          />

          <ToggleSwitch
            value={settings.gradeUpdates}
            label="Grade Updates"
            description="Notifications when grades are posted"
            onToggle={() => handleToggleSetting("gradeUpdates")}
          />

          <ToggleSwitch
            value={settings.courseUpdates}
            label="Course Updates"
            description="Updates about your enrolled courses"
            onToggle={() => handleToggleSetting("courseUpdates")}
          />
        </View>

        {/* Community & System */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4 gap-2">
          <Text className="text-lg font-bold mb-4 text-foreground">Community & System</Text>

          <ToggleSwitch
            value={settings.systemAnnouncements}
            label="System Announcements"
            description="Important updates and announcements"
            onToggle={() => handleToggleSetting("systemAnnouncements")}
          />

          <ToggleSwitch
            value={settings.achievementNotifications}
            label="Achievement Notifications"
            description="Celebrate your accomplishments"
            onToggle={() => handleToggleSetting("achievementNotifications")}
          />

          <ToggleSwitch
            value={settings.discussionReplies}
            label="Discussion Replies"
            description="Notifications for discussion responses"
            onToggle={() => handleToggleSetting("discussionReplies")}
          />
        </View>

        {/* Actions */}
        <View className="gap-3 mb-4">
          <Button
            onPress={handleSaveSettings}
            disabled={isSaving}
            className="bg-primary sm:p-6"
          >
            <Text className="text-base font-medium text-primary-foreground">
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Text>
          </Button>

          <Button
            onPress={handleTestNotification}
            variant="outline"
            className='sm:p-6'
          >
            <View className="flex-row items-center justify-center">
              <Bell size={20} color="#6b7280" />
              <Text className="text-base font-medium text-foreground ml-2">
                Send Test Notification
              </Text>
            </View>
          </Button>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-3">
          <Button
            onPress={() => {
              const allEnabled = Object.fromEntries(
                Object.keys(settings).map(key => [key, true])
              );
              setSettings(allEnabled as typeof settings);
            }}
            variant="outline"
            className="flex-1 sm:p-6"
          >
            <View className="flex-row items-center justify-center">
              <Bell size={18} className="text-foreground mr-2" />
              <Text className="text-sm font-medium text-foreground">
                Enable All
              </Text>
            </View>
          </Button>

          <Button
            onPress={() => {
              const allDisabled = Object.fromEntries(
                Object.keys(settings).map(key => [key, false])
              );
              setSettings(allDisabled as typeof settings);
            }}
            variant="outline"
            className="flex-1 sm:p-6"
          >
            <View className="flex-row items-center justify-center">
              <BellOff size={18} className="text-foreground mr-2" />
              <Text className="text-sm font-medium text-foreground">
                Disable All
              </Text>
            </View>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
