import { create } from 'zustand';
import { Notification, InsertNotification } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  createNotification: (notification: InsertNotification) => Promise<Notification>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
  
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/notifications', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const notifications = await res.json();
      
      const unreadCount = notifications.filter((n: Notification) => !n.sent).length;
      
      set({ 
        notifications, 
        unreadCount,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications' 
      });
    }
  },
  
  createNotification: async (notification) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest('POST', '/api/notifications', notification);
      const newNotification = await res.json();
      
      set(state => ({
        notifications: [...state.notifications, newNotification],
        unreadCount: state.unreadCount + 1,
        isLoading: false
      }));
      
      return newNotification;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create notification' 
      });
      throw error;
    }
  },
  
  markAllAsRead: async () => {
    set({ isLoading: true, error: null });
    try {
      const { notifications } = get();
      const unreadNotifications = notifications.filter(n => !n.sent);
                  
      await Promise.all(
        unreadNotifications.map(notification => 
          apiRequest('PUT', `/api/notifications/${notification.id}/mark-sent`)
        )
      );
      
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, sent: true })),
        unreadCount: 0,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to mark notifications as read' 
      });
    }
  },
  
  markAsRead: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest('PUT', `/api/notifications/${id}/mark-sent`);
      
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, sent: true } : n
        ),
        unreadCount: state.unreadCount - 1,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to mark notification as read' 
      });
    }
  },
}));
