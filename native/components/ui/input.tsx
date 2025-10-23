import React, { forwardRef, useState } from 'react';
import { View, TextInput as RNTextInput, TextInputProps as RNTextInputProps, Pressable, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { LucideIcon, Eye, EyeOff, Search, X } from 'lucide-react-native';

export interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  variant?: 'default' | 'filled' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<RNTextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconPress,
      containerClassName,
      inputClassName,
      labelClassName,
      variant = 'default',
      size = 'md',
      editable = true,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const sizeStyles = {
      sm: 'py-2 text-sm',
      md: 'py-3 text-base',
      lg: 'py-4 text-lg',
    };

    const variantStyles = {
      default: cn(
        'bg-secondary/50 border-2 border-border',
        isFocused && 'border-primary',
        error && 'border-destructive'
      ),
      filled: cn(
        'bg-secondary border-2 border-transparent',
        isFocused && 'border-primary bg-secondary/70',
        error && 'border-destructive'
      ),
      outline: cn(
        'bg-transparent border-2 border-border',
        isFocused && 'border-primary',
        error && 'border-destructive'
      ),
    };

    return (
      <View className={cn('w-full', containerClassName)}>
        {label && (
          <Text className={cn('text-sm font-bold mb-3 text-foreground ml-1', labelClassName)}>
            {label}
          </Text>
        )}
        
        <View
          className={cn(
            'flex-row items-center rounded-2xl px-5',
            sizeStyles[size],
            variantStyles[variant],
            !editable && 'opacity-50',
            className
          )}
        >
          {LeftIcon && (
            <LeftIcon size={22} color={error ? '#ef4444' : '#3b82f6'} />
          )}
          
          <RNTextInput
            ref={ref}
            className={cn(
              'flex-1 text-foreground font-medium w-full',
              LeftIcon && 'ml-4',
              RightIcon && 'mr-4',
              inputClassName
            )}
            style={[
              {
                paddingVertical: 5,
                paddingHorizontal: Platform.OS === 'web' ? 10 : 0,
                margin: 0,
                // Use Poppins Medium for inputs
                fontFamily: 'Poppins_500Medium',
                // Don't set fontWeight on Android - causes system font fallback
                ...(Platform.OS !== 'android' && { fontWeight: '500' as const }),
              },
              style
            ]}
            placeholderTextColor={error ? '#f87171' : '#9ca3af'}
            editable={editable}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {RightIcon && (
            <Pressable
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              className="ml-2"
            >
              <RightIcon size={22} color={error ? '#ef4444' : '#6b7280'} />
            </Pressable>
          )}
        </View>

        {error && (
          <Text className="text-xs text-destructive mt-1.5 ml-1 font-medium">
            {error}
          </Text>
        )}
        
        {hint && !error && (
          <Text className="text-xs text-muted-foreground mt-1.5 ml-1">
            {hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

// Password Input Component
export interface PasswordInputProps extends Omit<InputProps, 'secureTextEntry' | 'rightIcon' | 'onRightIconPress'> {}

export const PasswordInput = forwardRef<RNTextInput, PasswordInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        ref={ref}
        secureTextEntry={!showPassword}
        rightIcon={showPassword ? EyeOff : Eye}
        onRightIconPress={() => setShowPassword(!showPassword)}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

// TextArea Component
export interface TextAreaProps extends InputProps {
  rows?: number;
}

export const TextArea = forwardRef<RNTextInput, TextAreaProps>(
  (
    {
      rows = 4,
      style,
      ...props
    },
    ref
  ) => {
    const lineHeight = 20;
    const minHeight = rows * lineHeight + 32; // 32 for padding

    return (
      <Input
        ref={ref}
        {...props}
        multiline
        numberOfLines={rows}
        style={[
          { 
            minHeight, 
            textAlignVertical: 'top',
            paddingTop: 8,
          },
          style
        ]}
      />
    );
  }
);

TextArea.displayName = 'TextArea';

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<RNTextInput, SearchInputProps>(
  (
    {
      onClear,
      value,
      ...props
    },
    ref
  ) => {
    return (
      <Input
        ref={ref}
        {...props}
        value={value}
        leftIcon={Search}
        rightIcon={value ? X : undefined}
        onRightIconPress={onClear}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
