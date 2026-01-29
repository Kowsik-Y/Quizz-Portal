import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, Modal, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Bell, X } from 'lucide-react-native';
import { useNotificationStore } from '@/stores/notificationStore';
import { notificationAPI } from '@/lib/api';
import { NotificationList } from './NotificationList';
import { Button } from './ui/button';

interface NotificationBellProps {
    iconSize?: number;
    iconColor?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
    iconSize = 24,
    iconColor = '#6b7280',
}) => {
    const { unreadCount, setNotifications, markAllAsRead, clearAll, setLoading } = useNotificationStore();
    const [showModal, setShowModal] = useState(false);
    const isWeb = Platform.OS === 'web';
    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getAll({ limit: 50 });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setNotifications]);
    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [loadNotifications]);



    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            markAllAsRead();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleClearAll = async () => {
        try {
            await notificationAPI.deleteAll();
            clearAll();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };

    return (
        <>
            <Pressable
                onPress={() => setShowModal(true)}
                className="relative"
                style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                })}
            >
                <Bell size={iconSize} color={iconColor} />
                {unreadCount > 0 && (
                    <View className="absolute -top-1 -right-1 bg-destructive rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                        <Text className="text-[10px] font-bold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                    </View>
                )}
            </Pressable>

            <Modal
                visible={showModal}
                animationType={isWeb ? "fade" : "slide"}
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View className="flex-1 bg-black/50">
                    <Pressable
                        className="flex-1"
                        onPress={() => setShowModal(false)}
                    />
                    <View
                        className={`bg-background ${isWeb ? 'rounded-l-3xl' : 'rounded-t-3xl'}`}
                        style={{
                            position: isWeb ? 'absolute' : 'relative',
                            right: isWeb ? 0 : undefined,
                            top: isWeb ? 0 : undefined,
                            bottom: isWeb ? 0 : undefined,
                            width: isWeb ? 420 : '100%',
                            maxHeight: isWeb ? '100%' : '85%',
                            minHeight: isWeb ? '100%' : 500,
                        }}
                    >
                        {/* Header */}
                        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
                            <View>
                                <Text className="text-xl font-bold text-foreground">
                                    Notifications
                                </Text>
                                {unreadCount > 0 && (
                                    <Text className="text-sm text-muted-foreground mt-0.5">
                                        {unreadCount} unread
                                    </Text>
                                )}
                            </View>
                            <Pressable
                                onPress={() => setShowModal(false)}
                                className="w-10 h-10 rounded-full bg-muted items-center justify-center"
                            >
                                <X size={20} color="#6b7280" />
                            </Pressable>
                        </View>

                        {/* Actions */}
                        {unreadCount > 0 && (
                            <View className="px-6 py-3 flex-row gap-2 border-b border-border">
                                <Button
                                    onPress={handleMarkAllAsRead}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <Text className="text-sm font-medium text-foreground">
                                        Mark all read
                                    </Text>
                                </Button>
                                <Button
                                    onPress={handleClearAll}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <Text className="text-sm font-medium text-destructive">
                                        Clear all
                                    </Text>
                                </Button>
                            </View>
                        )}

                        {/* Notification List */}
                        <NotificationList
                            onNotificationPress={(notification) => {
                                // Handle notification tap - navigate to relevant screen
                                console.log('Notification pressed:', notification);
                                setShowModal(false);
                            }}
                            maxHeight={isWeb ? undefined : 600}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};
