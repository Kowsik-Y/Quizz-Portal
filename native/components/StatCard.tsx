import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  color = 'blue',
  iconColor
}) => {
  const getColorClasses = () => {
    const colors: any = {
      blue: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500',
        icon: iconColor || '#3b82f6',
      },
      green: {
        bg: 'bg-green-500/20',
        border: 'border-green-500',
        icon: iconColor || '#10b981',
      },
      purple: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500',
        icon: iconColor || '#8b5cf6',
      },
      orange: {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500',
        icon: iconColor || '#f97316',
      },
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses();

  return (
    <View className="flex-1 min-w-[140px] rounded-xl p-4 bg-card border border-border">
      <View className={`self-start rounded-lg items-center justify-center mb-3`}>
        <Icon size={20} color={colorClasses.icon} />
      </View>
      <Text className="text-xl font-bold text-foreground">
        {value}
      </Text>
      <Text className="text-xs text-muted-foreground">
        {label}
      </Text>
    </View>
  );
};

export default StatCard;
