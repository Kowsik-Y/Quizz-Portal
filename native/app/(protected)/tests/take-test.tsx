import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform, useWindowDimensions, Pressable, AppState } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { questionAPI, attemptAPI, codeAPI, testAPI } from '@/lib/api';
import { Flag, Play, CheckCircle, XCircle, Shield } from 'lucide-react-native';
import { TestNavigationBar, TestSidebar } from '@/components/TestNavigationBar';
import { useColorScheme } from 'nativewind';
import { useCustomAlert } from '@/components/ui/custom-alert';
import { CodeEditor } from '@/components/CodeEditor';
import { AntiCheatWarning } from '@/components/AntiCheatWarning';
import { useAntiCheat } from '@/hooks/useAntiCheat';


interface Question {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'code' | 'theory';
  options?: string[] | string; // Can be array or JSON string
  test_cases?: Array<{ input: string; expected_output: string }> | string;
  points: number;
  order_number: number;
}

interface Answer {
  question_id: number;
  answer?: string;
  code_submission?: string;
  is_flagged: boolean;
}

export default function TakeTestScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { width } = useWindowDimensions();
  const { showAlert } = useCustomAlert();

  // Handle both 'id' and 'testId' parameters for compatibility
  const testId = parseInt((params.testId || params.id) as string);
  const paramAttemptId = params.attemptId ? parseInt(params.attemptId as string) : undefined;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [runningCode, setRunningCode] = useState(false);
  const [codeOutput, setCodeOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);
  const [testResultsMap, setTestResultsMap] = useState<Map<number, any>>(new Map());
  const [attemptId, setAttemptId] = useState<number | undefined>(paramAttemptId);
  const [testTitle, setTestTitle] = useState<string>('');
  const [testConfig, setTestConfig] = useState<{ show_review_to_students?: boolean } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(undefined);
  const [testDuration, setTestDuration] = useState<number | undefined>(undefined);
  const [testStartTime, setTestStartTime] = useState<Date | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const [customInput, setCustomInput] = useState<string>('');

  // Anti-cheating states
  const [showAntiCheatWarning, setShowAntiCheatWarning] = useState(true);
  const [antiCheatAccepted, setAntiCheatAccepted] = useState(false);
  const [antiCheatEnabled, setAntiCheatEnabled] = useState(false);

  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 1024;

  // Anti-cheating monitoring
  const { violations, violationCount, isTabVisible, isFullscreen, exitedFullscreen } = useAntiCheat({
    attemptId,
    enabled: antiCheatEnabled && antiCheatAccepted,
    onViolation: (violation) => {
      showAlert('Anti-Cheat Violation', `A violation was detected`);
    }
  });

  // Calculate answered and flagged questions
  const answeredQuestions = new Set(
    Array.from(answers.values())
      .filter(ans => ans.answer || ans.code_submission)
      .map(ans => questions.findIndex(q => q.id === ans.question_id))
      .filter(idx => idx !== -1)
  );

  const flaggedQuestions = new Set(
    Array.from(answers.values())
      .filter(ans => ans.is_flagged)
      .map(ans => questions.findIndex(q => q.id === ans.question_id))
      .filter(idx => idx !== -1)
  );

  useEffect(() => {
    if (testId) {
      initializeTest();
    }
  }, [testId]);

  const initializeTest = async () => {
    try {
      setLoading(true);

      // Fetch test details to get the title
      try {
        const testResponse = await testAPI.getById(testId);
        const test = testResponse.data.test || testResponse.data;
        setTestTitle(test.title || 'Test');
        setTestConfig({
          show_review_to_students: test.show_review_to_students
        });

        // Initialize timer if test has duration
        if (test.duration_minutes && test.duration_minutes > 0) {
          const durationInSeconds = test.duration_minutes * 60;
          setTestDuration(durationInSeconds);
          setTestStartTime(new Date());
          setTimeRemaining(durationInSeconds);
        }
      } catch (error) {
        setTestTitle('Test');
        setTestConfig(null);
      }

      // If no attemptId provided, create a new attempt
      if (!paramAttemptId) {
        try {
          const platform = Platform.OS;
          const browser = Platform.OS === 'web' ?
            (navigator.userAgent.includes('Chrome') ? 'chrome' :
              navigator.userAgent.includes('Firefox') ? 'firefox' :
                navigator.userAgent.includes('Safari') ? 'safari' : 'unknown') :
            platform;

          const attemptResponse = await attemptAPI.start({
            test_id: testId,
            platform: platform,
            browser: browser,
            device_info: {
              userAgent: Platform.OS === 'web' ? navigator.userAgent : Platform.OS,
              screen: Platform.OS === 'web' ? `${window.screen.width}x${window.screen.height}` : 'mobile'
            }
          });

          const newAttemptId = attemptResponse.data.attempt.id;
          setAttemptId(newAttemptId);

          // Fetch questions immediately with the new attempt ID
          await fetchQuestions(newAttemptId);
          return; // Exit early since we've handled the attempt creation
        } catch (attemptError: any) {
          // If max attempts reached
          if (attemptError.response?.status === 403 && attemptError.response?.data?.error?.includes('maximum')) {
            showAlert(
              'Maximum Attempts Reached',
              attemptError.response.data.error + '\n\nYou can view your previous attempts in the "My Reports" tab on the test details page.',
              [
                {
                  text: 'OK',
                  onPress: () => router.back()
                }
              ]
            );
            return;
          }
          throw attemptError;
        }
      }

      // Fetch questions - use the attemptId from params
      await fetchQuestions(paramAttemptId);
    } catch (error: any) {
      showAlert(
        'Error',
        error.response?.data?.error || 'Failed to start test',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const fetchQuestions = async (attemptIdParam?: number) => {
    try {
      const response = await questionAPI.getByTest(testId, attemptIdParam || attemptId);
      const questionsList = response.data.questions || response.data || [];
      const parsedQuestions = questionsList.map((q: any) => {
        const question = { ...q };
        // Parse options if it's a string
        if (question.options && typeof question.options === 'string') {
          try {
            const parsed = JSON.parse(question.options);
            // Convert object array to string array
            if (Array.isArray(parsed)) {
              question.options = parsed.map((opt: any) =>
                typeof opt === 'string' ? opt : (opt.text || '')
              );
            } else {
              question.options = [];
            }
          } catch (e) {
            showAlert('Error', 'Failed to parse question options');
            question.options = [];
          }
        } else if (Array.isArray(question.options)) {
          // Ensure it's a string array
          question.options = question.options.map((opt: any) =>
            typeof opt === 'string' ? opt : (opt.text || '')
          );
        }

        // Parse test_cases if it's a string
        if (question.test_cases && typeof question.test_cases === 'string') {
          try {
            question.test_cases = JSON.parse(question.test_cases);
          } catch (e) {
            showAlert('Error', 'Failed to parse question test cases');
            question.test_cases = [];
          }
        }

        return question;
      });

      setQuestions(parsedQuestions.sort((a: Question, b: Question) => a.order_number - b.order_number));
    } catch (error) {
      showAlert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : undefined;

  // Reset test results when navigating to a different question
  useEffect(() => {
    if (currentQuestion) {
      // Restore test results for this question if they exist
      const savedResults = testResultsMap.get(currentQuestion.id);
      setTestResults(savedResults || null);
      setCodeOutput(''); // Always reset code output when changing questions
    }
  }, [currentQuestion?.id, testResultsMap]);

  // Countdown timer effect
  useEffect(() => {
    let interval: number;

    if (timeRemaining !== undefined && timeRemaining > 0 && testStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000);
        const remaining = Math.max(0, testDuration! - elapsed);

        setTimeRemaining(remaining);

        // Auto-submit when time runs out
        if (remaining === 0 && attemptId && !submitting) {
          showAlert(
            'Time\'s Up!',
            'Your test time has expired. The test will be submitted automatically.',
            [
              {
                text: 'OK',
                onPress: () => handleSubmitTest()
              }
            ]
          );
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRemaining, testStartTime, testDuration, attemptId, submitting]);

  // App lifecycle monitoring for anti-cheat
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (antiCheatEnabled && attemptId && nextAppState !== 'active') {
        // App is going to background or becoming inactive
        showAlert(
          'Test Violation Detected',
          'You cannot leave the app during a test. This violation has been recorded.',
          [
            {
              text: 'Return to Test',
              onPress: () => {
                // Log the violation
                // Note: The useAntiCheat hook should handle this, but we can add additional logging here if needed
              }
            }
          ]
        );
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [antiCheatEnabled, attemptId]);

  // Web browser navigation prevention
  useEffect(() => {
    if (isWeb && antiCheatEnabled && attemptId) {
      // Prevent browser back/forward navigation
      const handlePopState = (event: PopStateEvent) => {
        event.preventDefault();
        showAlert(
          'Navigation Blocked',
          'You cannot navigate away from the test. This violation has been recorded.',
          [
            {
              text: 'Continue Test',
              onPress: () => {
                // Push current state back to prevent navigation
                window.history.pushState(null, '', window.location.href);
              }
            }
          ]
        );
        return false;
      };

      // Prevent page unload (refresh, close tab, etc.)
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
        return event.returnValue;
      };

      // Prevent context menu (right-click) to avoid additional navigation options
      const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault();
        return false;
      };

      // Add event listeners
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('contextmenu', handleContextMenu);

      // Push initial state to enable popstate detection
      window.history.pushState(null, '', window.location.href);

      return () => {
        // Cleanup event listeners
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [isWeb, antiCheatEnabled, attemptId]);

  // Cleanup navigation prevention when test is submitted
  useEffect(() => {
    if (isWeb && !antiCheatEnabled) {
      // Remove any remaining event listeners when anti-cheat is disabled
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        // Allow normal page unload when test is completed
      };

      // Temporarily allow navigation when test is done
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isWeb, antiCheatEnabled]);

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;

    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      question_id: currentQuestion.id,
      answer: option,
      is_flagged: currentAnswer?.is_flagged || false
    });
    setAnswers(newAnswers);

    // Auto-save answer
    saveAnswer(currentQuestion.id, option, undefined, currentAnswer?.is_flagged || false);
  };

  const handleCodeChange = (code: string) => {
    if (!currentQuestion) return;

    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      question_id: currentQuestion.id,
      code_submission: code,
      is_flagged: currentAnswer?.is_flagged || false
    });
    setAnswers(newAnswers);
  };

  const handleTextAnswer = (text: string) => {
    if (!currentQuestion) return;

    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      question_id: currentQuestion.id,
      answer: text,
      is_flagged: currentAnswer?.is_flagged || false
    });
    setAnswers(newAnswers);

    // Auto-save answer
    saveAnswer(currentQuestion.id, text, undefined, currentAnswer?.is_flagged || false);
  };

  const handleRunCode = async () => {
    if (!currentAnswer?.code_submission) {
      showAlert('Error', 'Please write some code first');
      return;
    }

    setRunningCode(true);
    setCodeOutput('');
    setTestResults(null);

    try {
      const response = await codeAPI.execute({
        code: currentAnswer.code_submission,
        language: selectedLanguage,
        test_cases: [{
          input: '',
          expected_output: ''
        }]
      });

      setCodeOutput(response.data.output || response.data.error || 'No output');
    } catch (error: any) {
      setCodeOutput('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setRunningCode(false);
    }
  };

  const handleTestCode = async () => {
    if (!currentAnswer?.code_submission || !currentQuestion?.test_cases) {
      showAlert('Error', 'No code or test cases available');
      return;
    }

    setRunningCode(true);
    setTestResults(null);

    try {
      const response = await codeAPI.test({
        code: currentAnswer.code_submission,
        language: selectedLanguage,
        test_cases: Array.isArray(currentQuestion.test_cases)
          ? currentQuestion.test_cases
          : JSON.parse(currentQuestion.test_cases as string)
      });

      setTestResults(response.data);

      // Store test results for this question
      setTestResultsMap(prev => new Map(prev.set(currentQuestion.id, response.data)));

      // Calculate partial points based on passed test cases
      const pointsPerTestCase = currentQuestion.points / response.data.total_count;
      const earnedPoints = response.data.passed_count * pointsPerTestCase;

      // Mark the answer as correct with partial points if any test cases passed
      if (response.data.passed_count > 0 && attemptId) {
        try {
          // First save the code answer to ensure it exists in the database
          await saveAnswer(
            currentQuestion.id,
            undefined,
            currentAnswer.code_submission,
            currentAnswer.is_flagged
          );

          // Then mark it as correct with partial points
          await attemptAPI.markCodeCorrect({
            attempt_id: attemptId,
            question_id: currentQuestion.id,
            passed_count: response.data.passed_count,
            total_test_cases: response.data.total_count,
            test_results: response.data.results // Pass individual test case results
          });
        } catch (markError) {
          showAlert('Error', 'Failed to mark code as correct');
        }
      }
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to test code');
    } finally {
      setRunningCode(false);
    }
  };

  const saveAnswer = async (questionId: number, answer?: string, codeSubmission?: string, isFlagged = false) => {
    // Only save if we have an attemptId (for tracked attempts)
    if (!attemptId) return;

    try {
      await attemptAPI.submitAnswer({
        attempt_id: attemptId,
        question_id: questionId,
        answer,
        code_submission: codeSubmission,
        is_flagged: isFlagged
      });
    } catch (error) {
      showAlert('Error', 'Failed to save answer');
    }
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;

    const isFlagged = !currentAnswer?.is_flagged;
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      ...currentAnswer,
      question_id: currentQuestion.id,
      is_flagged: isFlagged
    });
    setAnswers(newAnswers);

    saveAnswer(
      currentQuestion.id,
      currentAnswer?.answer,
      currentAnswer?.code_submission,
      isFlagged
    );
  };

  const handleSubmitTest = () => {
    // Check if we have an attempt to submit
    if (!attemptId) {
      showAlert(
        'Error',
        'No active test attempt found. Please try starting the test again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    showAlert(
      'Submit Test',
      'Are you sure you want to submit? You cannot change answers after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              // Save current code answer if exists and wasn't already saved during testing
              if (currentQuestion?.question_type === 'code' && currentAnswer?.code_submission) {
                // Check if this answer was already tested (has test results)
                const wasTested = testResults !== null;
                if (!wasTested) {
                  // Only save if it wasn't tested (which would have saved it already)
                  await saveAnswer(
                    currentQuestion.id,
                    undefined,
                    currentAnswer.code_submission,
                    currentAnswer.is_flagged
                  );
                }
              }

              // Submit test
              const response = await attemptAPI.submit({ attempt_id: attemptId });

              // Disable anti-cheat monitoring BEFORE exiting fullscreen
              // This prevents the exit from being logged as a violation
              setAntiCheatEnabled(false);

              // Small delay to ensure anti-cheat cleanup
              await new Promise(resolve => setTimeout(resolve, 100));

              // Exit fullscreen after test completion (web only)
              if (Platform.OS === 'web' && document.fullscreenElement) {
                try {
                  await document.exitFullscreen();
                } catch (error) {
                  showAlert('Error', 'Failed to exit fullscreen mode');
                }
              }

              showAlert(
                'Test Submitted!',
                `Score: ${response.data.score}/${response.data.total_points} (${response.data.percentage}%)`,
                testConfig?.show_review_to_students !== false ? [
                  {
                    text: 'View Review',
                    onPress: () => router.replace(`/tests/review?attemptId=${attemptId}` as any)
                  }
                ] : [
                  {
                    text: 'Back to Test Details',
                    onPress: () => router.replace(`/tests/test-details?id=${testId}` as any)
                  }
                ]
              );
            } catch (error: any) {
              showAlert('Error', error.response?.data?.error || 'Failed to submit test');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted-foreground">No questions available</Text>
      </View>
    );
  }

  const rootClassName = Platform.OS === 'web' && antiCheatEnabled
    ? 'flex-1 flex-row bg-background anti-screenshot-protection'
    : 'flex-1 flex-row bg-background';
  return (
    <View
      className={rootClassName}
    >
      {/* Sidebar - Desktop Only - LEFT SIDE */}
      {isWeb && isLargeScreen && (
        <TestSidebar
          totalQuestions={questions.length}
          currentIndex={currentIndex}
          answeredQuestions={answeredQuestions}
          flaggedQuestions={flaggedQuestions}
          onNavigate={(index) => setCurrentIndex(index)}
          onPrevious={() => { }}
          onNext={() => { }}
          onSubmit={handleSubmitTest}
          timeRemaining={timeRemaining}
          testTitle={testTitle}
        />
      )}

      {/* Main Content */}
      <View className="flex-1">
        {/* Header */}
        <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4`}>
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
              {testTitle && (
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  {testTitle}
                </Text>
              )}
            </View>

            {/* Timer Display */}
            {timeRemaining !== undefined && timeRemaining >= 0 && (
              <View className="flex-row items-center mr-4">
                <View className={`px-3 py-1 rounded-lg ${timeRemaining <= 300 ? 'bg-red-500' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Text className={`text-sm font-mono font-semibold ${timeRemaining <= 300 ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleToggleFlag}
                className={`p-2 rounded-lg ${currentAnswer?.is_flagged ? 'bg-yellow-500/20' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <Flag size={20} color={currentAnswer?.is_flagged ? '#eab308' : '#999'} fill={currentAnswer?.is_flagged ? '#eab308' : 'none'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitTest}
                disabled={submitting}
                className="bg-green-500 px-4 py-2 rounded-lg flex-row items-center gap-2"
              >
                <CheckCircle size={20} color="white" />
                <Text className="text-white font-semibold">
                  {submitting ? 'Submitting...' : 'Finish Test'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Bar */}
          <View className={`mt-3 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <View
              className="h-full bg-blue-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </View>
        </View>

        {/* Fullscreen Warning Banner - Web Only */}
        {isWeb && antiCheatEnabled && exitedFullscreen && !isFullscreen && (
          <Pressable
            onPress={async () => {
              try {
                if (Platform.OS === 'web') {
                  const elem = document.documentElement;
                  if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                  }
                }
              } catch (error) {
                showAlert('Error', 'Failed to enter fullscreen mode');
              }
            }}
            className="bg-red-500 px-4 py-3 flex-row items-center justify-between active:bg-red-600"
          >
            <View className="flex-row items-center flex-1">
              <Shield size={24} color="white" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-bold text-base">
                  FULLSCREEN REQUIRED - TAP TO RETURN
                </Text>
                <Text className="text-white text-sm mt-1">
                  You exited fullscreen mode. This violation has been recorded.
                </Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* Question Content */}
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Question Text */}
          <View className="mb-6">
            {currentQuestion.question_type !== 'code' && (
              <Text className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {currentQuestion.question_text}
              </Text>
            )}

            <View className="flex-row items-center gap-2">
              <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <Text className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {currentQuestion.question_type === 'code' && testResults
                    ? `${(testResults.passed_count * (currentQuestion.points / testResults.total_count)).toFixed(1)}/${currentQuestion.points}`
                    : `${currentQuestion.points} ${currentQuestion.points === 1 ? 'point' : 'points'}`}
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${currentQuestion.question_type === 'mcq'
                  ? isDark ? 'bg-green-900/20' : 'bg-green-50'
                  : isDark ? 'bg-purple-900/20' : 'bg-purple-50'
                }`}>
                <Text className={`text-sm font-semibold ${currentQuestion.question_type === 'mcq'
                    ? isDark ? 'text-green-400' : 'text-green-600'
                    : isDark ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                  {currentQuestion.question_type.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* MCQ Options */}
          {currentQuestion.question_type === 'mcq' && currentQuestion.options && Array.isArray(currentQuestion.options) && (
            <View style={{ gap: 12 }}>
              {currentQuestion.options.map((option: string, idx: number) => {
                const isSelected = currentAnswer?.answer === option;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectOption(option)}
                    className={`p-4 rounded-lg border-2 ${isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : isDark
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-200 bg-white'
                      }`}
                  >
                    <Text className={`${isSelected ? 'text-blue-500 font-semibold' : isDark ? 'text-white' : 'text-gray-900'}`}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Code Editor - LeetCode Split Layout */}
          {currentQuestion.question_type === 'code' && (
            <View className="flex-1 flex-row gap-3">
              {/* LEFT SIDE - Question & Test Cases */}
              <View className={`${isWeb ? 'w-[45%]' : 'w-full'} ${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <ScrollView className="p-4" >
                  {/* Question Description */}
                  <View className="mb-4">
                    <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Question {currentQuestion.order_number}
                    </Text>
                    <Text className={`text-sm leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {currentQuestion.question_text}
                    </Text>
                  </View>

                  {/* Test Cases Section */}
                  {currentQuestion.test_cases && (
                    <View>
                      <View className="flex-row items-center mb-3">
                        <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Test Cases
                        </Text>
                        {testResults && (
                          <Text className={`ml-2 text-xs px-2 py-0.5 rounded ${testResults.passed_count === testResults.total_count
                              ? 'bg-green-500/20 text-green-600'
                              : 'bg-red-500/20 text-red-600'
                            }`}>
                            {testResults.passed_count}/{testResults.total_count}
                          </Text>
                        )}
                      </View>

                      {/* Test Cases List */}
                      {(Array.isArray(currentQuestion.test_cases)
                        ? currentQuestion.test_cases
                        : JSON.parse(currentQuestion.test_cases as string)
                      ).map((testCase: any, idx: number) => {
                        const testResult = testResults?.results?.[idx];
                        return (
                          <View
                            key={idx}
                            className={`mb-3 p-3 rounded-lg border ${testResult?.passed === true
                                ? 'border-green-500 bg-green-500/5'
                                : testResult?.passed === false
                                  ? 'border-red-500 bg-red-500/5'
                                  : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                              }`}
                          >
                            <View className="flex-row items-center justify-between mb-2">
                              <Text className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Case {idx + 1}
                              </Text>
                              {testResult && (
                                <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded ${testResult.passed
                                    ? 'bg-green-500/20'
                                    : 'bg-red-500/20'
                                  }`}>
                                  {testResult.passed ? (
                                    <CheckCircle size={12} color="#22c55e" />
                                  ) : (
                                    <XCircle size={12} color="#ef4444" />
                                  )}
                                  <Text className={`text-xs font-bold ${testResult.passed ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {testResult.passed ? 'PASS' : 'FAIL'}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <View className={`p-2 rounded ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                Input:
                              </Text>
                              <Text className={`text-sm font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                {testCase.input}
                              </Text>
                            </View>

                            <View className={`p-2 rounded mt-2 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                Expected Output:
                              </Text>
                              <Text className={`text-sm font-mono ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                {testCase.expected_output}
                              </Text>
                            </View>

                            {testResult && !testResult.passed && testResult.actual_output && (
                              <View className={`p-2 rounded mt-2 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                  Your Output:
                                </Text>
                                <Text className={`text-sm font-mono ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                  {testResult.actual_output}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Console Output in Left Side */}
                  {codeOutput && (
                    <View className="mt-4">
                      <Text className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Console Output
                      </Text>
                      <View className={`p-3 rounded-lg ${isDark ? 'bg-black' : 'bg-gray-900'} border ${isDark ? 'border-gray-800' : 'border-gray-700'}`}>
                        <Text className="text-xs font-mono text-gray-500 mb-1">$ Running code...</Text>
                        <Text className="text-sm font-mono text-green-400 leading-5">
                          {codeOutput}
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>

              {/* RIGHT SIDE - Advanced Code Editor */}
              <View className={`${isWeb ? 'flex-1' : 'hidden'} flex-col`}>
                {/* Language Tabs */}
                <View className={`flex-row items-center px-2 pt-2 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  {['javascript', 'python', 'java', 'cpp', 'c'].map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => setSelectedLanguage(lang)}
                      className={`mr-1 px-4 py-2 rounded-t-lg flex-row items-center gap-2 ${selectedLanguage === lang
                          ? isDark ? 'bg-gray-800' : 'bg-white'
                          : isDark ? 'bg-gray-900 opacity-60' : 'bg-gray-100 opacity-80'
                        }`}
                    >
                      <View className={`w-2 h-2 rounded-full ${selectedLanguage === lang
                          ? lang === 'javascript' ? 'bg-yellow-400' :
                            lang === 'python' ? 'bg-blue-400' :
                              lang === 'java' ? 'bg-red-400' :
                                lang === 'cpp' ? 'bg-purple-400' : 'bg-gray-400'
                          : 'bg-gray-500'
                        }`} />
                      <Text className={`text-xs font-medium ${selectedLanguage === lang
                          ? isDark ? 'text-white' : 'text-gray-900'
                          : isDark ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                        {lang === 'cpp' ? 'C++' :
                          lang === 'javascript' ? 'JS' :
                            lang === 'python' ? 'PY' :
                              lang === 'java' ? 'Java' : 'C'}
                      </Text>
                      {selectedLanguage === lang && (
                        <View className={`w-1 h-1 rounded-full ${isDark ? 'bg-green-400' : 'bg-green-500'}`} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Professional Code Editor Component */}
                <CodeEditor
                  value={currentAnswer?.code_submission || ''}
                  onChange={handleCodeChange}
                  language={selectedLanguage}
                  placeholder={`// Write your ${selectedLanguage === 'cpp' ? 'C++' : selectedLanguage} code here...`}
                  minHeight={500}
                />

                {/* Custom Input Section */}
                <View className={`px-4 py-3 border-t ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <Text className={`text-xs font-semibold mb-2 uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    🧪 Custom Input (Test Your Code)
                  </Text>
                  <TextInput
                    value={customInput}
                    onChangeText={setCustomInput}
                    placeholder="Enter custom input to test your code (e.g., 5 10)..."
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    multiline
                    className={`min-h-[80px] p-3 rounded-lg border font-mono text-xs ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'
                      }`}
                    style={{ textAlignVertical: 'top' }}
                  />
                  <Text className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    💡 Tip: Enter input values separated by spaces or new lines
                  </Text>
                </View>

                {/* Action Buttons - IDE Style */}
                <View className={`flex-row gap-2 px-4 py-3 border-t ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <TouchableOpacity
                    onPress={handleRunCode}
                    disabled={runningCode}
                    className={`flex-1 rounded-md py-2.5 flex-row items-center justify-center ${runningCode
                        ? isDark ? 'bg-gray-800' : 'bg-gray-300'
                        : isDark ? 'bg-green-600' : 'bg-green-500'
                      }`}
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2
                    }}
                  >
                    {runningCode ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Play size={16} color="white" fill="white" />
                    )}
                    <Text className="text-white font-semibold ml-2 text-sm">
                      {runningCode ? 'Running...' : 'Run Code'}
                    </Text>
                  </TouchableOpacity>

                  {currentQuestion.test_cases && (
                    <TouchableOpacity
                      onPress={handleTestCode}
                      disabled={runningCode}
                      className={`flex-1 rounded-md py-2.5 flex-row items-center justify-center ${runningCode
                          ? isDark ? 'bg-gray-800' : 'bg-gray-300'
                          : isDark ? 'bg-blue-600' : 'bg-blue-500'
                        }`}
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2
                      }}
                    >
                      {runningCode ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <CheckCircle size={16} color="white" />
                      )}
                      <Text className="text-white font-semibold ml-2 text-sm">
                        {runningCode ? 'Testing...' : 'Submit & Test'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Theory Answer */}
          {currentQuestion.question_type === 'theory' && (
            <TextInput
              value={currentAnswer?.answer || ''}
              onChangeText={handleTextAnswer}
              multiline
              placeholder="Write your answer here..."
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              className={`min-h-[200px] p-4 rounded-lg border ${isDark
                  ? 'border-gray-700 bg-gray-800 text-white'
                  : 'border-gray-200 bg-white text-gray-900'
                }`}
              style={{ textAlignVertical: 'top' }}
            />
          )}
        </ScrollView>

        {/* Navigation Bar */}
        <TestNavigationBar
          totalQuestions={questions.length}
          currentIndex={currentIndex}
          answeredQuestions={answeredQuestions}
          flaggedQuestions={flaggedQuestions}
          onNavigate={(index) => setCurrentIndex(index)}
          onPrevious={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          onNext={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
          onSubmit={handleSubmitTest}
          timeRemaining={timeRemaining}
        />

        {/* Violation Counter Badge (Fixed Position) */}
        {antiCheatEnabled && violationCount > 0 && (
          <View className="absolute bottom-24 right-4">
            <View className={`px-4 py-2 rounded-full ${isDark ? 'bg-red-900/90' : 'bg-red-100'} border-2 ${isDark ? 'border-red-700' : 'border-red-300'} flex-row items-center`}>
              <Shield size={18} color="#ef4444" />
              <Text className={`ml-2 font-semibold ${isDark ? 'text-red-200' : 'text-red-700'}`}>
                {violationCount} Violation{violationCount !== 1 ? 's' : ''} Detected
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Anti-Cheat Warning Modal */}
      <AntiCheatWarning
        visible={showAntiCheatWarning && !antiCheatAccepted}
        testTitle={testTitle}
        onAccept={() => {
          setAntiCheatAccepted(true);
          setShowAntiCheatWarning(false);
          setAntiCheatEnabled(true);
        }}
        onDecline={() => {
          router.back();
        }}
      />
    </View>
  );
}
