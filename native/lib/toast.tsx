// Toast Notification

import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import ToastCard from '@/components/ui/toastCard';

export interface ToastConfig {
  title?: string;
  message: string;
  duration?: number;
  position?: 'top' | 'bottom';
  action?: {
    text: string;
    onPress: () => void;
  };
}

export const showToast = {
  /**
   * Show success toast
   */
  success: (message: string, config?: Partial<ToastConfig>) => {
    Toast.show({
      type: 'success',
      text1: config?.title || 'Success',
      text2: message,
      visibilityTime: config?.duration || 3000,
      position: config?.position || 'top',
      swipeable: false,
      topOffset: Platform.OS === 'ios' ? 60 : 40,
    });
  },

  /**
   * Show error toast
   */
  error: (message: string, config?: Partial<ToastConfig>) => {
    Toast.show({
      type: 'error',
      text1: config?.title || 'Error',
      text2: message,
      visibilityTime: config?.duration || 4000,
      position: config?.position || 'top',
      topOffset: Platform.OS === 'ios' ? 60 : 40,
    });
  },

  /**
   * Show info toast
   */
  info: (message: string, config?: Partial<ToastConfig>) => {
    Toast.show({
      type: 'info',
      text1: config?.title || 'Info',
      text2: message,
      visibilityTime: config?.duration || 3000,
      position: config?.position || 'top',
      topOffset: Platform.OS === 'ios' ? 60 : 40,
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string, config?: Partial<ToastConfig>) => {
    Toast.show({
      type: 'warning',
      text1: config?.title || 'Warning',
      text2: message,
      visibilityTime: config?.duration || 3500,
      position: config?.position || 'top',
      topOffset: Platform.OS === 'ios' ? 60 : 40,
    });
  },

  /**
   * Show loading toast
   */
  loading: (message: string) => {
    Toast.show({
      type: 'info',
      text1: 'Loading',
      text2: message,
      visibilityTime: 60000, // Long duration for loading
      position: 'top',
      topOffset: Platform.OS === 'ios' ? 60 : 40,
    });
  },

  /**
   * Hide current toast
   */
  hide: () => {
    Toast.hide();
  },

  /**
   * Show custom toast with action button
   */
  withAction: (config: ToastConfig & { type: 'success' | 'error' | 'info' | 'warning' }) => {
    Toast.show({
      type: config.type,
      text1: config.title || '',
      text2: config.message,
      visibilityTime: config.duration || 5000,
      position: config.position || 'top',
      topOffset: Platform.OS === 'ios' ? 60 : 40,
      props: {
        action: config.action
      }
    });
  }
};

// Custom toast config for react-native-toast-message
export const toastConfig = {
  success: ({ text1, text2, props }: any) => (
    <ToastCard text1={text1} text2={text2} type='success' props={props} />
  ),
  error: ({ text1, text2, props }: any) => (
    <ToastCard text1={text1} text2={text2} type='error' props={props} />
  ),
  info: ({ text1, text2, props }: any) => (
    <ToastCard text1={text1} text2={text2} type='info' props={props} />
  ),
  warning: ({ text1, text2, props }: any) => (
    <ToastCard text1={text1} text2={text2} type='warning' props={props} />
  ),
};

// Helper functions for common use cases
export const toastHelpers = {
  /**
   * Show success message for saved data
   */
  savedSuccessfully: (itemName: string = 'Item') => {
    showToast.success(`${itemName} saved successfully!`);
  },

  /**
   * Show success message for deleted data
   */
  deletedSuccessfully: (itemName: string = 'Item') => {
    showToast.success(`${itemName} deleted successfully!`);
  },

  /**
   * Show success message for created data
   */
  createdSuccessfully: (itemName: string = 'Item') => {
    showToast.success(`${itemName} created successfully!`);
  },

  /**
   * Show success message for updated data
   */
  updatedSuccessfully: (itemName: string = 'Item') => {
    showToast.success(`${itemName} updated successfully!`);
  },

  /**
   * Show network error
   */
  networkError: () => {
    showToast.error('No internet connection. Please check your network.', {
      duration: 4000
    });
  },

  /**
   * Show session expired
   */
  sessionExpired: () => {
    showToast.error('Your session has expired. Please login again.', {
      duration: 5000
    });
  },

  /**
   * Show coming soon feature
   */
  comingSoon: () => {
    showToast.info('This feature is coming soon!', {
      duration: 2500
    });
  }
};
