// Loading State Wrapper
// Smart component that handles loading, error, and empty states

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FullPageSkeleton } from './SkeletonComponents';
import { Ionicons } from '@expo/vector-icons';

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  onRetry?: () => void;
  skeleton?: 'list' | 'profile' | 'dashboard' | 'test';
  children: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  empty = false,
  emptyMessage = 'No data available',
  emptyIcon = 'folder-open-outline',
  onRetry,
  skeleton = 'list',
  children,
}) => {
  // Loading state
  if (loading) {
    return <FullPageSkeleton variant={skeleton} />;
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 text-center">
          Oops! Something went wrong
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center px-4">
          {error}
        </Text>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Empty state
  if (empty) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name={emptyIcon} size={64} color="#9ca3af" />
        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 text-center">
          {emptyMessage}
        </Text>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Refresh</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Success state - render children
  return <>{children}</>;
};

// Mini loading indicator for inline use
export const InlineLoader: React.FC<{ size?: 'small' | 'large' }> = ({ 
  size = 'small' 
}) => {
  return (
    <ActivityIndicator 
      size={size} 
      color="#3b82f6" 
      className="py-2"
    />
  );
};

// Button loading state
export const LoadingButton: React.FC<{
  loading: boolean;
  onPress: () => void;
  title: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}> = ({ 
  loading, 
  onPress, 
  title, 
  disabled = false,
  variant = 'primary'
}) => {
  const variantStyles = {
    primary: 'bg-blue-600 active:bg-blue-700',
    secondary: 'bg-gray-600 active:bg-gray-700',
    danger: 'bg-red-600 active:bg-red-700',
  };

  const disabledStyle = (loading || disabled) 
    ? 'opacity-50' 
    : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      className={`${variantStyles[variant]} ${disabledStyle} px-6 py-3 rounded-lg flex-row justify-center items-center`}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color="white" />
          <Text className="text-white font-semibold ml-2">Loading...</Text>
        </>
      ) : (
        <Text className="text-white font-semibold">{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// Page refresh indicator
export const RefreshIndicator: React.FC<{ visible: boolean }> = ({ 
  visible 
}) => {
  if (!visible) return null;

  return (
    <View className="absolute top-0 left-0 right-0 z-50 bg-blue-600 py-2 flex-row justify-center items-center">
      <ActivityIndicator size="small" color="white" />
      <Text className="text-white font-semibold ml-2">Refreshing...</Text>
    </View>
  );
};
