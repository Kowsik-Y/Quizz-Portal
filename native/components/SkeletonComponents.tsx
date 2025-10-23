// Skeleton Loading Components
// Beautiful skeleton screens for better loading UX

import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';

// Base Skeleton Component
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  className = '',
}) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#d1d5db', // gray-300
        },
        animatedStyle,
      ]}
      className={className}
    />
  );
};

// Test Card Skeleton
export const TestCardSkeleton: React.FC = () => {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Skeleton width="70%" height={20} borderRadius={4} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>

      {/* Description */}
      <Skeleton width="100%" height={14} borderRadius={4} className="mb-2" />
      <Skeleton width="80%" height={14} borderRadius={4} className="mb-3" />

      {/* Footer */}
      <View className="flex-row justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
        <Skeleton width={80} height={14} borderRadius={4} />
        <Skeleton width={100} height={14} borderRadius={4} />
      </View>
    </View>
  );
};

// Course Card Skeleton
export const CourseCardSkeleton: React.FC = () => {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm">
      {/* Image placeholder */}
      <Skeleton width="100%" height={120} borderRadius={8} className="mb-3" />

      {/* Title */}
      <Skeleton width="90%" height={18} borderRadius={4} className="mb-2" />

      {/* Description */}
      <Skeleton width="100%" height={12} borderRadius={4} className="mb-1" />
      <Skeleton width="70%" height={12} borderRadius={4} className="mb-3" />

      {/* Stats */}
      <View className="flex-row justify-between">
        <Skeleton width={70} height={14} borderRadius={4} />
        <Skeleton width={70} height={14} borderRadius={4} />
      </View>
    </View>
  );
};

// Question Skeleton
export const QuestionSkeleton: React.FC = () => {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
      {/* Question number */}
      <Skeleton width={100} height={16} borderRadius={4} className="mb-2" />

      {/* Question text */}
      <Skeleton width="100%" height={14} borderRadius={4} className="mb-2" />
      <Skeleton width="90%" height={14} borderRadius={4} className="mb-4" />

      {/* Options */}
      <View className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-row items-center mb-2">
            <Skeleton width={20} height={20} borderRadius={10} className="mr-3" />
            <Skeleton width="85%" height={14} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
};

// Profile Skeleton
export const ProfileSkeleton: React.FC = () => {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-6">
      {/* Avatar */}
      <View className="items-center mb-6">
        <Skeleton width={100} height={100} borderRadius={50} className="mb-3" />
        <Skeleton width={150} height={20} borderRadius={4} className="mb-1" />
        <Skeleton width={100} height={16} borderRadius={4} />
      </View>

      {/* Info fields */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} className="mb-4">
          <Skeleton width={80} height={12} borderRadius={4} className="mb-2" />
          <Skeleton width="100%" height={40} borderRadius={8} />
        </View>
      ))}
    </View>
  );
};

// List Skeleton (multiple items)
export const ListSkeleton: React.FC<{
  count?: number;
  ItemSkeleton?: React.FC;
}> = ({ count = 5, ItemSkeleton = TestCardSkeleton }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ItemSkeleton key={index} />
      ))}
    </>
  );
};

// Dashboard Stats Skeleton
export const StatCardSkeleton: React.FC = () => {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-1 mx-1">
      <Skeleton width={40} height={40} borderRadius={20} className="mb-3" />
      <Skeleton width="80%" height={16} borderRadius={4} className="mb-2" />
      <Skeleton width="60%" height={24} borderRadius={4} />
    </View>
  );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC = () => {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
      <Skeleton width="30%" height={14} borderRadius={4} />
      <Skeleton width="20%" height={14} borderRadius={4} />
      <Skeleton width="25%" height={14} borderRadius={4} />
      <Skeleton width="15%" height={14} borderRadius={4} />
    </View>
  );
};

// Search Bar Skeleton
export const SearchBarSkeleton: React.FC = () => {
  return (
    <Skeleton width="100%" height={48} borderRadius={24} className="mb-4" />
  );
};

// Button Skeleton
export const ButtonSkeleton: React.FC<{ width?: number | string }> = ({ 
  width = '100%' 
}) => {
  return <Skeleton width={width} height={48} borderRadius={8} />;
};

// Full Page Skeleton (combines multiple elements)
export const FullPageSkeleton: React.FC<{
  variant?: 'list' | 'profile' | 'dashboard' | 'test';
}> = ({ variant = 'list' }) => {
  if (variant === 'profile') {
    return (
      <View className="flex-1 p-4">
        <ProfileSkeleton />
      </View>
    );
  }

  if (variant === 'dashboard') {
    return (
      <View className="flex-1 p-4">
        <SearchBarSkeleton />
        <View className="flex-row mb-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </View>
        <View className="flex-row mb-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </View>
        <Skeleton width="40%" height={20} borderRadius={4} className="mb-3" />
        <ListSkeleton count={3} />
      </View>
    );
  }

  if (variant === 'test') {
    return (
      <View className="flex-1 p-4">
        <Skeleton width="100%" height={60} borderRadius={8} className="mb-4" />
        <QuestionSkeleton />
        <View className="flex-row justify-between">
          <ButtonSkeleton width="48%" />
          <ButtonSkeleton width="48%" />
        </View>
      </View>
    );
  }

  // Default: list variant
  return (
    <View className="flex-1 p-4">
      <SearchBarSkeleton />
      <ListSkeleton count={6} />
    </View>
  );
};
