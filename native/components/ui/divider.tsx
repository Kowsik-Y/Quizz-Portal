import React from 'react';
import { View, ViewProps } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export interface DividerProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  labelPosition?: 'left' | 'center' | 'right';
}

export const Divider = ({ 
  className, 
  orientation = 'horizontal',
  label,
  labelPosition = 'center',
  ...props 
}: DividerProps) => {
  if (label) {
    const labelPositionStyles = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    };

    return (
      <View 
        className={cn('flex-row items-center gap-4', labelPositionStyles[labelPosition], className)}
        {...props}
      >
        {labelPosition !== 'left' && <View className="flex-1 h-[1px] bg-border" />}
        <Text className="text-sm text-muted-foreground">{label}</Text>
        {labelPosition !== 'right' && <View className="flex-1 h-[1px] bg-border" />}
      </View>
    );
  }

  if (orientation === 'vertical') {
    return (
      <View 
        className={cn('w-[1px] bg-border', className)}
        {...props}
      />
    );
  }

  return (
    <View 
      className={cn('h-[1px] bg-border', className)}
      {...props}
    />
  );
};

Divider.displayName = 'Divider';
