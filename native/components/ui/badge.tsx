import React from 'react';
import { View, ViewProps } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export interface BadgeProps extends ViewProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Badge = ({ 
  children, 
  className, 
  variant = 'default',
  size = 'md',
  ...props 
}: BadgeProps) => {
  const variantStyles = {
    default: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-green-100 dark:bg-green-900/30',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30',
    danger: 'bg-red-100 dark:bg-red-900/30',
    info: 'bg-blue-100 dark:bg-blue-900/30',
    outline: 'bg-transparent border-2 border-border',
  };

  const textVariantStyles = {
    default: 'text-primary-foreground',
    secondary: 'text-secondary-foreground',
    success: 'text-green-700 dark:text-green-300',
    warning: 'text-yellow-700 dark:text-yellow-300',
    danger: 'text-red-700 dark:text-red-300',
    info: 'text-blue-700 dark:text-blue-300',
    outline: 'text-foreground',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
    lg: 'px-4 py-1.5',
  };

  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <View
      className={cn(
        'rounded-full items-center justify-center',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <Text className={cn('font-semibold', textVariantStyles[variant], textSizeStyles[size])}>
        {children}
      </Text>
    </View>
  );
};

Badge.displayName = 'Badge';

// Dot Badge (for notifications, status indicators)
export interface DotBadgeProps extends Omit<ViewProps, 'children'> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export const DotBadge = ({ 
  className, 
  variant = 'danger',
  size = 'md',
  ...props 
}: DotBadgeProps) => {
  const variantStyles = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const sizeStyles = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <View
      className={cn(
        'rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
};

DotBadge.displayName = 'DotBadge';

// Count Badge (for notification counts)
export interface CountBadgeProps extends ViewProps {
  count: number;
  max?: number;
  variant?: 'default' | 'danger';
}

export const CountBadge = ({ 
  count, 
  max = 99,
  className, 
  variant = 'danger',
  ...props 
}: CountBadgeProps) => {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  const variantStyles = {
    default: 'bg-primary',
    danger: 'bg-red-500',
  };

  if (count === 0) return null;

  return (
    <View
      className={cn(
        'rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <Text className="text-white text-xs font-bold">
        {displayCount}
      </Text>
    </View>
  );
};

CountBadge.displayName = 'CountBadge';
