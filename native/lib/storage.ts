import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage utility that uses cookies for web and AsyncStorage for mobile
 * Provides a unified interface for storing authentication tokens
 */

// Cookie utilities for web
const setCookie = (name: string, value: string, days: number = 7) => {
  if (Platform.OS !== 'web') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
};

const getCookie = (name: string): string | null => {
  if (Platform.OS !== 'web') return null;
  
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  if (Platform.OS !== 'web') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict;Secure`;
};

// Unified storage interface
export const SecureStorage = {
  /**
   * Store a value
   * Uses cookies for web, AsyncStorage for mobile
   */
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      setCookie(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  /**
   * Retrieve a value
   * Uses cookies for web, AsyncStorage for mobile
   */
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return getCookie(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  },

  /**
   * Remove a value
   * Uses cookies for web, AsyncStorage for mobile
   */
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      deleteCookie(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

// Export for convenience
export default SecureStorage;
