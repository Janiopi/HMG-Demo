import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import {
  getDatabase,
  getUserById,
  verifyCredentials,
  createUser,
} from '../services/database.service';
import type { AuthState } from '../types';

const AUTH_USER_KEY = 'auth_user_id';

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  isInitialized: false,

  /**
   * Initialize auth state from secure storage
   */
  initialize: async () => {
    try {
      set({ isLoading: true });

      // Ensure database is initialized
      await getDatabase();

      // Check if user is stored in secure storage
      const storedUserId = await SecureStore.getItemAsync(AUTH_USER_KEY);

      if (storedUserId) {
        const user = await getUserById(parseInt(storedUserId, 10));

        if (user) {
          set({
            isAuthenticated: true,
            user,
            isInitialized: true,
            isLoading: false,
          });
          return;
        }
      }

      // No valid stored session
      set({
        isAuthenticated: false,
        user: null,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        isAuthenticated: false,
        user: null,
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  /**
   * Login with username and password
   */
  login: async (username: string, password: string): Promise<boolean> => {
    try {
      set({ isLoading: true });

      const user = await verifyCredentials(username, password);

      if (user) {
        // Store user ID in secure storage
        await SecureStore.setItemAsync(AUTH_USER_KEY, user.id.toString());

        set({
          isAuthenticated: true,
          user,
          isLoading: false,
        });

        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  /**
   * Register a new user and auto-login
   */
  register: async (username: string, password: string): Promise<boolean> => {
    try {
      set({ isLoading: true });

      const user = await createUser(username.trim(), password);
      
      if (!user) {
        set({ isLoading: false });
        return false; // User already exists or error creating user
      }

      // Auto-login: Store user ID in secure storage
      await SecureStore.setItemAsync(AUTH_USER_KEY, user.id.toString());

      set({
        isAuthenticated: true,
        user,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('Register error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  /**
   * Logout and clear session
   */
  logout: async () => {
    try {
      set({ isLoading: true });

      // Clear secure storage
      await SecureStore.deleteItemAsync(AUTH_USER_KEY);

      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  },
}));
