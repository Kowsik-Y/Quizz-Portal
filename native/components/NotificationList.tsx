import React from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Bell,
  Calendar,
  CheckCircle,
  BookOpen,
  Trophy,
  MessageSquare,
  AlertCircle,
  X,
  Check,
} from 'lucide-react-native';
import { useNotificationStore, Notification } from '@/stores/notificationStore';
import { format } from 'date-fns';

interface NotificationListProps {
  onNotificationPress?: (notification: Notification) => void;
  maxHeight?: number;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'test_reminder':
      return { Icon: Calendar, color: '#f59e0b' };
    case 'grade_update':
      return { Icon: CheckCircle, color: '#10b981' };
    case 'course_update':
      return { Icon: BookOpen, color: '#6366f1' };
    case 'achievement':
      return { Icon: Trophy, color: '#f59e0b' };
    case 'discussion':
      return { Icon: MessageSquare, color: '#06b6d4' };
    case 'system':
      return { Icon: AlertCircle, color: '#ef4444' };
    default:
      return { Icon: Bell, color: '#6b7280' };
  }
};

const formatNotificationTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d');
  }
};

export const NotificationList: React.FC<NotificationListProps> = ({
  onNotificationPress,
  maxHeight,
}) => {
  const { notifications, isLoading, markAsRead, deleteNotification } = useNotificationStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Refresh logic will be handled by parent component
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    onNotificationPress?.(notification);
  };

  const handleDelete = (e: any, notificationId: number) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const handleMarkAsRead = (e: any, notificationId: number) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  if (notifications.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <View className="w-20 h-20 rounded-full bg-muted items-center justify-center mb-4">
          <Bell size={32} color="#6b7280" />
        </View>
        <Text className="text-lg font-semibold text-foreground mb-2">
          No notifications
        </Text>
        <Text className="text-sm text-muted-foreground text-center px-8">
          You're all caught up! We'll notify you when something new happens.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={maxHeight ? { maxHeight } : undefined}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {notifications.map((notification, index) => {
        const { Icon, color } = getNotificationIcon(notification.type);
        
        return (
          <Pressable
            key={notification.id}
            onPress={() => handleNotificationPress(notification)}
            className={`px-4 py-4 border-b border-border ${
              !notification.is_read ? 'bg-primary/5' : 'bg-background'
            }`}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View className="flex-row items-start">
              {/* Icon */}
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon size={20} color={color} />
              </View>

              {/* Content */}
              <View className="flex-1">
                <View className="flex-row items-start justify-between mb-1">
                  <Text
                    className={`flex-1 text-sm ${
                      !notification.is_read ? 'font-bold' : 'font-semibold'
                    } text-foreground pr-2`}
                  >
                    {notification.title}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {formatNotificationTime(notification.created_at)}
                  </Text>
                </View>

                <Text
                  className="text-sm text-muted-foreground mb-2"
                  numberOfLines={2}
                >
                  {notification.message}
                </Text>

                {/* Action Buttons */}
                <View className="flex-row items-center gap-2">
                  {!notification.is_read && (
                    <Pressable
                      onPress={(e) => handleMarkAsRead(e, notification.id)}
                      className="flex-row items-center px-3 py-1.5 rounded-lg bg-primary/10"
                    >
                      <Check size={14} color="#3b82f6" />
                      <Text className="text-xs font-medium text-primary ml-1">
                        Mark read
                      </Text>
                    </Pressable>
                  )}
                  
                  <Pressable
                    onPress={(e) => handleDelete(e, notification.id)}
                    className="flex-row items-center px-3 py-1.5 rounded-lg bg-destructive/10"
                  >
                    <X size={14} color="#ef4444" />
                    <Text className="text-xs font-medium text-destructive ml-1">
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Unread indicator */}
              {!notification.is_read && (
                <View className="w-2 h-2 rounded-full bg-primary ml-2 mt-1" />
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
