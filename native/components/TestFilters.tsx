import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';

type FilterType = 'all' | 'instant' | 'booking' | 'timed' | 'booked';

interface TestFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'instant', label: 'Instant' },
  { key: 'booking', label: 'Booking' },
  { key: 'timed', label: 'Timed' },
  { key: 'booked', label: 'Booked' },
];

export const TestFilters: React.FC<TestFiltersProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <View className="flex-row gap-2 mt-0 sm:mt-3">
      {filterOptions.map((filter) => (
        <Pressable
          key={filter.key}
          onPress={() => onFilterChange(filter.key)}
          className={`px-3 py-2 rounded-lg ${
            activeFilter === filter.key ? 'bg-blue-500' : 'bg-muted'
          }`}
        >
          <Text
            className={`text-sm sm:text-base ${
              activeFilter === filter.key ? 'text-white' : 'text-foreground'
            } font-medium`}
          >
            {filter.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
