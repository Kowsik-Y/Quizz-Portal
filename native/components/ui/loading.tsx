import React from 'react';
import { View, ViewProps, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

// Spinner Component
export interface SpinnerProps {
  size?: 'small' | 'large' | number;
  color?: string;
  className?: string;
}

export const Spinner = ({ 
  size = 'small', 
  color = '#3b82f6',
  className 
}: SpinnerProps) => {
  return (
    <View className={cn('items-center justify-center', className)}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

Spinner.displayName = 'Spinner';

// Loading Component
export interface LoadingProps extends ViewProps {
  text?: string;
  size?: 'small' | 'large' | number;
  color?: string;
}

export const Loading = ({ 
  text, 
  size = 'large',
  color = '#3b82f6',
  className,
  ...props 
}: LoadingProps) => {
  return (
    <View 
      className={cn('flex-1 items-center justify-center gap-4', className)}
      {...props}
    >
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-muted-foreground text-center">{text}</Text>
      )}
    </View>
  );
};

Loading.displayName = 'Loading';

// Skeleton Component
export interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = ({ 
  width = '100%',
  height = 20,
  variant = 'rectangular',
  className,
  style,
  ...props 
}: SkeletonProps) => {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const widthValue = typeof width === 'number' ? width : undefined;
  const heightValue = variant === 'circular' ? widthValue || height : height;

  return (
    <View
      className={cn(
        'bg-secondary/50 animate-pulse',
        variantStyles[variant],
        typeof width === 'string' ? 'w-full' : '',
        className
      )}
      style={[
        widthValue !== undefined && { width: widthValue },
        { height: heightValue },
        style
      ]}
      {...props}
    />
  );
};

Skeleton.displayName = 'Skeleton';

// Empty State Component
export interface EmptyStateProps extends ViewProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ 
  icon,
  title,
  description,
  action,
  className,
  ...props 
}: EmptyStateProps) => {
  return (
    <View 
      className={cn('flex-1 items-center justify-center px-6 py-12', className)}
      {...props}
    >
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-lg font-semibold text-foreground text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-muted-foreground text-center mb-6">
          {description}
        </Text>
      )}
      {action && <View>{action}</View>}
    </View>
  );
};

EmptyState.displayName = 'EmptyState';
