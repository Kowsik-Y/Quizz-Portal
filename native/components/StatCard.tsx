import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getColorClasses = () => {
    const colors: any = {
      blue: {
        bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
        border: isDark ? 'border-blue-700' : 'border-blue-200',
        icon: iconColor || '#3b82f6',
      },
      green: {
        bg: isDark ? 'bg-green-900/30' : 'bg-green-50',
        border: isDark ? 'border-green-700' : 'border-green-200',
        icon: iconColor || '#10b981',
      },
      purple: {
        bg: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
        border: isDark ? 'border-purple-700' : 'border-purple-200',
        icon: iconColor || '#8b5cf6',
      },
      orange: {
        bg: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
        border: isDark ? 'border-orange-700' : 'border-orange-200',
        icon: iconColor || '#f97316',
      },
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses();

  return (
    <View className={`flex-1 min-w-[140px] rounded-xl p-4 ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <View className={`w-10 h-10 rounded-lg ${colorClasses.bg} border ${colorClasses.border} items-center justify-center mb-3`}>
        <Icon size={20} color={colorClasses.icon} />
      </View>
      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </Text>
      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </Text>
    </View>
  );
};

export default StatCard;
