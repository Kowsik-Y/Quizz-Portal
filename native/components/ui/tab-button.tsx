import React from 'react';
import { Pressable } from 'react-native';
import { Text } from '@/components/ui/text';

interface TabButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress }) => (
  <Pressable
    onPress={onPress}
    className={`flex-1 py-3 rounded-lg ${
      isActive ? 'bg-blue-500' : 'bg-muted'
    }`}
  >
    <Text
      className={`text-center text-sm sm:text-base font-semibold ${
        isActive ? 'text-white' : 'text-muted-foreground'
      }`}
    >
      {title}
    </Text>
  </Pressable>
);
