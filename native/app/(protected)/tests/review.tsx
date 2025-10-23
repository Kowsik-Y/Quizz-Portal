import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { attemptAPI } from '@/lib/api';
import { TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle, Flag, Home } from 'lucide-react-native';

interface AttemptReview {
  attempt: {
    score: number;
    total_points: number;
    submitted_at: string;
    test_title: string;
    passing_score: number;
  };
  answers: Array<{
    question_text: string;
    question_type: string;
    answer: string;
    code_submission: string;
    is_correct: boolean;
    is_flagged: boolean;
    points_earned: number;
    correct_answer: string;
    explanation: string;
    options: string[];
    test_cases: Array<{
      input: string;
      expected_output: string;
    }>;
    test_results: Array<{
      input: string;
      expected_output: string;
      actual_output: string;
      passed: boolean;
    }>;
  }>;
}

export default function ReviewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const attemptId = parseInt(params.attemptId as string);

  const [review, setReview] = useState<AttemptReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReview();
  }, [attemptId]);

  const fetchReview = async () => {
    try {
      const response = await attemptAPI.getReview(attemptId);
      console.log('📊 Review data:', response.data);
      setReview(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch review:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!review) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted-foreground">Review not found</Text>
      </View>
    );
  }

  const percentage = Math.round((review.attempt.score / review.attempt.total_points) * 100);
  const passed = percentage >= review.attempt.passing_score;

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Score Card */}
        <View className={`rounded-lg p-6 mb-6 ${passed ? 'bg-green-500/10 border-2 border-green-500' : 'bg-red-500/10 border-2 border-red-500'}`}>
          <View className="items-center">
            {passed ? (
              <CheckCircle size={64} color="#22c55e" />
            ) : (
              <XCircle size={64} color="#ef4444" />
            )}
            <Text className={`text-3xl font-bold mt-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {percentage}%
            </Text>
            <Text className="text-lg font-semibold mt-2">
              {review.attempt.score} / {review.attempt.total_points} points
            </Text>
            <Text className={`text-sm mt-2 font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? '✓ Passed' : '✗ Failed'} (Required: {review.attempt.passing_score}%)
            </Text>
          </View>
        </View>

        {/* Test Info */}
        <View className="bg-card rounded-lg p-4 mb-6 border border-border">
          <Text className="text-lg font-bold mb-2">{review.attempt.test_title}</Text>
          <Text className="text-sm text-muted-foreground">
            Submitted: {new Date(review.attempt.submitted_at).toLocaleString()}
          </Text>
        </View>

        {/* Questions Review */}
        <Text className="text-xl font-bold mb-4">Detailed Review</Text>
        
        {review.answers && review.answers.length > 0 ? (
          review.answers.map((answer, idx) => (
            <View key={idx} className="bg-card rounded-lg p-4 mb-4 border border-border">
              {/* Question Header */}
              <View className="flex-row justify-between items-start mb-3">
                <Text className="text-base font-semibold flex-1">
                  Q{idx + 1}. {answer.question_text}
                </Text>
                {answer.is_flagged && (
                  <Flag size={16} color="#eab308" />
                )}
              </View>

            {/* MCQ Answer */}
            {answer.question_type === 'mcq' && (
              <View>
                <Text className="text-sm text-muted-foreground mb-2">Your Answer:</Text>
                <View className={`p-3 rounded-lg mb-2 ${answer.is_correct ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <Text className={answer.is_correct ? 'text-green-600' : 'text-red-600'}>
                    {answer.answer || 'Not answered'}
                  </Text>
                </View>

                {!answer.is_correct && (
                  <>
                    <Text className="text-sm text-muted-foreground mb-2">Correct Answer:</Text>
                    <View className="p-3 rounded-lg bg-green-500/10 mb-2">
                      <Text className="text-green-600">{answer.correct_answer}</Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Code Answer */}
            {answer.question_type === 'code' && (
              <View>
                <Text className="text-sm text-muted-foreground mb-2">Your Code:</Text>
                <View className={`rounded-lg p-3 mb-3 ${answer.code_submission ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  <Text className={`font-mono text-xs ${answer.code_submission ? 'text-green-400' : 'text-gray-500'}`}>
                    {answer.code_submission || '// No code submitted'}
                  </Text>
                </View>

                {/* Test Cases */}
                {answer.test_cases && answer.test_cases.length > 0 && (
                  <View className="mb-3">
                    <Text className="text-sm text-muted-foreground mb-2">Test Cases:</Text>
                    {answer.test_cases.map((testCase, testIdx) => {
                      // Get the actual result for this test case
                      const testResult = answer.test_results && answer.test_results[testIdx];
                      const isPassed = testResult ? testResult.passed : false;
                      
                      console.log(`Test case ${testIdx}:`, {
                        testResult,
                        isPassed,
                        test_results: answer.test_results,
                        test_results_type: typeof answer.test_results
                      });
                      
                      return (
                        <View key={testIdx} className="bg-gray-50 rounded-lg p-3 mb-2 border border-gray-200">
                          <View className="flex-row items-center mb-2">
                            <Text className="text-xs font-semibold text-gray-600 mr-2">
                              Test Case {testIdx + 1}:
                            </Text>
                            <View className={`px-2 py-1 rounded-full ${isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
                              <Text className={`text-xs font-medium ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                                {isPassed ? '✓ Passed' : '✗ Failed'}
                              </Text>
                            </View>
                          </View>
                          
                          <View className="mb-2">
                            <Text className="text-xs text-gray-500 mb-1">Input:</Text>
                            <View className="bg-white rounded p-2 border">
                              <Text className="font-mono text-xs text-gray-800">
                                {testCase.input}
                              </Text>
                            </View>
                          </View>
                          
                          <View className="mb-2">
                            <Text className="text-xs text-gray-500 mb-1">Expected Output:</Text>
                            <View className="bg-white rounded p-2 border">
                              <Text className="font-mono text-xs text-gray-800">
                                {testCase.expected_output}
                              </Text>
                            </View>
                          </View>

                          {/* Show actual output if test failed */}
                          {testResult && !testResult.passed && testResult.actual_output && (
                            <View>
                              <Text className="text-xs text-gray-500 mb-1">Your Output:</Text>
                              <View className="bg-red-50 rounded p-2 border border-red-200">
                                <Text className="font-mono text-xs text-red-800">
                                  {testResult.actual_output}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Code Status */}
                <View className={`p-3 rounded-lg mb-2 ${answer.is_correct ? 'bg-green-500/10 border border-green-200' : 'bg-red-500/10 border border-red-200'}`}>
                  <View className="flex-row items-center">
                    {answer.is_correct ? (
                      <CheckCircle size={16} color="#22c55e" />
                    ) : (
                      <XCircle size={16} color="#ef4444" />
                    )}
                    <Text className={`ml-2 text-sm font-medium ${answer.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                      {answer.is_correct ? 'Code passed all test cases' : 'Code failed test cases'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Explanation */}
            {answer.explanation && (
              <View className="mt-3 p-3 bg-blue-500/10 rounded-lg">
                <Text className="text-sm font-semibold text-blue-600 mb-1">Explanation:</Text>
                <Text className="text-sm text-foreground">{answer.explanation}</Text>
              </View>
            )}

            {/* Points */}
            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-border">
              <Text className="text-sm text-muted-foreground">
                Points Earned:
              </Text>
              <Text className={`text-sm font-bold ${answer.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                {answer.points_earned}
              </Text>
            </View>
          </View>
        ))
        ) : (
          <View className="bg-card rounded-lg p-6 border border-border">
            <Text className="text-center text-muted-foreground">No answers found</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View className="bg-card border-t border-border p-4">
        <TouchableOpacity
          onPress={() => router.push('/home')}
          className="bg-primary rounded-lg py-3 flex-row items-center justify-center"
        >
          <Home size={20} color="#fff" />
          <Text className="text-white font-semibold ml-2">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
