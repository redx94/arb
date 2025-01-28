import { create } from 'zustand';
import { Logger } from '../monitoring';
import { jwtDecode } from 'jwt-decode';

const logger = Logger.getInstance();

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      // Call your authentication API here
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const { token, user } = await response.json();
      localStorage.setItem('token', token);
      
      set({ user, token, isAuthenticated: true });
      logger.info('User logged in successfully', { userId: user.id });
    } catch (error) {
      logger.error('Login failed:', error as Error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
    logger.info('User logged out');
  },

  refreshToken: async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const { token } = await response.json();
      localStorage.setItem('token', token);
      
      const user = jwtDecode(token) as User;
      set({ token, user, isAuthenticated: true });
    } catch (error) {
      logger.error('Token refresh failed:', error as Error);
      set({ user: null, token: null, isAuthenticated: false });
    }
  }
}));