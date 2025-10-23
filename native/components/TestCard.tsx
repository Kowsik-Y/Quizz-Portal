import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Clock, BookOpen } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';

interface TestCardProps {
  title: string;
  questions: number;
  duration: number;
  score?: number;
  completed?: boolean;
  width?: string | number;
  onRetake?: () => void;
}

export const TestCard: React.FC<TestCardProps> = ({ 
  title, 
  questions, 
  duration, 
  score, 
  completed = false,
  width = '100%',
  onRetake
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  return (
    <View
      className={`rounded-xl p-5 mb-4 ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
      style={{ width }}
    >
      {/* Title and Score Badge */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text 
            className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
        {completed && score !== undefined && (
          <View className="bg-green-500 rounded-full px-3 py-1 ml-2">
            <Text className="text-white font-semibold text-sm">{score}%</Text>
          </View>
        )}
      </View>

      {/* Test Info */}
      <View className="flex-row items-center gap-4 mb-4">
        <View className="flex-row items-center">
          <BookOpen size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
          <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {questions} questions
          </Text>
        </View>
        <View className="flex-row items-center">
          <Clock size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
          <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {duration} minutes
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        {completed ? (
          <>
            <Pressable className="flex-1 bg-blue-500 rounded-lg py-3">
              <Text className="text-white font-semibold text-center">Review Answers</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (onRetake) {
                  onRetake();
                } else {
                  router.push(`/tests/take-test?id=${test.id}`);
                }
              }}
              className={`flex-1 rounded-lg py-3 ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              <Text className={`text-center font-semibold ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Retake
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable 
            onPress={() => router.push(`/tests/take-test?id=${test.id}`)}
            className="flex-1 bg-blue-500 rounded-lg py-3"
          >
            <Text className="text-white font-semibold text-center">Start Test</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default TestCard;
