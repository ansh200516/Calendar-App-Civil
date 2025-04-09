import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await res.json();
      
      set({ 
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  },
  
  logout: async () => {
    set({ isLoading: true });
    try {
      await apiRequest('POST', '/api/auth/logout');
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed' 
      });
    }
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        set({ 
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        // Not authenticated but not an error
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      set({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed' 
      });
    }
  }
}));
