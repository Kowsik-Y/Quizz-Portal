import React from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { User } from 'lucide-react-native';
import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  name?: string;
  email?: string;
  role?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name = 'User',
  email = '',
  role = 'student',
}) => {
  const isWeb = Platform.OS === 'web';

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole.toLowerCase()) {
      case 'admin':
        return 'default' as const;
      case 'teacher':
        return 'success' as const;
      default:
        return 'info' as const;
    }
  };

  const getRoleColor = (userRole: string) => {
    switch (userRole.toLowerCase()) {
      case 'admin':
        return '#8b5cf6';
      case 'teacher':
        return '#10b981';
      default:
        return '#3b82f6';
    }
  };

  return (
    <View 
      className={`rounded-3xl ${isWeb ? 'p-8' : 'p-6'} mb-6 bg-card dark:bg-card border border-border dark:border-border`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View className="items-center">
        {/* Avatar */}
        <View 
          className={`${isWeb ? 'w-28 h-28' : 'w-24 h-24'} rounded-full items-center justify-center mb-4 shadow-lg`}
          style={{ 
            backgroundColor: getRoleColor(role),
            shadowColor: getRoleColor(role),
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }}
        >
          <User size={isWeb ? 48 : 40} color="#fff" strokeWidth={2} />
        </View>

        {/* Name */}
        <Text className={`${isWeb ? 'text-3xl' : 'text-2xl'} font-bold text-foreground dark:text-foreground mb-2`}>
          {name}
        </Text>

        {/* Email */}
        <Text className={`${isWeb ? 'text-base' : 'text-sm'} text-muted-foreground dark:text-muted-foreground mb-4`}>
          {email}
        </Text>

        {/* Role Badge */}
        <Badge 
          variant={getRoleBadgeVariant(role)} 
          size={isWeb ? "lg" : "default"}
          className="px-6 py-2"
        >
          <Text className={`font-bold capitalize ${isWeb ? 'text-sm' : 'text-xs'}`}>
            {role}
          </Text>
        </Badge>
      </View>
    </View>
  );
};
