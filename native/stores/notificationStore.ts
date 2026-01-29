import { create } from 'zustand';

export interface Notification {
  id: number;
  user_id: number;
  type: 'test_reminder' | 'grade_update' | 'course_update' | 'system' | 'achievement' | 'discussion';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: number) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  setNotifications: (notifications) => {
    set({ notifications });
    get().updateUnreadCount();
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
    get().updateUnreadCount();
  },

  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ),
    }));
    get().updateUnreadCount();
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notif) => ({
        ...notif,
        is_read: true,
      })),
      unreadCount: 0,
    }));
  },

  deleteNotification: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter((notif) => notif.id !== notificationId),
    }));
    get().updateUnreadCount();
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  updateUnreadCount: () => {
    const count = get().notifications.filter((notif) => !notif.is_read).length;
    set({ unreadCount: count });
  },
}));
