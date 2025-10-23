import { View, ScrollView, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Edit, Trash2, Save, X, Plus, Sparkles, Wand2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { questionAPI } from '@/lib/api';
import { useCustomAlert } from '@/components/ui/custom-alert';
import { generateQuestionsWithGemini } from '@/lib/config';

interface Question {
  id: number;
  test_id: number;
  question_text: string;
  question_type: 'mcq' | 'code' | 'theory';
  options?: Array<{ text: string; is_correct: boolean }> | string;
  correct_answer?: string;
  test_cases?: Array<{ input: string; expected_output: string; points: number }>;
  points: number; // Changed from marks to points
  created_at: string;
}

interface GeneratedQuestion {
  question_text: string;
  question_type: 'mcq' | 'code' | 'theory';
  options?: string[];
  correct_answer?: string;
  test_cases?: Array<{ input: string; expected_output: string; points: number }>;
  points: number;
  selected?: boolean;
  difficulty?: string;
}

export default function ViewQuestionsPage() {
  // Fetch questions from API
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await questionAPI.getByTest(Number(routeTestId));
      setQuestions(res.data.questions || []);
    } catch (error) {
      showAlert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';
  const router = useRouter();
  const { testId: routeTestId, testName } = useLocalSearchParams();
  // Responsive tab state
  const [activeTab, setActiveTab] = useState<'config' | 'generated' | 'existing'>('config');
  const isMobile = useWindowDimensions().width < 768;
  const user = useAuthStore((state) => state.user);
  const { showAlert } = useCustomAlert();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    question_text: '',
    points: '', // Changed from marks to points
    correct_answer: '',
    options: ['', '', '', ''],
    test_cases: [] as Array<{ input: string; expected_output: string; points: number }>,
    expandedId: null as number | null
  });
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // AI Generation States
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [promptTitle, setPromptTitle] = useState('');
  const [questionType, setQuestionType] = useState<'mcq' | 'code'>('mcq');
  const [numberOfQuestions, setNumberOfQuestions] = useState('5');
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [addingQuestions, setAddingQuestions] = useState(false);
  
  // Difficulty-based question counts
  const [difficultySettings, setDifficultySettings] = useState({
    easy: { count: '5', type: 'mcq' as 'mcq' | 'code' },
    medium: { count: '3', type: 'mcq' as 'mcq' | 'code'  },
    hard: { count: '2', type: 'mcq' as 'mcq' | 'code' }
  });
  
  // Editing state for generated questions
  const [editingGeneratedId, setEditingGeneratedId] = useState<number | null>(null);
  const [editGeneratedForm, setEditGeneratedForm] = useState({
    question_text: '',
    points: '',
    correct_answer: '',
    options: ['', '', '', ''],
    test_cases: [] as Array<{ input: string; expected_output: string; points: number }>
  });

  
  // Check if user is teacher or admin
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Start editing
  const handleEdit = (question: Question) => {
    // Parse options if needed
    let parsedOptions: string[] = ['', '', '', ''];
    if (question.question_type === 'mcq' && question.options) {
      try {
        const opts = typeof question.options === 'string' 
          ? JSON.parse(question.options)
          : Array.isArray(question.options) ? question.options : [];
        
        // Convert objects to strings for editing
        parsedOptions = opts.map((opt: any) => 
          typeof opt === 'string' ? opt : (opt.text || '')
        );

        while (parsedOptions.length < 4) {
          parsedOptions.push('');
        }
      } catch (error) {
        showAlert('Error', 'Failed to parse question options');
        parsedOptions = ['', '', '', ''];
      }
    }
    
    setEditingId(question.id);
    setEditForm({
      question_text: question.question_text,
      points: question.points.toString(),
      correct_answer: question.correct_answer || '',
      options: parsedOptions,
      test_cases: question.test_cases || [],
      expandedId: question.id
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      question_text: '',
      points: '',
      correct_answer: '',
      options: ['', '', '', ''],
      test_cases: [],
      expandedId: null
    });
  };

  // Save edited question
  const handleSave = async (questionId: number, questionType: string) => {
    try {
      setSavingId(questionId);

      const updateData: any = {
        question_text: editForm.question_text,
        points: Number(editForm.points) // Changed from marks to points
      };

      if (questionType === 'mcq') {
        updateData.options = editForm.options.filter(opt => opt.trim());
        updateData.correct_answer = editForm.correct_answer;
      } else if (questionType === 'theory') {
        updateData.correct_answer = editForm.correct_answer;
      } else if (questionType === 'code') {
        updateData.test_cases = editForm.test_cases;
      }

      await questionAPI.update(questionId, updateData);
      
      showAlert('Success', 'Question updated successfully!');
      setEditingId(null);
  fetchQuestions(); // Reload to get updated data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update question';
      showAlert('Error', errorMessage);
    } finally {
      setSavingId(null);
    }
  };

  // Generate questions using Gemini AI with difficulty levels
  const handleGenerateQuestions = async () => {
    if (!aiPrompt.trim()) {
      showAlert('Error', 'Please enter a prompt to generate questions');
      return;
    }

    try {
      setGenerating(true);
      const allQuestions: GeneratedQuestion[] = [];
      
      // Generate questions for each difficulty level
      for (const [difficulty, settings] of Object.entries(difficultySettings)) {
        const count = Number(settings.count);
        if (count > 0) {
          const prompt = `${aiPrompt.trim()}. Difficulty level: ${difficulty}. ${
            promptTitle ? `Topic: ${promptTitle}` : ''
          }`;
          
          const questionsArray = await generateQuestionsWithGemini(
            prompt,
            settings.type,
            count
          );
          
          // Add difficulty metadata
          const questionsWithDifficulty = questionsArray.map(q => ({
            ...q,
            difficulty,
            selected: true
          }));
          
          allQuestions.push(...questionsWithDifficulty);
        }
      }
      
      setGeneratedQuestions(allQuestions);
      showAlert('Success', `Generated ${allQuestions.length} questions successfully!`);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate questions. Please try again or check your API key.';
      showAlert('Error', errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  // Toggle question selection
  const toggleQuestionSelection = (index: number) => {
    setGeneratedQuestions(prev => 
      prev.map((q, i) => i === index ? { ...q, selected: !q.selected } : q)
    );
  };

  // Add selected questions to test
  const handleAddSelectedQuestions = async () => {
    const selectedQuestions = generatedQuestions.filter(q => q.selected);
    
    if (selectedQuestions.length === 0) {
      showAlert('Error', 'Please select at least one question to add');
      return;
    }

    try {
      setAddingQuestions(true);
      
      // Add each selected question
      for (const question of selectedQuestions) {
        const questionData: any = {
          test_id: Number(routeTestId),
          question_text: question.question_text,
          question_type: question.question_type,
          points: question.points
        };

        if (question.question_type === 'mcq' && question.options) {
          questionData.options = question.options;
          questionData.correct_answer = question.correct_answer;
        } else if (question.question_type !== 'code') {
          questionData.correct_answer = question.correct_answer || '';
        }

        if (question.question_type === 'code' && question.test_cases) {
          questionData.test_cases = question.test_cases;
        }

        await questionAPI.create(questionData);
      }
      
      showAlert('Success', `Added ${selectedQuestions.length} questions successfully!`);
      setShowAIModal(false);
      setGeneratedQuestions([]);
      setAiPrompt('');
  fetchQuestions(); // Reload questions
    } catch (error: any) {
      showAlert('Error', 'Failed to add some questions. Please try again.');
    } finally {
      setAddingQuestions(false);
    }
  };

  // Delete question
  const handleDelete = async (questionId: number) => {
    showAlert(
      'Confirm Delete',
      'Are you sure you want to delete this question? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(questionId);
              await questionAPI.delete(questionId);
              showAlert('Success', 'Question deleted successfully!');
              fetchQuestions(); // Reload questions
            } catch (error: any) {
              const errorMessage = error.response?.data?.error || 'Failed to delete question';
              showAlert('Error', errorMessage);
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  // Toggle selection in generated questions
  const handleToggleSelection = (index: number) => {
    setGeneratedQuestions(prev =>
      prev.map((q, i) => i === index ? { ...q, selected: !q.selected } : q)
    );
  };

  // Clear generated questions
  const handleClearGenerated = () => {
    setGeneratedQuestions([]);
    setPromptTitle('');
    setAiPrompt('');
  };

  // Start editing generated question
  const handleEditGenerated = (index: number) => {
    const question = generatedQuestions[index];
    setEditingGeneratedId(index);
    setEditGeneratedForm({
      question_text: question.question_text,
      points: question.points.toString(),
      correct_answer: question.correct_answer || '',
      options: question.options ? [...question.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      test_cases: question.test_cases || []
    });
  };

  // Save edited generated question
  const handleSaveGenerated = (index: number) => {
    setGeneratedQuestions(prev => 
      prev.map((q, i) => 
        i === index 
          ? {
              ...q,
              question_text: editGeneratedForm.question_text,
              points: Number(editGeneratedForm.points),
              correct_answer: editGeneratedForm.correct_answer,
              options: editGeneratedForm.options.filter(opt => opt.trim()),
              test_cases: editGeneratedForm.test_cases
            }
          : q
      )
    );
    setEditingGeneratedId(null);
    setEditGeneratedForm({
      question_text: '',
      points: '',
      correct_answer: '',
      options: ['', '', '', ''],
      test_cases: []
    });
  };

  // Cancel editing generated question
  const handleCancelEditGenerated = () => {
    setEditingGeneratedId(null);
    setEditGeneratedForm({
      question_text: '',
      points: '',
      correct_answer: '',
      options: ['', '', '', ''],
      test_cases: []
    });
  };

  // Render question card
  const QuestionCard = ({ question, index }: { question: Question; index: number }) => {
    const isEditing = editingId === question.id;
    const isSaving = savingId === question.id;
    const isDeleting = deletingId === question.id;

    if (isEditing) {
      return (
        <View
          className={`rounded-xl p-4 mb-4 border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Edit Question {index + 1}
            </Text>
            <View className={`px-3 py-1 rounded-full ${
              question.question_type === 'mcq' 
                ? isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                : question.question_type === 'code'
                ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                : isDark ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}>
              <Text className={`text-xs font-semibold ${
                question.question_type === 'mcq' 
                  ? isDark ? 'text-blue-300' : 'text-blue-700'
                  : question.question_type === 'code'
                  ? isDark ? 'text-green-300' : 'text-green-700'
                  : isDark ? 'text-purple-300' : 'text-purple-700'
              }`}>
                {question.question_type.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Question Text */}
          <View className="mb-4">
            <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Question Text
            </Text>
            <TextInput
              value={editForm.question_text}
              onChangeText={(text) => setEditForm({ ...editForm, question_text: text })}
              placeholder="Enter question text"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              className={`px-4 py-3 rounded-lg border ${
                isDark 
                  ? 'bg-gray-900 border-gray-700 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Points */}
          <View className="mb-4">
            <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Points
            </Text>
            <TextInput
              value={editForm.points}
              onChangeText={(text) => setEditForm({ ...editForm, points: text })}
              placeholder="Enter points"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="numeric"
              className={`px-4 py-3 rounded-lg border ${
                isDark 
                  ? 'bg-gray-900 border-gray-700 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </View>

          {/* MCQ Options */}
          {question.question_type === 'mcq' && (
            <>
              <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Options
              </Text>
              {editForm.options.map((option, idx) => (
                <View key={idx} className="mb-3">
                  <TextInput
                    value={option}
                    onChangeText={(text) => {
                      const newOptions = [...editForm.options];
                      newOptions[idx] = text;
                      setEditForm({ ...editForm, options: newOptions });
                    }}
                    placeholder={`Option ${idx + 1}`}
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    className={`px-4 py-3 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </View>
              ))}

              <View className="mb-4">
                <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Correct Answer
                </Text>
                <TextInput
                  value={editForm.correct_answer}
                  onChangeText={(text) => setEditForm({ ...editForm, correct_answer: text })}
                  placeholder="Enter correct answer"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  className={`px-4 py-3 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-900 border-gray-700 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </View>
            </>
          )}

          {/* Theory Answer Model */}
          {question.question_type === 'theory' && (
            <View className="mb-4">
              <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Model Answer (Optional)
              </Text>
              <TextInput
                value={editForm.correct_answer}
                onChangeText={(text) => setEditForm({ ...editForm, correct_answer: text })}
                placeholder="Enter model answer for reference"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                className={`px-4 py-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-900 border-gray-700 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                multiline
                numberOfLines={4}
              />
            </View>
          )}

          {/* Coding Test Cases */}
          {question.question_type === 'code' && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Test Cases
                </Text>
                <Pressable
                  onPress={() => setEditForm({
                    ...editForm,
                    test_cases: [...editForm.test_cases, { input: '', expected_output: '', points: 1 }]
                  })}
                  className={`px-3 py-1 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}
                >
                  <Text className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    + Add Test Case
                  </Text>
                </Pressable>
              </View>
              
              {editForm.test_cases.map((testCase, idx) => (
                <View key={idx} className={`mb-3 p-3 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'
                }`}>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Test Case {idx + 1}
                    </Text>
                    <Pressable
                      onPress={() => {
                        const newTestCases = editForm.test_cases.filter((_, i) => i !== idx);
                        setEditForm({ ...editForm, test_cases: newTestCases });
                      }}
                      className={`p-1 rounded ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}
                    >
                      <X size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                  
                  <View className="mb-2">
                    <Text className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Input
                    </Text>
                    <TextInput
                      value={testCase.input}
                      onChangeText={(text) => {
                        const newTestCases = [...editForm.test_cases];
                        newTestCases[idx].input = text;
                        setEditForm({ ...editForm, test_cases: newTestCases });
                      }}
                      placeholder="Enter test input"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      className={`px-3 py-2 rounded border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </View>
                  
                  <View className="mb-2">
                    <Text className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Expected Output
                    </Text>
                    <TextInput
                      value={testCase.expected_output}
                      onChangeText={(text) => {
                        const newTestCases = [...editForm.test_cases];
                        newTestCases[idx].expected_output = text;
                        setEditForm({ ...editForm, test_cases: newTestCases });
                      }}
                      placeholder="Enter expected output"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      className={`px-3 py-2 rounded border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </View>
                  
                  <View>
                    <Text className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Points
                    </Text>
                    <TextInput
                      value={testCase.points.toString()}
                      onChangeText={(text) => {
                        const newTestCases = [...editForm.test_cases];
                        newTestCases[idx].points = Number(text) || 1;
                        setEditForm({ ...editForm, test_cases: newTestCases });
                      }}
                      placeholder="1"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      keyboardType="numeric"
                      className={`px-3 py-2 rounded border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </View>
                </View>
              ))}
              
              {editForm.test_cases.length === 0 && (
                <Text className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No test cases added yet. Click "Add Test Case" to add one.
                </Text>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleCancelEdit}
              disabled={isSaving}
              className={`flex-1 py-3 rounded-lg border flex-row items-center justify-center gap-2 ${
                isDark 
                  ? 'border-gray-700 bg-gray-900' 
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <X size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleSave(question.id, question.question_type)}
              disabled={isSaving || !editForm.question_text.trim() || !editForm.points}
              className={`flex-1 py-3 rounded-lg flex-row items-center justify-center gap-2 ${
                isSaving || !editForm.question_text.trim() || !editForm.points
                  ? 'bg-gray-400' 
                  : 'bg-blue-500'
              }`}
            >
              <Save size={18} color="white" />
              <Text className="text-white font-semibold">
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    // View mode
    return (
      <View
        className={`rounded-xl p-4 mb-4 border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3">
            <View className={`w-10 h-10 rounded-full items-center justify-center ${
              isDark ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <Text className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {index + 1}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${
              question.question_type === 'mcq' 
                ? isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                : question.question_type === 'code'
                ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                : isDark ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}>
              <Text className={`text-xs font-semibold ${
                question.question_type === 'mcq' 
                  ? isDark ? 'text-blue-300' : 'text-blue-700'
                  : question.question_type === 'code'
                  ? isDark ? 'text-green-300' : 'text-green-700'
                  : isDark ? 'text-purple-300' : 'text-purple-700'
              }`}>
                {question.question_type.toUpperCase()}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
              <Text className={`text-xs font-semibold ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                {question.points} points
              </Text>
            </View>
          </View>

          {isTeacherOrAdmin && (
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleEdit(question)}
                disabled={editingId !== null}
                className={`p-2 rounded-lg ${
                  editingId !== null
                    ? isDark ? 'bg-gray-700' : 'bg-gray-200'
                    : isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}
              >
                <Edit size={18} color={isDark ? '#60a5fa' : '#3b82f6'} />
              </Pressable>

              {user?.role === 'admin' && (
                <Pressable
                  onPress={() => handleDelete(question.id)}
                  disabled={isDeleting || editingId !== null}
                  className={`p-2 rounded-lg ${
                    isDeleting || editingId !== null
                      ? isDark ? 'bg-gray-700' : 'bg-gray-200'
                      : isDark ? 'bg-red-900/30' : 'bg-red-100'
                  }`}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Trash2 size={18} color="#ef4444" />
                  )}
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Question Text */}
        <Text className={`text-base mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {question.question_text}
        </Text>

        {/* MCQ Options */}
        {question.question_type === 'mcq' && question.options && (
          <View className="mb-3">
            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Options:
            </Text>
            {(() => {
              try {
                // Parse options if they come as a string
                const parsedOptions: any[] = typeof question.options === 'string' 
                  ? JSON.parse(question.options)
                  : Array.isArray(question.options) ? question.options : [];
                
                return parsedOptions.map((option: any, idx: number) => {
                  const optionText = typeof option === 'string' ? option : (option.text || '');
                  const isCorrect = typeof option === 'object' && option.is_correct;
                  
                  return (
                    <View 
                      key={idx}
                      className={`flex-row items-center mb-2 p-2 rounded-lg ${
                        isCorrect
                          ? isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
                          : isDark ? 'bg-gray-900' : 'bg-gray-50'
                      }`}
                    >
                      <Text className={`mr-2 font-bold ${
                        isCorrect
                          ? isDark ? 'text-green-400' : 'text-green-600'
                          : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + idx)}.
                      </Text>
                      <Text className={
                        isCorrect
                          ? isDark ? 'text-green-300' : 'text-green-700'
                          : isDark ? 'text-gray-300' : 'text-gray-700'
                      }>
                        {optionText}
                      </Text>
                    </View>
                  );
                });
              } catch (error) {
                showAlert('Error', 'Failed to render question options');
                return null;
              }
            })()}
          </View>
        )}

        {/* Correct Answer for Theory */}
        {question.question_type === 'theory' && question.correct_answer && (
          <View className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <Text className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Model Answer:
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {question.correct_answer}
            </Text>
          </View>
        )}

        {/* Test Cases for Coding */}
        {question.question_type === 'code' && question.test_cases && question.test_cases.length > 0 && (
          <View className="mt-3">
            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Test Cases:
            </Text>
            {question.test_cases.map((testCase, idx) => (
              <View 
                key={idx}
                className={`mb-2 p-3 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Test Case {idx + 1}
                  </Text>
                  <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                    <Text className={`text-xs font-semibold ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      {testCase.points} pts
                    </Text>
                  </View>
                </View>
                
                <View className="mb-2">
                  <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Input:
                  </Text>
                  <Text className={`text-sm font-mono p-2 rounded ${
                    isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
                  }`}>
                    {testCase.input || 'No input'}
                  </Text>
                </View>
                
                <View>
                  <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Expected Output:
                  </Text>
                  <Text className={`text-sm font-mono p-2 rounded ${
                    isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
                  }`}>
                    {testCase.expected_output || 'No output expected'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className={`p-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {testName} - Questions
        </Text>
      </View>

      {/* Mobile Tab Navigation */}
      {isMobile && (
        <View className={`flex-row border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Pressable
            onPress={() => setActiveTab('config')}
            className={`flex-1 py-3 px-4 items-center ${
              activeTab === 'config'
                ? isDark ? 'bg-blue-900/30 border-b-2 border-blue-500' : 'bg-blue-50 border-b-2 border-blue-500'
                : ''
            }`}
          >
            <Wand2 size={20} color={activeTab === 'config' ? '#3b82f6' : (isDark ? '#9ca3af' : '#6b7280')} />
            <Text className={`text-xs mt-1 font-medium ${
              activeTab === 'config'
                ? isDark ? 'text-blue-400' : 'text-blue-600'
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              AI Config
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('generated')}
            className={`flex-1 py-3 px-4 items-center ${
              activeTab === 'generated'
                ? isDark ? 'bg-purple-900/30 border-b-2 border-purple-500' : 'bg-purple-50 border-b-2 border-purple-500'
                : ''
            }`}
          >
            <Sparkles size={20} color={activeTab === 'generated' ? '#8b5cf6' : (isDark ? '#9ca3af' : '#6b7280')} />
            <Text className={`text-xs mt-1 font-medium ${
              activeTab === 'generated'
                ? isDark ? 'text-purple-400' : 'text-purple-600'
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Generated
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('existing')}
            className={`flex-1 py-3 px-4 items-center ${
              activeTab === 'existing'
                ? isDark ? 'bg-green-900/30 border-b-2 border-green-500' : 'bg-green-50 border-b-2 border-green-500'
                : ''
            }`}
          >
            <Edit size={20} color={activeTab === 'existing' ? '#10b981' : (isDark ? '#9ca3af' : '#6b7280')} />
            <Text className={`text-xs mt-1 font-medium ${
              activeTab === 'existing'
                ? isDark ? 'text-green-400' : 'text-green-600'
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Questions
            </Text>
          </Pressable>
        </View>
      )}

      {/* 3-Column Layout */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#3b82f6'} />
          <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading questions...
          </Text>
        </View>
      ) : (
        <View className="flex-1 flex-row">
          {/* LEFT COLUMN - AI Configuration */}
          {(activeTab === 'config' || !isMobile) && (
            <View className={`${isMobile ? 'flex-1' : 'basis-1/3'} ${!isMobile ? `border-r ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}` : ''}`}>
              <ScrollView className="flex-1 p-4">
                <View className="mb-4">
                  <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                     AI Generator
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Configure and generate questions
                  </Text>
                </View>

              {/* Title Input */}
              <View className="mb-4">
                <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Topic/Title
                </Text>
                <TextInput
                  value={promptTitle}
                  onChangeText={setPromptTitle}
                  placeholder="e.g., JavaScript Arrays"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  className={`px-4 py-3 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </View>

              {/* Prompt/Description */}
              <View className="mb-4">
                <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description/Context
                </Text>
                <TextInput
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  placeholder="Describe what you want to focus on..."
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className={`px-4 py-3 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </View>

              {/* Difficulty Settings */}
              <Text className={`mb-3 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Difficulty Levels
              </Text>

              {/* Easy */}
              <View className={`mb-3 p-4 rounded-lg border-2 ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                <Text className="text-green-600 dark:text-green-400 font-bold mb-2">Easy</Text>
                <View className="mb-2">
                  <Text className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Count:</Text>
                  <TextInput
                    value={difficultySettings.easy.count}
                    onChangeText={(text) => setDifficultySettings(prev => ({
                      ...prev,
                      easy: { ...prev.easy, count: text }
                    }))}
                    placeholder="5"
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    className={`px-3 py-2 rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </View>
                <View>
                  <Text className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Type:</Text>
                  <View className="flex-row gap-2">
                    {(['mcq', 'code'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setDifficultySettings(prev => ({
                          ...prev,
                          easy: { ...prev.easy, type }
                        }))}
                        className={`flex-1 py-2 rounded ${
                          difficultySettings.easy.type === type
                            ? 'bg-green-600'
                            : isDark ? 'bg-gray-800' : 'bg-white'
                        }`}
                      >
                        <Text className={`text-center text-xs font-medium ${
                          difficultySettings.easy.type === type
                            ? 'text-white'
                            : isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {type.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Medium */}
              <View className={`mb-3 p-4 rounded-lg border-2 ${isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                <Text className="text-yellow-600 dark:text-yellow-400 font-bold mb-2">Medium</Text>
                <View className="mb-2">
                  <Text className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Count:</Text>
                  <TextInput
                    value={difficultySettings.medium.count}
                    onChangeText={(text) => setDifficultySettings(prev => ({
                      ...prev,
                      medium: { ...prev.medium, count: text }
                    }))}
                    placeholder="3"
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    className={`px-3 py-2 rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </View>
                <View>
                  <Text className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Type:</Text>
                  <View className="flex-row gap-2">
                    {(['mcq','code'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setDifficultySettings(prev => ({
                          ...prev,
                          medium: { ...prev.medium, type }
                        }))}
                        className={`flex-1 py-2 rounded ${
                          difficultySettings.medium.type === type
                            ? 'bg-yellow-600'
                            : isDark ? 'bg-gray-800' : 'bg-white'
                        }`}
                      >
                        <Text className={`text-center text-xs font-medium ${
                          difficultySettings.medium.type === type
                            ? 'text-white'
                            : isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {type.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Hard */}
              <View className={`mb-4 p-4 rounded-lg border-2 ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                <Text className="text-red-600 dark:text-red-400 font-bold mb-2">Hard</Text>
                <View className="mb-2">
                  <Text className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Count:</Text>
                  <TextInput
                    value={difficultySettings.hard.count}
                    onChangeText={(text) => setDifficultySettings(prev => ({
                      ...prev,
                      hard: { ...prev.hard, count: text }
                    }))}
                    placeholder="2"
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    className={`px-3 py-2 rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </View>
                <View>
                  <Text className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Type:</Text>
                  <View className="flex-row gap-2">
                    {(['mcq','code'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setDifficultySettings(prev => ({
                          ...prev,
                          hard: { ...prev.hard, type }
                        }))}
                        className={`flex-1 py-2 rounded ${
                          difficultySettings.hard.type === type
                            ? 'bg-red-600'
                            : isDark ? 'bg-gray-800' : 'bg-white'
                        }`}
                      >
                        <Text className={`text-center text-xs font-medium ${
                          difficultySettings.hard.type === type
                            ? 'text-white'
                            : isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {type.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Generate Button */}
              <Pressable
                onPress={handleGenerateQuestions}
                disabled={generating || !aiPrompt.trim()}
                className={`py-4 mb-10 rounded-lg flex-row items-center justify-center gap-2 ${
                  generating || !aiPrompt.trim()
                    ? 'bg-gray-400'
                    : 'bg-purple-600'
                }`}
              >
                {generating ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-bold">Generating...</Text>
                  </>
                ) : (
                  <>
                    <Wand2 size={20} color="white" />
                    <Text className="text-white font-bold">Generate Questions</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
)}
          {/* CENTER COLUMN - Generated Questions */}
          {(activeTab === 'generated' || !isMobile) && (
            <View className={`${isMobile ? 'flex-1' : 'basis-1/3'}`}>
              <View className={`p-4`}>
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Generated Questions
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Review and select questions to add
                </Text>
              </View>
              
              <ScrollView className="flex-1 p-4">
                {generatedQuestions.length === 0 ? (
                  <View className="flex-1 items-center justify-center py-20">
                    <Sparkles size={64} color={isDark ? '#6b7280' : '#9ca3af'} />
                    <Text className={`mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Configure settings and click Generate
                    </Text>
                  </View>
                ) : (
                  <>
                    {generatedQuestions.map((q, idx) => {
                      const isEditingGenerated = editingGeneratedId === idx;
                      
                      if (isEditingGenerated) {
                        return (
                          <View
                            key={idx}
                            className={`mb-4 p-4 rounded-lg border-2 border-blue-500 ${
                              isDark ? 'bg-gray-800' : 'bg-white'
                            }`}
                          >
                            {/* Header */}
                            <View className="flex-row items-center justify-between mb-4">
                              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Edit Generated Question {idx + 1}
                              </Text>
                              <View className={`px-3 py-1 rounded-full ${
                                q.question_type === 'mcq' 
                                  ? isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                                  : q.question_type === 'code'
                                  ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                                  : isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                              }`}>
                                <Text className={`text-xs font-semibold ${
                                  q.question_type === 'mcq' 
                                    ? isDark ? 'text-blue-300' : 'text-blue-700'
                                    : q.question_type === 'code'
                                    ? isDark ? 'text-green-300' : 'text-green-700'
                                    : isDark ? 'text-purple-300' : 'text-purple-700'
                                }`}>
                                  {q.question_type.toUpperCase()}
                                </Text>
                              </View>
                            </View>

                            {/* Question Text */}
                            <View className="mb-4">
                              <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Question Text
                              </Text>
                              <TextInput
                                value={editGeneratedForm.question_text}
                                onChangeText={(text) => setEditGeneratedForm({ ...editGeneratedForm, question_text: text })}
                                placeholder="Enter question text"
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                className={`px-4 py-3 rounded-lg border ${
                                  isDark 
                                    ? 'bg-gray-900 border-gray-700 text-white' 
                                    : 'bg-gray-50 border-gray-300 text-gray-900'
                                }`}
                                multiline
                                numberOfLines={3}
                              />
                            </View>

                            {/* Points */}
                            <View className="mb-4">
                              <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Points
                              </Text>
                              <TextInput
                                value={editGeneratedForm.points}
                                onChangeText={(text) => setEditGeneratedForm({ ...editGeneratedForm, points: text })}
                                placeholder="Enter points"
                                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                keyboardType="numeric"
                                className={`px-4 py-3 rounded-lg border ${
                                  isDark 
                                    ? 'bg-gray-900 border-gray-700 text-white' 
                                    : 'bg-gray-50 border-gray-300 text-gray-900'
                                }`}
                              />
                            </View>

                            {/* MCQ Options */}
                            {q.question_type === 'mcq' && (
                              <>
                                <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Options
                                </Text>
                                {editGeneratedForm.options.map((option, optIdx) => (
                                  <View key={optIdx} className="mb-3">
                                    <TextInput
                                      value={option}
                                      onChangeText={(text) => {
                                        const newOptions = [...editGeneratedForm.options];
                                        newOptions[optIdx] = text;
                                        setEditGeneratedForm({ ...editGeneratedForm, options: newOptions });
                                      }}
                                      placeholder={`Option ${optIdx + 1}`}
                                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                      className={`px-4 py-3 rounded-lg border ${
                                        isDark 
                                          ? 'bg-gray-900 border-gray-700 text-white' 
                                          : 'bg-gray-50 border-gray-300 text-gray-900'
                                      }`}
                                    />
                                  </View>
                                ))}

                                <View className="mb-4">
                                  <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Correct Answer
                                  </Text>
                                  <TextInput
                                    value={editGeneratedForm.correct_answer}
                                    onChangeText={(text) => setEditGeneratedForm({ ...editGeneratedForm, correct_answer: text })}
                                    placeholder="Enter correct answer"
                                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                    className={`px-4 py-3 rounded-lg border ${
                                      isDark 
                                        ? 'bg-gray-900 border-gray-700 text-white' 
                                        : 'bg-gray-50 border-gray-300 text-gray-900'
                                    }`}
                                  />
                                </View>
                              </>
                            )}

                            {/* Theory Answer */}
                            {q.question_type === 'theory' && (
                              <View className="mb-4">
                                <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Model Answer
                                </Text>
                                <TextInput
                                  value={editGeneratedForm.correct_answer}
                                  onChangeText={(text) => setEditGeneratedForm({ ...editGeneratedForm, correct_answer: text })}
                                  placeholder="Enter model answer"
                                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                  className={`px-4 py-3 rounded-lg border ${
                                    isDark 
                                      ? 'bg-gray-900 border-gray-700 text-white' 
                                      : 'bg-gray-50 border-gray-300 text-gray-900'
                                  }`}
                                  multiline
                                  numberOfLines={4}
                                />
                              </View>
                            )}

                            {/* Coding Test Cases */}
                            {q.question_type === 'code' && (
                              <View className="mb-4">
                                <View className="flex-row items-center justify-between mb-2">
                                  <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Test Cases
                                  </Text>
                                  <Pressable
                                    onPress={() => setEditGeneratedForm({
                                      ...editGeneratedForm,
                                      test_cases: [...editGeneratedForm.test_cases, { input: '', expected_output: '', points: 1 }]
                                    })}
                                    className={`px-3 py-1 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}
                                  >
                                    <Text className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                      + Add Test Case
                                    </Text>
                                  </Pressable>
                                </View>

                                {editGeneratedForm.test_cases.map((testCase, idx) => (
                                  <View key={idx} className={`mb-3 p-3 rounded-lg border ${
                                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'
                                  }`}>
                                    <View className="flex-row items-center justify-between mb-2">
                                      <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Test Case {idx + 1}
                                      </Text>
                                      <Pressable
                                        onPress={() => {
                                          const newTestCases = editGeneratedForm.test_cases.filter((_, i) => i !== idx);
                                          setEditGeneratedForm({ ...editGeneratedForm, test_cases: newTestCases });
                                        }}
                                        className={`p-1 rounded ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}
                                      >
                                        <X size={16} color="#ef4444" />
                                      </Pressable>
                                    </View>

                                    <View className="mb-2">
                                      <Text className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Input
                                      </Text>
                                      <TextInput
                                        value={testCase.input}
                                        onChangeText={(text) => {
                                          const newTestCases = [...editGeneratedForm.test_cases];
                                          newTestCases[idx].input = text;
                                          setEditGeneratedForm({ ...editGeneratedForm, test_cases: newTestCases });
                                        }}
                                        placeholder="Enter test input"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        className={`px-3 py-2 rounded border ${
                                          isDark
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                      />
                                    </View>

                                    <View className="mb-2">
                                      <Text className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Expected Output
                                      </Text>
                                      <TextInput
                                        value={testCase.expected_output}
                                        onChangeText={(text) => {
                                          const newTestCases = [...editGeneratedForm.test_cases];
                                          newTestCases[idx].expected_output = text;
                                          setEditGeneratedForm({ ...editGeneratedForm, test_cases: newTestCases });
                                        }}
                                        placeholder="Enter expected output"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        className={`px-3 py-2 rounded border ${
                                          isDark
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                      />
                                    </View>

                                    <View>
                                      <Text className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Points
                                      </Text>
                                      <TextInput
                                        value={testCase.points.toString()}
                                        onChangeText={(text) => {
                                          const newTestCases = [...editGeneratedForm.test_cases];
                                          newTestCases[idx].points = Number(text) || 1;
                                          setEditGeneratedForm({ ...editGeneratedForm, test_cases: newTestCases });
                                        }}
                                        placeholder="1"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        keyboardType="numeric"
                                        className={`px-3 py-2 rounded border ${
                                          isDark
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                      />
                                    </View>
                                  </View>
                                ))}

                                {editGeneratedForm.test_cases.length === 0 && (
                                  <Text className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No test cases added yet. Click "Add Test Case" to add one.
                                  </Text>
                                )}
                              </View>
                            )}

                            {/* Action Buttons */}
                            <View className="flex-row gap-3">
                              <Pressable
                                onPress={handleCancelEditGenerated}
                                className={`flex-1 py-3 rounded-lg border flex-row items-center justify-center gap-2 ${
                                  isDark 
                                    ? 'border-gray-700 bg-gray-900' 
                                    : 'border-gray-300 bg-gray-50'
                                }`}
                              >
                                <X size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                                <Text className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Cancel
                                </Text>
                              </Pressable>

                              <Pressable
                                onPress={() => handleSaveGenerated(idx)}
                                disabled={!editGeneratedForm.question_text.trim() || !editGeneratedForm.points}
                                className={`flex-1 py-3 rounded-lg flex-row items-center justify-center gap-2 ${
                                  !editGeneratedForm.question_text.trim() || !editGeneratedForm.points
                                    ? 'bg-gray-400' 
                                    : 'bg-blue-500'
                                }`}
                              >
                                <Save size={18} color="white" />
                                <Text className="text-white font-semibold">
                                  Save
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        );
                      }

                      return (
                        <Pressable
                          key={idx}
                          onPress={() => handleToggleSelection(idx)}
                          className={`mb-4 p-4 rounded-lg border-2 ${
                            q.selected
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-row items-center gap-2 flex-1">
                              <View className={`w-6 h-6 rounded border-2 items-center justify-center ${
                                q.selected
                                  ? 'bg-purple-600 border-purple-600'
                                  : isDark ? 'border-gray-600' : 'border-gray-300'
                              }`}>
                                {q.selected && <Text className="text-white text-xs">✓</Text>}
                              </View>
                              <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Q{idx + 1}
                              </Text>
                              {q.difficulty && (
                                <View className={`px-2 py-0.5 rounded ${
                                  q.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30' :
                                  q.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                  'bg-red-100 dark:bg-red-900/30'
                                }`}>
                                  <Text className={`text-xs font-medium ${
                                    q.difficulty === 'easy' ? 'text-green-700 dark:text-green-400' :
                                    q.difficulty === 'medium' ? 'text-yellow-700 dark:text-yellow-400' :
                                    'text-red-700 dark:text-red-400'
                                  }`}>
                                    {q.difficulty.toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              <View className={`px-2 py-0.5 rounded ${
                                q.question_type === 'mcq' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                q.question_type === 'theory' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                'bg-orange-100 dark:bg-orange-900/30'
                              }`}>
                                <Text className={`text-xs font-medium ${
                                  q.question_type === 'mcq' ? 'text-blue-700 dark:text-blue-400' :
                                  q.question_type === 'theory' ? 'text-purple-700 dark:text-purple-400' :
                                  'text-orange-700 dark:text-orange-400'
                                }`}>
                                  {q.question_type.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                            <Pressable
                              onPress={() => handleEditGenerated(idx)}
                              className={`p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                            >
                              <Edit size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                            </Pressable>
                          </View>

                          <Text className={`mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {q.question_text}
                          </Text>

                          {q.question_type === 'mcq' && q.options && (
                            <View className="gap-2">
                              {q.options.map((opt, optIdx) => (
                                <View
                                  key={optIdx}
                                  className={`p-2 rounded ${
                                    opt === q.correct_answer
                                      ? 'bg-green-100 dark:bg-green-900/30 border border-green-500'
                                      : isDark ? 'bg-gray-700' : 'bg-gray-50'
                                  }`}
                                >
                                  <Text className={`text-sm ${
                                    opt === q.correct_answer
                                      ? 'text-green-700 dark:text-green-300 font-medium'
                                      : isDark ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                    {opt === q.correct_answer && ' ✓'}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}

                          {(q.question_type === 'theory' || q.question_type === 'code') && q.correct_answer && (
                            <View className={`p-2 rounded mt-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Answer:
                              </Text>
                              <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {q.correct_answer}
                              </Text>
                            </View>
                          )}

                          <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Points: {q.points}
                          </Text>
                        </Pressable>
                      );
                    })}

                    {/* Action Buttons */}
                    <View className="flex-row gap-3 mt-4 mb-14">
                      <Pressable
                        onPress={handleClearGenerated}
                        className={`flex-1 py-3 rounded-lg border ${
                          isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
                        }`}
                      >
                        <Text className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Clear All
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleAddSelectedQuestions}
                        disabled={addingQuestions || generatedQuestions.filter(q => q.selected).length === 0}
                        className={`flex-1 py-3 rounded-lg ${
                          addingQuestions || generatedQuestions.filter(q => q.selected).length === 0
                            ? 'bg-gray-400'
                            : 'bg-purple-600'
                        }`}
                      >
                        <Text className="text-white text-center font-semibold">
                          {addingQuestions
                            ? 'Adding...'
                            : `Add ${generatedQuestions.filter(q => q.selected).length} Selected`
                          }
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          )}

          {/* RIGHT COLUMN - Existing Questions */}
          {(activeTab === 'existing' || !isMobile) && (
            <View className={`${isMobile ? 'flex-1' : 'basis-1/3'} ${!isMobile ? `border-l ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}` : ''}`}>
              <View className={`p-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Test Questions ({questions.length})
                </Text>
              </View>
              
              <ScrollView className="flex-1 p-4">
                {questions.length === 0 ? (
                  <View className="items-center justify-center py-12">
                    <Text className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      No questions yet
                    </Text>
                  </View>
                ) : (
                  questions.map((q, idx) => {
                    return (
                      <View
                        key={idx}
                        className={`mb-3 p-3 rounded-lg border ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center gap-2 flex-1">
                            <View className={`px-2 py-1 rounded ${
                              isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                            }`}>
                              <Text className={`text-xs font-bold ${
                                isDark ? 'text-blue-400' : 'text-blue-600'
                              }`}>
                                #{idx + 1}
                              </Text>
                            </View>
                            <View className="flex-row gap-2">
                              <View className={`px-2 py-1 rounded ${
                                q.question_type === 'mcq' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                q.question_type === 'code' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                'bg-green-100 dark:bg-green-900/30'
                              }`}>
                                <Text className={`text-xs font-medium ${
                                  q.question_type === 'mcq' ? 'text-purple-600 dark:text-purple-400' :
                                  q.question_type === 'code' ? 'text-orange-600 dark:text-orange-400' :
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  {q.question_type.toUpperCase()}
                                </Text>
                              </View>
                              <Text className={`text-xs font-bold ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {q.points}pts
                              </Text>
                            </View>
                          </View>
                          <Pressable
                            onPress={() => {
                              setEditingId(q.id);
                              let parsedOptions: string[] = ['', '', '', ''];
                              if (q.question_type === 'mcq' && q.options) {
                                try {
                                  const opts = typeof q.options === 'string' ? JSON.parse(q.options) : Array.isArray(q.options) ? q.options : [];
                                  parsedOptions = opts.map((opt: any) => typeof opt === 'string' ? opt : (opt.text || ''));
                                  while (parsedOptions.length < 4) parsedOptions.push('');
                                } catch { parsedOptions = ['', '', '', '']; }
                              }
                              setEditForm({
                                question_text: q.question_text,
                                points: q.points.toString(),
                                correct_answer: q.correct_answer || '',
                                options: parsedOptions,
                                test_cases: q.test_cases || [],
                                expandedId: q.id
                              });
                            }}
                            className={`p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                          >
                            <Edit size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                          </Pressable>
                        </View>
                        {editingId === q.id ? (
                          // Edit mode
                          <View>
                            <TextInput
                              value={editForm.question_text}
                              onChangeText={text => setEditForm(f => ({ ...f, question_text: text }))}
                              placeholder="Question text"
                              className={`mb-2 px-3 py-2 rounded border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                            />
                            {q.question_type === 'mcq' && (
                              <>
                                {editForm.options.map((opt, i) => (
                                  <View key={i} className="mb-2 flex-row items-center gap-2">
                                    <Pressable
                                      onPress={() => setEditForm(f => ({ ...f, correct_answer: opt }))}
                                      className={`w-5 h-5 rounded border-2 items-center justify-center ${
                                        editForm.correct_answer === opt
                                          ? 'bg-green-600 border-green-600'
                                          : isDark ? 'border-gray-600' : 'border-gray-300'
                                      }`}
                                    >
                                      {editForm.correct_answer === opt && (
                                        <Text className="text-white text-xs font-bold">✓</Text>
                                      )}
                                    </Pressable>
                                    <TextInput
                                      value={opt}
                                      onChangeText={text => {
                                        const newOpts = [...editForm.options];
                                        newOpts[i] = text;
                                        setEditForm(f => ({ ...f, options: newOpts }));
                                      }}
                                      placeholder={`Option ${i + 1}`}
                                      className={`flex-1 px-3 py-2 rounded border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                                    />
                                  </View>
                                ))}
                                <Text className={`mb-2 text-xs ${isDark ? 'text-green-400' : 'text-green-700'}`}>Tap a choice to mark as correct</Text>
                              </>
                            )}
                            {q.question_type === 'theory' && (
                              <TextInput
                                value={editForm.correct_answer}
                                onChangeText={text => setEditForm(f => ({ ...f, correct_answer: text }))}
                                placeholder="Model answer"
                                className={`mb-2 px-3 py-2 rounded border ${isDark ? 'bg-purple-900 border-purple-700 text-white' : 'bg-purple-50 border-purple-300 text-gray-900'}`}
                              />
                            )}
                            {q.question_type === 'code' && (
                              <View className="mb-4">
                                <View className="flex-row items-center justify-between mb-2">
                                  <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Test Cases
                                  </Text>
                                  <Pressable
                                    onPress={() => setEditForm({
                                      ...editForm,
                                      test_cases: [...editForm.test_cases, { input: '', expected_output: '', points: 1 }]
                                    })}
                                    className={`px-3 py-1 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}
                                  >
                                    <Text className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                      + Add Test Case
                                    </Text>
                                  </Pressable>
                                </View>

                                {editForm.test_cases.map((testCase, idx) => (
                                  <View key={idx} className={`mb-3 p-3 rounded-lg border ${
                                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'
                                  }`}>
                                    <View className="flex-row items-center justify-between mb-2">
                                      <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Test Case {idx + 1}
                                      </Text>
                                      <Pressable
                                        onPress={() => {
                                          const newTestCases = editForm.test_cases.filter((_, i) => i !== idx);
                                          setEditForm({ ...editForm, test_cases: newTestCases });
                                        }}
                                        className={`p-1 rounded ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}
                                      >
                                        <X size={16} color="#ef4444" />
                                      </Pressable>
                                    </View>

                                    <View className="mb-2">
                                      <Text className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Input
                                      </Text>
                                      <TextInput
                                        value={testCase.input}
                                        onChangeText={(text) => {
                                          const newTestCases = [...editForm.test_cases];
                                          newTestCases[idx].input = text;
                                          setEditForm({ ...editForm, test_cases: newTestCases });
                                        }}
                                        placeholder="Enter test input"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        className={`px-3 py-2 rounded border ${
                                          isDark
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                      />
                                    </View>

                                    <View className="mb-2">
                                      <Text className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Expected Output
                                      </Text>
                                      <TextInput
                                        value={testCase.expected_output}
                                        onChangeText={(text) => {
                                          const newTestCases = [...editForm.test_cases];
                                          newTestCases[idx].expected_output = text;
                                          setEditForm({ ...editForm, test_cases: newTestCases });
                                        }}
                                        placeholder="Enter expected output"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        className={`px-3 py-2 rounded border ${
                                          isDark
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                      />
                                    </View>

                                    <View>
                                      <Text className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Points
                                      </Text>
                                      <TextInput
                                        value={testCase.points.toString()}
                                        onChangeText={(text) => {
                                          const newTestCases = [...editForm.test_cases];
                                          newTestCases[idx].points = Number(text) || 1;
                                          setEditForm({ ...editForm, test_cases: newTestCases });
                                        }}
                                        placeholder="1"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        keyboardType="numeric"
                                        className={`px-3 py-2 rounded border ${
                                          isDark
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                      />
                                    </View>
                                  </View>
                                ))}

                                {editForm.test_cases.length === 0 && (
                                  <Text className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No test cases added yet. Click "Add Test Case" to add one.
                                  </Text>
                                )}
                              </View>
                            )}
                            <View className="flex-row gap-2 mt-2">
                              <Pressable
                                onPress={() => setEditingId(null)}
                                className={`flex-1 py-2 rounded border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-50'}`}
                              >
                                <Text className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cancel</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleSave(q.id, q.question_type)}
                                className={`flex-1 py-2 rounded ${editForm.question_text.trim() ? 'bg-blue-600' : 'bg-gray-400'}`}
                                disabled={!editForm.question_text.trim()}
                              >
                                <Text className="text-center text-white font-semibold">Save</Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : (
                          // Always show full view
                          <View>
                            <Text className={`mb-2 text-base ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{q.question_text}</Text>
                            {q.question_type === 'mcq' && q.options && (
                              <View className="mb-2">
                                <Text className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Options:</Text>
                                {(() => {
                                  try {
                                    const opts = typeof q.options === 'string' ? JSON.parse(q.options) : Array.isArray(q.options) ? q.options : [];
                                    return opts.map((opt: any, i: number) => {
                                      const optionText = typeof opt === 'string' ? opt : (opt.text || '');
                                      const isCorrect = typeof opt === 'object' ? opt.is_correct : (optionText === q.correct_answer);
                                      return (
                                        <View key={i} className={`flex-row items-center mb-1 p-2 rounded ${isCorrect ? 'bg-green-100 border border-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                          <Text className={`mr-2 text-xs font-bold ${isCorrect ? 'text-green-700' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>{String.fromCharCode(65 + i)}.</Text>
                                          <Text className={`text-sm ${isCorrect ? 'text-green-700 font-semibold' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>{optionText}{isCorrect ? ' ✓' : ''}</Text>
                                        </View>
                                      );
                                    });
                                  } catch {
                                    return null;
                                  }
                                })()}
                              </View>
                            )}
                            {q.question_type === 'theory' && q.correct_answer && (
                              <View className="mb-2">
                                <Text className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Model Answer:</Text>
                                <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{q.correct_answer}</Text>
                              </View>
                            )}
                            {q.question_type === 'code' && q.test_cases && q.test_cases.length > 0 && (
                              <View className="mb-2">
                                <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Test Cases:
                                </Text>
                                {q.test_cases.map((testCase, idx) => (
                                  <View
                                    key={idx}
                                    className={`mb-2 p-3 rounded-lg border ${
                                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <View className="flex-row items-center justify-between mb-2">
                                      <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Test Case {idx + 1}
                                      </Text>
                                      <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                                        <Text className={`text-xs font-semibold ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                          {testCase.points} pts
                                        </Text>
                                      </View>
                                    </View>

                                    <View className="mb-2">
                                      <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Input:
                                      </Text>
                                      <Text className={`text-sm font-mono p-2 rounded ${
                                        isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
                                      }`}>
                                        {testCase.input || 'No input'}
                                      </Text>
                                    </View>

                                    <View>
                                      <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Expected Output:
                                      </Text>
                                      <Text className={`text-sm font-mono p-2 rounded ${
                                        isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
                                      }`}>
                                        {testCase.expected_output || 'No output expected'}
                                      </Text>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
                <View className="mt-14"/>
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
