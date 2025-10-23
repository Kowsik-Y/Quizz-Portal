import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { FileText, Plus, Code } from 'lucide-react-native';

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

interface QuestionBuilderProps {
  questions: Question[];
  totalMarks: number;
  onAddMCQ: () => void;
  onAddCode: () => void;
  children: React.ReactNode;
}

export function QuestionBuilder({ 
  questions, 
  totalMarks, 
  onAddMCQ, 
  onAddCode,
  children 
}: QuestionBuilderProps) {
  return (
    <View className="bg-card rounded-xl p-4 mb-4 border border-border">
      <View className="flex-row items-center mb-4">
        <FileText size={20} color="#666666" />
        <Text className="text-lg font-bold ml-2">Test Questions</Text>
        <Text className="text-sm text-muted-foreground ml-auto">
          {questions.length} questions • {totalMarks} marks
        </Text>
      </View>

      {/* Add Question Buttons */}
      <View className="flex-row gap-2 mb-4">
        <Pressable
          onPress={onAddMCQ}
          className="flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center"
        >
          <Plus size={18} color="#ffffff" />
          <Text className="text-white font-semibold ml-2">Add MCQ</Text>
        </Pressable>
        <Pressable
          onPress={onAddCode}
          className="flex-1 bg-accent py-3 rounded-xl flex-row items-center justify-center"
        >
          <Code size={18} color="#ffffff" />
          <Text className="text-white font-semibold ml-2">Add Code</Text>
        </Pressable>
      </View>

      {/* Questions List */}
      {questions.length === 0 ? (
        <View className="py-8 items-center">
          <FileText size={48} color="#cccccc" />
          <Text className="text-muted-foreground mt-2">No questions added yet</Text>
          <Text className="text-muted-foreground text-sm">Add MCQ or Code questions above</Text>
        </View>
      ) : (
        <View className="gap-3">
          {children}
        </View>
      )}
    </View>
  );
}
