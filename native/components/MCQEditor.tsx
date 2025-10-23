import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Check } from 'lucide-react-native';

interface MCQOption {
  text: string;
  is_correct: boolean;
}

interface MCQEditorProps {
  questionText: string;
  marks: number;
  options: MCQOption[];
  onUpdateQuestionText: (text: string) => void;
  onUpdateMarks: (marks: number) => void;
  onUpdateOption: (index: number, text: string) => void;
  onToggleCorrect: (index: number) => void;
}

export function MCQEditor({
  questionText,
  marks,
  options,
  onUpdateQuestionText,
  onUpdateMarks,
  onUpdateOption,
  onToggleCorrect
}: MCQEditorProps) {
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

      {/* Options */}
      <View className="mb-3">
        <Text className="text-sm font-semibold mb-2">Options</Text>
        {options.map((option, optIndex) => (
          <View key={optIndex} className="flex-row items-center mb-2">
            <Pressable
              onPress={() => onToggleCorrect(optIndex)}
              className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-2 ${
                option.is_correct
                  ? 'bg-green-500 border-green-500'
                  : 'border-border'
              }`}
            >
              {option.is_correct && (
                <Check size={14} color="#ffffff" />
              )}
            </Pressable>
            <TextInput
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-foreground"
              placeholder={`Option ${optIndex + 1}`}
              value={option.text}
              onChangeText={(text) => onUpdateOption(optIndex, text)}
            />
          </View>
        ))}
        <Text className="text-xs text-muted-foreground mt-1">
          Tap the circle to mark the correct answer
        </Text>
      </View>
    </>
  );
}
