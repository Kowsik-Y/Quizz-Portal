import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { questionAPI, testAPI } from '@/lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2, CheckCircle, Code, FileText } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Test } from '@/lib/types';
import { useCustomAlert } from '@/components/ui/custom-alert';

interface MCQOption {
  text: string;
  is_correct: boolean;
}

interface TestCase {
  input: string;
  expected_output: string;
  points: number;
}

export default function AddQuestionsScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const params = useLocalSearchParams();
  const testId = params.testId ? parseInt(params.testId as string) : null;
  const { showAlert } = useCustomAlert();


  const [test, setTest] = useState<Test | null>(null);
  const [questionType, setQuestionType] = useState<'mcq' | 'code'>('mcq');
  const [loading, setLoading] = useState(false);

  // MCQ Question State
  const [mcqData, setMcqData] = useState({
    question_text: '',
    points: 1,
    options: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ] as MCQOption[]
  });

  // Code Question State
  const [codeData, setCodeData] = useState({
    question_text: '',
    points: 5,
    language: 'c',
    starter_code: '',
    test_cases: [
      { input: '', expected_output: '', points: 1 }
    ] as TestCase[]
  });

  useEffect(() => {
    if (testId) {
      loadTest();
    }
  }, [testId]);

  const loadTest = async () => {
    if (!testId) return;
    try {
      const response = await testAPI.getById(testId);
      setTest(response.data.test);
      // Set initial question type based on test quiz_type
      if (response.data.test.quiz_type === 'code') {
        setQuestionType('code');
      } else if (response.data.test.quiz_type === 'mcq') {
        setQuestionType('mcq');
      }
    } catch (error) {
      console.error('Failed to load test:', error);
    }
  };

  const handleAddMCQQuestion = async () => {
    if (!testId) return;

    if (!mcqData.question_text.trim()) {
      showAlert('Error', 'Please enter question text');
      return;
    }

    const filledOptions = mcqData.options.filter(opt => opt.text.trim());
    if (filledOptions.length < 2) {
      showAlert('Error', 'Please add at least 2 options');
      return;
    }

    const correctOptions = filledOptions.filter(opt => opt.is_correct);
    if (correctOptions.length === 0) {
      showAlert('Error', 'Please mark at least one option as correct');
      return;
    }

    setLoading(true);
    try {
      // Get the correct answer text from the selected option
      const correctOption = filledOptions.find(opt => opt.is_correct);
      
      await questionAPI.create({
        test_id: testId,
        question_type: 'mcq',
        question_text: mcqData.question_text,
        options: filledOptions,
        correct_answer: correctOption?.text || filledOptions[0].text,
        points: mcqData.points
      });

      showAlert('Success', 'MCQ question added!', [
        {
          text: 'Add Another',
          onPress: () => {
            setMcqData({
              question_text: '',
              points: 1,
              options: [
                { text: '', is_correct: false },
                { text: '', is_correct: false },
                { text: '', is_correct: false },
                { text: '', is_correct: false }
              ]
            });
          }
        },
        { text: 'Finish', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCodeQuestion = async () => {
    if (!testId) return;

    if (!codeData.question_text.trim()) {
      showAlert('Error', 'Please enter question text');
      return;
    }

    const validTestCases = codeData.test_cases.filter(
      tc => tc.input.trim() && tc.expected_output.trim()
    );

    if (validTestCases.length === 0) {
      showAlert('Error', 'Please add at least one test case');
      return;
    }

    setLoading(true);
    try {
      await questionAPI.create({
        test_id: testId,
        question_type: 'code',
        question_text: codeData.question_text,
        language: codeData.language,
        starter_code: codeData.starter_code,
        test_cases: validTestCases,
        correct_answer: 'N/A', // Code questions use test cases for validation
        points: codeData.points
      });

      showAlert('Success', 'Code question added!', [
        {
          text: 'Add Another',
          onPress: () => {
            setCodeData({
              question_text: '',
              points: 5,
              language: 'c',
              starter_code: '',
              test_cases: [{ input: '', expected_output: '', points: 1 }]
            });
          }
        },
        { text: 'Finish', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const addMCQOption = () => {
    setMcqData({
      ...mcqData,
      options: [...mcqData.options, { text: '', is_correct: false }]
    });
  };

  const removeMCQOption = (index: number) => {
    const newOptions = mcqData.options.filter((_, i) => i !== index);
    setMcqData({ ...mcqData, options: newOptions });
  };

  const updateMCQOption = (index: number, field: keyof MCQOption, value: any) => {
    const newOptions = [...mcqData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setMcqData({ ...mcqData, options: newOptions });
  };

  const addTestCase = () => {
    setCodeData({
      ...codeData,
      test_cases: [...codeData.test_cases, { input: '', expected_output: '', points: 1 }]
    });
  };

  const removeTestCase = (index: number) => {
    const newTestCases = codeData.test_cases.filter((_, i) => i !== index);
    setCodeData({ ...codeData, test_cases: newTestCases });
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
    const newTestCases = [...codeData.test_cases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setCodeData({ ...codeData, test_cases: newTestCases });
  };

  if (user?.role === 'student') {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted-foreground">
          Only teachers and admins can add questions
        </Text>
      </View>
    );
  }

  const canAddMCQ = !test || test.quiz_type === 'mcq' || test.quiz_type === 'mixed';
  const canAddCode = !test || test.quiz_type === 'code' || test.quiz_type === 'mixed';

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
            <FileText size={40} color="#ffffff" />
          </View>
          <Text className="text-3xl font-bold">Add Questions</Text>
          {test && (
            <Text className="text-muted-foreground mt-1">
              To: {test.title}
            </Text>
          )}
        </View>

        {/* Question Type Selector */}
        {test && test.quiz_type === 'mixed' && (
          <View className="bg-card rounded-xl p-4 mb-4 border border-border">
            <Text className="text-lg font-bold mb-4">Question Type</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setQuestionType('mcq')}
                className={`flex-1 py-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                  questionType === 'mcq'
                    ? 'bg-primary border-primary'
                    : 'bg-background border-border'
                }`}
              >
                <CheckCircle size={20} color={questionType === 'mcq' ? '#ffffff' : '#666666'} />
                <Text className={questionType === 'mcq' ? 'text-white font-semibold' : 'text-foreground'}>
                  MCQ
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setQuestionType('code')}
                className={`flex-1 py-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                  questionType === 'code'
                    ? 'bg-primary border-primary'
                    : 'bg-background border-border'
                }`}
              >
                <Code size={20} color={questionType === 'code' ? '#ffffff' : '#666666'} />
                <Text className={questionType === 'code' ? 'text-white font-semibold' : 'text-foreground'}>
                  Code
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* MCQ Question Form */}
        {questionType === 'mcq' && canAddMCQ && (
          <View className="bg-card rounded-xl p-4 mb-4 border border-border">
            <Text className="text-lg font-bold mb-4">MCQ Question</Text>

            <View className="gap-4">
              {/* Question Text */}
              <View>
                <Text className="text-sm font-semibold mb-2">Question Text *</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Enter your question..."
                  value={mcqData.question_text}
                  onChangeText={(text) => setMcqData({...mcqData, question_text: text})}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Points */}
              <View>
                <Text className="text-sm font-semibold mb-2">Points</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="1"
                  value={mcqData.points.toString()}
                  onChangeText={(text) => setMcqData({...mcqData, points: parseInt(text) || 1})}
                  keyboardType="number-pad"
                />
              </View>

              {/* Options */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold">Options *</Text>
                  <Pressable onPress={addMCQOption} className="flex-row items-center gap-1">
                    <Plus size={16} color="#666666" />
                    <Text className="text-sm text-primary">Add Option</Text>
                  </Pressable>
                </View>

                {mcqData.options.map((option, index) => (
                  <View key={index} className="flex-row items-center gap-2 mb-2">
                    <Pressable
                      onPress={() => updateMCQOption(index, 'is_correct', !option.is_correct)}
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                        option.is_correct ? 'bg-green-500 border-green-500' : 'border-border'
                      }`}
                    >
                      {option.is_correct && <CheckCircle size={16} color="#ffffff" />}
                    </Pressable>

                    <TextInput
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-foreground"
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChangeText={(text) => updateMCQOption(index, 'text', text)}
                    />

                    {mcqData.options.length > 2 && (
                      <Pressable onPress={() => removeMCQOption(index)}>
                        <Trash2 size={20} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>

              <Button onPress={handleAddMCQQuestion} disabled={loading}>
                <Text className="text-white font-bold">
                  {loading ? 'Adding...' : 'Add MCQ Question'}
                </Text>
              </Button>
            </View>
          </View>
        )}

        {/* Code Question Form */}
        {questionType === 'code' && canAddCode && (
          <View className="bg-card rounded-xl p-4 mb-4 border border-border">
            <Text className="text-lg font-bold mb-4">Code Question</Text>

            <View className="gap-4">
              {/* Question Text */}
              <View>
                <Text className="text-sm font-semibold mb-2">Question Text *</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Enter your question..."
                  value={codeData.question_text}
                  onChangeText={(text) => setCodeData({...codeData, question_text: text})}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Language and Points */}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-sm font-semibold mb-2">Language</Text>
                  <View className="flex-row gap-2">
                    {['c', 'cpp', 'java', 'python'].map((lang) => (
                      <Pressable
                        key={lang}
                        onPress={() => setCodeData({...codeData, language: lang})}
                        className={`px-4 py-2 rounded-lg border ${
                          codeData.language === lang
                            ? 'bg-primary border-primary'
                            : 'bg-background border-border'
                        }`}
                      >
                        <Text className={codeData.language === lang ? 'text-white font-semibold' : 'text-foreground'}>
                          {lang.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="w-24">
                  <Text className="text-sm font-semibold mb-2">Points</Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-2 text-foreground text-center"
                    placeholder="5"
                    value={codeData.points.toString()}
                    onChangeText={(text) => setCodeData({...codeData, points: parseInt(text) || 5})}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Starter Code */}
              <View>
                <Text className="text-sm font-semibold mb-2">Starter Code (Optional)</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground font-mono"
                  placeholder="// Starter code for students..."
                  value={codeData.starter_code}
                  onChangeText={(text) => setCodeData({...codeData, starter_code: text})}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              {/* Test Cases */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold">Test Cases *</Text>
                  <Pressable onPress={addTestCase} className="flex-row items-center gap-1">
                    <Plus size={16} color="#666666" />
                    <Text className="text-sm text-primary">Add Test Case</Text>
                  </Pressable>
                </View>

                {codeData.test_cases.map((testCase, index) => (
                  <View key={index} className="bg-background border border-border rounded-xl p-3 mb-2">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-semibold">Test Case {index + 1}</Text>
                      {codeData.test_cases.length > 1 && (
                        <Pressable onPress={() => removeTestCase(index)}>
                          <Trash2 size={18} color="#ef4444" />
                        </Pressable>
                      )}
                    </View>

                    <TextInput
                      className="bg-card border border-border rounded-lg px-3 py-2 text-foreground font-mono mb-2"
                      placeholder="Input"
                      value={testCase.input}
                      onChangeText={(text) => updateTestCase(index, 'input', text)}
                      multiline
                    />

                    <TextInput
                      className="bg-card border border-border rounded-lg px-3 py-2 text-foreground font-mono mb-2"
                      placeholder="Expected Output"
                      value={testCase.expected_output}
                      onChangeText={(text) => updateTestCase(index, 'expected_output', text)}
                      multiline
                    />

                    <TextInput
                      className="bg-card border border-border rounded-lg px-3 py-2 text-foreground text-center"
                      placeholder="Points"
                      value={testCase.points.toString()}
                      onChangeText={(text) => updateTestCase(index, 'points', parseInt(text) || 1)}
                      keyboardType="number-pad"
                    />
                  </View>
                ))}
              </View>

              <Button onPress={handleAddCodeQuestion} disabled={loading}>
                <Text className="text-white font-bold">
                  {loading ? 'Adding...' : 'Add Code Question'}
                </Text>
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
