import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { LucideIcon, ChevronRight } from 'lucide-react-native';

interface ProfileMenuItemProps {
  icon: LucideIcon;
  title: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  iconColor?: string;
  iconBgColor?: string;
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({
  icon: Icon,
  title,
  value,
  onPress,
  showArrow = true,
  iconColor = '#3b82f6',
  iconBgColor,
}) => {
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl ${isWeb ? 'p-5' : 'p-4'} mb-3 bg-card dark:bg-card border border-border dark:border-border ease-in-out transition-all`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
      })}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View 
            className={`${isWeb ? 'w-12 h-12' : 'w-11 h-11'} rounded-xl items-center justify-center dark:bg-opacity-20`}
            style={{ backgroundColor: iconBgColor || `${iconColor}20` }}
          >
            <Icon size={isWeb ? 22 : 20} color={iconColor} />
          </View>
          <View className="ml-4 flex-1">
            <Text className={`${isWeb ? 'text-base' : 'text-sm'} font-semibold text-foreground dark:text-foreground`}>
              {title}
            </Text>
            {value && (
              <Text className={`${isWeb ? 'text-sm' : 'text-xs'} mt-1 text-muted-foreground dark:text-muted-foreground`}>
                {value}
              </Text>
            )}
          </View>
        </View>
        {showArrow && (
          <ChevronRight size={isWeb ? 20 : 18} color="#71717a" />
        )}
      </View>
    </Pressable>
  );
};

export { ProfileMenuItem };
export default ProfileMenuItem;