import React from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { LucideIcon } from 'lucide-react-native';

interface ProfileStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export const ProfileStatCard: React.FC<ProfileStatCardProps> = ({
  label,
  value,
  icon: Icon,
  color = '#3b82f6',
}) => {
  const isWeb = Platform.OS === 'web';

  return (
    <View 
      className={`flex-1 rounded-2xl ${isWeb ? 'p-6' : 'p-4'} bg-card dark:bg-card border border-border dark:border-border shadow-sm`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className={`${isWeb ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl items-center justify-center mb-3 dark:bg-opacity-20`} style={{ backgroundColor: `${color}20` }}>
        <Icon size={isWeb ? 24 : 20} color={color} />
      </View>
      <Text className={`${isWeb ? 'text-3xl' : 'text-2xl'} font-bold text-foreground dark:text-foreground mb-1`}>
        {value}
      </Text>
      <Text className={`${isWeb ? 'text-sm' : 'text-xs'} text-muted-foreground dark:text-muted-foreground font-medium`}>
        {label}
      </Text>
    </View>
  );
};
