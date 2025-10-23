import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';

interface Question {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'code';
  options?: Array<{ text: string; is_correct: boolean }>;
  correct_answer: string;
  marks: number;
  language?: string;
  starter_code?: string;
}

interface QuestionCardProps {
  question: Question;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export function QuestionCard({
  question,
  index,
  isExpanded,
  onToggleExpand,
  onDelete,
  children
}: QuestionCardProps) {
  return (
    <View className="border border-border rounded-xl overflow-hidden">
      {/* Question Header */}
      <Pressable
        onPress={onToggleExpand}
        className="bg-background p-4 flex-row items-center"
      >
        <View className={`px-2 py-1 rounded ${
          question.question_type === 'mcq' ? 'bg-primary' : 'bg-accent'
        }`}>
          <Text className="text-white text-xs font-bold">
            {question.question_type.toUpperCase()}
          </Text>
        </View>
        <Text className="ml-2 flex-1 font-semibold" numberOfLines={1}>
          Q{index + 1}. {question.question_text || 'Untitled Question'}
        </Text>
        <Text className="text-muted-foreground text-sm mr-2">
          {question.marks} marks
        </Text>
        {isExpanded ? (
          <ChevronUp size={20} color="#666666" />
        ) : (
          <ChevronDown size={20} color="#666666" />
        )}
      </Pressable>

      {/* Question Details (Expanded) */}
      {isExpanded && (
        <View className="p-4 bg-card border-t border-border">
          {children}

          {/* Delete Button */}
          <Pressable
            onPress={onDelete}
            className="bg-red-500 py-3 rounded-xl flex-row items-center justify-center mt-2"
          >
            <Trash2 size={18} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Delete Question</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
