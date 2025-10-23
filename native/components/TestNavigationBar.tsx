import React from 'react';
import { View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle
} from 'lucide-react-native';

interface TestNavigationBarProps {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestions: Set<number>;
  flaggedQuestions: Set<number>;
  onNavigate: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  timeRemaining?: number;
}

export function TestNavigationBar({
  totalQuestions,
  currentIndex,
  answeredQuestions,
  flaggedQuestions,
  onNavigate,
  onPrevious,
  onNext,
  onSubmit,
  timeRemaining
}: TestNavigationBarProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index: number) => {
    if (answeredQuestions.has(index)) return 'answered';
    if (flaggedQuestions.has(index)) return 'flagged';
    return 'unanswered';
  };

  return (
    <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Question Palette - Desktop/Web Only */}
      {!isWeb && (
        <View className="p-4 border-b border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-gray-900 dark:text-white">Question Palette</Text>
            {timeRemaining !== undefined && (
              <View className="flex-row items-center gap-2">
                <Clock size={16} color={timeRemaining < 300 ? '#ef4444' : '#6b7280'} />
                <Text
                  className={`font-mono font-bold ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                  {formatTime(timeRemaining)}
                </Text>
              </View>
            )}
          </View>

          {/* Question Grid */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {Array.from({ length: totalQuestions }, (_, i) => {
              const status = getQuestionStatus(i);
              const isCurrent = i === currentIndex;

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => onNavigate(i)}
                  className={`
                    w-12 h-12 rounded-lg items-center justify-center border-2
                    ${isCurrent
                      ? 'border-blue-500 bg-blue-500'
                      : status === 'answered'
                        ? 'border-green-500 bg-green-500/10'
                        : status === 'flagged'
                          ? 'border-orange-500 bg-orange-500/10'
                          : isDark
                            ? 'border-gray-600 bg-gray-700'
                            : 'border-gray-300 bg-gray-50'
                    }
                  `}
                >
                  <Text
                    className={`
                      font-bold text-sm
                      ${isCurrent
                        ? 'text-white'
                        : status === 'answered'
                          ? 'text-green-600 dark:text-green-400'
                          : status === 'flagged'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-600 dark:text-gray-400'
                      }
                    `}
                  >
                    {i + 1}
                  </Text>
                  {status === 'flagged' && (
                    <Flag
                      size={10}
                      color="#f97316"
                      fill="#f97316"
                      style={{ position: 'absolute', top: 2, right: 2 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Legend */}
          <View className="flex-row gap-4 mt-4 flex-wrap">
            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 rounded bg-green-500/20 border-2 border-green-500" />
              <Text className="text-xs text-gray-600 dark:text-gray-400">Answered</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 rounded bg-orange-500/20 border-2 border-orange-500" />
              <Text className="text-xs text-gray-600 dark:text-gray-400">Flagged</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600" />
              <Text className="text-xs text-gray-600 dark:text-gray-400">Not Visited</Text>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Navigation Bar */}
      <View className="flex-row items-center justify-between p-4">
        {/* Previous Button */}
        <TouchableOpacity
          onPress={onPrevious}
          disabled={currentIndex === 0}
          className={`
            flex-row items-center gap-2 px-4 py-3 rounded-lg
            ${currentIndex === 0
              ? 'bg-gray-100 dark:bg-gray-700'
              : 'bg-blue-500'
            }
          `}
        >
          <ChevronLeft size={20} color={currentIndex === 0 ? '#9ca3af' : '#fff'} />
          <Text
            className={`font-semibold ${currentIndex === 0 ? 'text-gray-400' : 'text-white'
              }`}
          >
            Previous
          </Text>
        </TouchableOpacity>

        {/* Question Counter - Mobile */}
        {!isWeb && (
          <View className="items-center">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentIndex + 1} / {totalQuestions}
            </Text>
            <View className="flex-row gap-2 mt-1">
              <View className="flex-row items-center gap-1">
                <CheckCircle size={12} color="#22c55e" />
                <Text className="text-xs text-gray-600 dark:text-gray-400">
                  {answeredQuestions.size}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Flag size={12} color="#f97316" />
                <Text className="text-xs text-gray-600 dark:text-gray-400">
                  {flaggedQuestions.size}
                </Text>
              </View>
            </View>
            {timeRemaining !== undefined && (
              <View className="flex-row items-center gap-1 mt-1">
                <Clock size={12} color={timeRemaining < 300 ? '#ef4444' : '#6b7280'} />
                <Text
                  className={`text-xs font-mono font-bold ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                  {formatTime(timeRemaining)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Desktop Counter */}
        {isWeb && (
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Question {currentIndex + 1} of {totalQuestions}
          </Text>
        )}

        {/* Next/Submit Button */}
        {currentIndex === totalQuestions - 1 ? (
          <TouchableOpacity
            onPress={onSubmit}
            className="flex-row items-center gap-2 px-6 py-3 rounded-lg bg-green-500"
          >
            <CheckCircle size={20} color="#fff" />
            <Text className="font-semibold text-white">Submit Test</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onNext}
            className="flex-row items-center gap-2 px-4 py-3 rounded-lg bg-blue-500"
          >
            <Text className="font-semibold text-white">Next</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Sidebar Question Navigator for Desktop
export function TestSidebar({
  totalQuestions,
  currentIndex,
  answeredQuestions,
  flaggedQuestions,
  onNavigate,
  timeRemaining,
  testTitle
}: TestNavigationBarProps & { testTitle?: string }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index: number) => {
    if (answeredQuestions.has(index)) return 'answered';
    if (flaggedQuestions.has(index)) return 'flagged';
    return 'unanswered';
  };

  const stats = {
    answered: answeredQuestions.size,
    flagged: flaggedQuestions.size,
    notVisited: totalQuestions - answeredQuestions.size
  };

  return (
    <View
      className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l`}
      style={{ width: 280 }}
    >
      {/* Header */}
      <View className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {testTitle || 'Test'}
        </Text>
        {timeRemaining !== undefined && (
          <View className={`p-3 rounded-lg ${timeRemaining < 300
            ? 'bg-red-500/10 border border-red-500'
            : 'bg-blue-500/10 border border-blue-500'
            }`}>
            <View className="flex-row items-center justify-between">
              <Text className={`text-sm font-semibold ${timeRemaining < 300 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                Time Remaining
              </Text>
              <Clock size={16} color={timeRemaining < 300 ? '#ef4444' : '#3b82f6'} />
            </View>
            <Text className={`text-2xl font-bold font-mono mt-1 ${timeRemaining < 300 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          Progress
        </Text>
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <CheckCircle size={16} color="#22c55e" />
              <Text className="text-sm text-gray-700 dark:text-gray-300">Answered</Text>
            </View>
            <Text className="font-bold text-gray-900 dark:text-white">{stats.answered}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Flag size={16} color="#f97316" />
              <Text className="text-sm text-gray-700 dark:text-gray-300">Flagged</Text>
            </View>
            <Text className="font-bold text-gray-900 dark:text-white">{stats.flagged}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Circle size={16} color="#6b7280" />
              <Text className="text-sm text-gray-700 dark:text-gray-300">Not Visited</Text>
            </View>
            <Text className="font-bold text-gray-900 dark:text-white">{stats.notVisited}</Text>
          </View>
        </View>
      </View>

      {/* Question Grid */}
      <ScrollView className="flex-1 p-4">
        <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          All Questions
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const status = getQuestionStatus(i);
            const isCurrent = i === currentIndex;

            return (
              <TouchableOpacity
                key={i}
                onPress={() => onNavigate(i)}
                className={`
                  w-12 h-12 rounded-lg items-center justify-center border-2 relative
                  ${isCurrent
                    ? 'border-blue-500 bg-blue-500'
                    : status === 'answered'
                      ? 'border-green-500 bg-green-500/10'
                      : status === 'flagged'
                        ? 'border-orange-500 bg-orange-500/10'
                        : isDark
                          ? 'border-gray-600 bg-gray-700'
                          : 'border-gray-300 bg-gray-50'
                  }
                `}
              >
                <Text
                  className={`
                    font-bold text-sm
                    ${isCurrent
                      ? 'text-white'
                      : status === 'answered'
                        ? 'text-green-600 dark:text-green-400'
                        : status === 'flagged'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  {i + 1}
                </Text>
                {status === 'flagged' && (
                  <Flag
                    size={10}
                    color="#f97316"
                    fill="#f97316"
                    style={{ position: 'absolute', top: 2, right: 2 }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Warning */}
      {/* Legend */}

      <View className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <View className="flex-row gap-4 m-4 flex-wrap">
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded bg-green-500/20 border-2 border-green-500" />
            <Text className="text-xs text-gray-600 dark:text-gray-400">Answered</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded bg-orange-500/20 border-2 border-orange-500" />
            <Text className="text-xs text-gray-600 dark:text-gray-400">Flagged</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600" />
            <Text className="text-xs text-gray-600 dark:text-gray-400">Not Visited</Text>
          </View>
        </View>
      </View>
    </View> 
  );
}
