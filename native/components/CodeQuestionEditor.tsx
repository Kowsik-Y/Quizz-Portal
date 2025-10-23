import React from 'react';
import { View, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';

interface CodeQuestionEditorProps {
  questionText: string;
  marks: number;
  language: string;
  starterCode: string;
  correctAnswer: string;
  onUpdateQuestionText: (text: string) => void;
  onUpdateMarks: (marks: number) => void;
  onUpdateLanguage: (language: string) => void;
  onUpdateStarterCode: (code: string) => void;
  onUpdateCorrectAnswer: (answer: string) => void;
}

export function CodeQuestionEditor({
  questionText,
  marks,
  language,
  starterCode,
  correctAnswer,
  onUpdateQuestionText,
  onUpdateMarks,
  onUpdateLanguage,
  onUpdateStarterCode,
  onUpdateCorrectAnswer
}: CodeQuestionEditorProps) {
  return (
    <>
      {/* Question Text */}
      <View className="mb-3">
        <Text className="text-sm font-semibold mb-2">Question Text</Text>
        <TextInput
          className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
          placeholder="Enter question text..."
          value={questionText}
          onChangeText={onUpdateQuestionText}
          multiline
        />
      </View>

      {/* Marks */}
      <View className="mb-3">
        <Text className="text-sm font-semibold mb-2">Marks</Text>
        <TextInput
          className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
          placeholder="10"
          value={marks.toString()}
          onChangeText={(text) => onUpdateMarks(parseInt(text) || 0)}
          keyboardType="number-pad"
        />
      </View>

      {/* Programming Language */}
      <View className="mb-3">
        <Text className="text-sm font-semibold mb-2">Programming Language</Text>
        <TextInput
          className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
          placeholder="javascript, python, java, etc."
          value={language}
          onChangeText={onUpdateLanguage}
        />
      </View>

      {/* Starter Code */}
      <View className="mb-3">
        <Text className="text-sm font-semibold mb-2">Starter Code (Optional)</Text>
        <TextInput
          className="bg-background border border-border rounded-xl px-4 py-3 text-foreground font-mono"
          placeholder="// Write your code here"
          value={starterCode}
          onChangeText={onUpdateStarterCode}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Expected Answer */}
      <View className="mb-3">
        <Text className="text-sm font-semibold mb-2">Expected Answer</Text>
        <TextInput
          className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
          placeholder="Expected output or solution"
          value={correctAnswer}
          onChangeText={onUpdateCorrectAnswer}
          multiline
        />
      </View>
    </>
  );
}
