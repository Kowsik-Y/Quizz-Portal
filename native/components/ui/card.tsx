import React from 'react';
import { View, ViewProps, Pressable, PressableProps } from 'react-native';
import { cn } from '@/lib/utils';

// Card Component
export interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ 
  children, 
  className, 
  variant = 'default',
  padding = 'md',
  style,
  ...props 
}: CardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantStyles = {
    default: 'bg-card rounded-2xl',
    elevated: 'bg-card rounded-2xl',
    outlined: 'bg-card rounded-2xl border-2 border-border',
  };

  const elevationStyle = variant === 'elevated' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  } : {};

  return (
    <View
      className={cn(variantStyles[variant], paddingStyles[padding], className)}
      style={[elevationStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
};

Card.displayName = 'Card';

// Pressable Card Component
export interface PressableCardProps extends Omit<PressableProps, 'style'> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: ViewProps['style'];
}

export const PressableCard = ({ 
  children, 
  className, 
  variant = 'default',
  padding = 'md',
  style,
  ...props 
}: PressableCardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantStyles = {
    default: 'bg-card rounded-2xl',
    elevated: 'bg-card rounded-2xl',
    outlined: 'bg-card rounded-2xl border-2 border-border',
  };

  const elevationStyle = variant === 'elevated' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  } : {};

  return (
    <Pressable
      className={cn(
        variantStyles[variant], 
        paddingStyles[padding], 
        'active:opacity-90',
        className
      )}
      style={[elevationStyle, style]}
      {...props}
    >
      {children}
    </Pressable>
  );
};

PressableCard.displayName = 'PressableCard';

// Card Header
export const CardHeader = ({ children, className, ...props }: ViewProps) => (
  <View className={cn('mb-4', className)} {...props}>
    {children}
  </View>
);

CardHeader.displayName = 'CardHeader';

// Card Content
export const CardContent = ({ children, className, ...props }: ViewProps) => (
  <View className={cn('', className)} {...props}>
    {children}
  </View>
);

CardContent.displayName = 'CardContent';

// Card Footer
export const CardFooter = ({ children, className, ...props }: ViewProps) => (
  <View className={cn('mt-4 flex-row gap-2', className)} {...props}>
    {children}
  </View>
);

CardFooter.displayName = 'CardFooter';

// Card Title
export const CardTitle = ({ children, className, ...props }: ViewProps) => (
  <View className={cn('', className)} {...props}>
    {children}
  </View>
);

CardTitle.displayName = 'CardTitle';
