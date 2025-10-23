import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { testAPI, courseAPI } from '@/lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ClipboardList, Calendar, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimePicker } from '@/components/DateTimePicker';
import { useCustomAlert } from '@/components/ui/custom-alert';
import type { Course } from '@/lib/types';

export default function EditTestScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const params = useLocalSearchParams();
  const testId = params.id ? parseInt(params.id as string) : null;
  const { showAlert } = useCustomAlert();


  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    quiz_type: 'mcq' as 'mcq' | 'code' | 'mixed',
    test_type: 'instant' as 'instant' | 'booking' | 'timed',
    duration_minutes: 60,
    passing_score: 60,
    total_marks: 100,
    platform_restriction: 'any' as 'any' | 'mobile' | 'web',
    max_attempts: 1,
    detect_window_switch: true,
    prevent_screenshot: true,
    detect_phone_call: false,
    start_time: '',
    end_time: ''
  });
  
  // Date/Time picker states
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000)); // 1 hour later

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    if (!testId) {
      showAlert('Error', 'Test ID is required');
      router.back();
      return;
    }

    setInitialLoading(true);
    try {
      const testRes = await testAPI.getById(testId);
      const test = testRes.data.test;

      // Load course data
      if (test.course_id) {
        const courseRes = await courseAPI.getById(test.course_id);
        setCourse(courseRes.data.course);
      }

      // Populate form with existing data
      setTestData({
        title: test.title || '',
        description: test.description || '',
        quiz_type: test.quiz_type || 'mcq',
        test_type: test.test_type || 'instant',
        duration_minutes: test.duration_minutes || 60,
        passing_score: test.passing_score || 60,
        total_marks: test.total_marks || 100,
        platform_restriction: test.platform_restriction || 'any',
        max_attempts: test.max_attempts || 1,
        detect_window_switch: test.detect_window_switch !== false,
        prevent_screenshot: test.prevent_screenshot !== false,
        detect_phone_call: test.detect_phone_call === true,
        start_time: test.start_time || '',
        end_time: test.end_time || ''
      });

      // Set dates if they exist
      if (test.start_time) {
        setStartDate(new Date(test.start_time));
      }
      if (test.end_time) {
        setEndDate(new Date(test.end_time));
      }
    } catch (error) {
      console.error('Failed to load test:', error);
      showAlert('Error', 'Failed to load test data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleUpdateTest = async () => {
    if (!testId) {
      showAlert('Error', 'Test ID is required');
      return;
    }

    if (!testData.title.trim()) {
      showAlert('Error', 'Please enter test title');
      return;
    }

    if (testData.duration_minutes < 1) {
      showAlert('Error', 'Duration must be at least 1 minute');
      return;
    }

    setLoading(true);
    try {
      // Update the test
      await testAPI.update(testId, testData);

      showAlert(
        'Success', 
        'Test updated successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update test';
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'student') {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted-foreground">
          Only teachers and admins can edit tests
        </Text>
      </View>
    );
  }

  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-muted-foreground mt-4">Loading test data...</Text>
      </View>
    );
  }

  const quizTypes = [
    { value: 'mcq', label: 'MCQ Only', desc: 'Multiple choice questions' },
    { value: 'code', label: 'Code Only', desc: 'Programming questions' },
    { value: 'mixed', label: 'Mixed', desc: 'Both MCQ and code' }
  ];

  const testTypes = [
    { value: 'instant', label: 'Instant', desc: 'Take anytime', icon: Clock },
    { value: 'booking', label: 'Booking', desc: 'Requires slot booking', icon: Calendar },
    { value: 'timed', label: 'Timed', desc: 'Specific time window', icon: Clock }
  ];

  const platformOptions = [
    { value: 'any', label: 'Any Platform' },
    { value: 'mobile', label: 'Mobile Only' },
    { value: 'web', label: 'Web Only' }
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
            <ClipboardList size={40} color="#ffffff" />
          </View>
          <Text className="text-3xl font-bold">Edit Test</Text>
          {course && (
            <Text className="text-muted-foreground mt-1">
              For: {course.title} ({course.code})
            </Text>
          )}
        </View>

        {/* Basic Info */}
        <View className="bg-card rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold mb-4">Test Details</Text>

          <View className="gap-4">
            {/* Title */}
            <View>
              <Text className="text-sm font-semibold mb-2">Test Title *</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="e.g., Midterm Exam - Data Structures"
                value={testData.title}
                onChangeText={(text) => setTestData({...testData, title: text})}
              />
            </View>

            {/* Description */}
            <View>
              <Text className="text-sm font-semibold mb-2">Description</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Test description..."
                value={testData.description}
                onChangeText={(text) => setTestData({...testData, description: text})}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Quiz Type */}
        <View className="bg-card rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold mb-4">Question Type</Text>
          <View className="gap-2">
            {quizTypes.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => setTestData({...testData, quiz_type: type.value as any})}
                className={`p-4 rounded-xl border ${
                  testData.quiz_type === type.value
                    ? 'bg-primary border-primary'
                    : 'bg-background border-border'
                }`}
              >
                <Text className={`font-semibold ${testData.quiz_type === type.value ? 'text-white' : 'text-foreground'}`}>
                  {type.label}
                </Text>
                <Text className={`text-sm ${testData.quiz_type === type.value ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {type.desc}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Test Type */}
        <View className="bg-card rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold mb-4">Availability Type</Text>
          <View className="gap-2">
            {testTypes.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => setTestData({...testData, test_type: type.value as any})}
                className={`p-4 rounded-xl border flex-row items-center ${
                  testData.test_type === type.value
                    ? 'bg-primary border-primary'
                    : 'bg-background border-border'
                }`}
              >
                <type.icon 
                  size={24} 
                  color={testData.test_type === type.value ? '#ffffff' : '#666666'} 
                />
                <View className="ml-3 flex-1">
                  <Text className={`font-semibold ${testData.test_type === type.value ? 'text-white' : 'text-foreground'}`}>
                    {type.label}
                  </Text>
                  <Text className={`text-sm ${testData.test_type === type.value ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {type.desc}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Test Settings */}
        <View className="bg-card rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold mb-4">Test Settings</Text>

          <View className="gap-4">
            {/* Duration and Passing Score */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-sm font-semibold mb-2">Duration (min)</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-center"
                  placeholder="60"
                  value={testData.duration_minutes.toString()}
                  onChangeText={(text) => setTestData({...testData, duration_minutes: parseInt(text) || 60})}
                  keyboardType="number-pad"
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold mb-2">Passing Score (%)</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-center"
                  placeholder="60"
                  value={testData.passing_score.toString()}
                  onChangeText={(text) => setTestData({...testData, passing_score: parseInt(text) || 60})}
                  keyboardType="number-pad"
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold mb-2">Total Marks</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-center"
                  placeholder="100"
                  value={testData.total_marks.toString()}
                  onChangeText={(text) => setTestData({...testData, total_marks: parseInt(text) || 100})}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Platform Restriction */}
            <View>
              <Text className="text-sm font-semibold mb-2">Platform Restriction</Text>
              <View className="flex-row gap-2">
                {platformOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setTestData({...testData, platform_restriction: option.value as any})}
                    className={`flex-1 py-3 rounded-xl border ${
                      testData.platform_restriction === option.value
                        ? 'bg-primary border-primary'
                        : 'bg-background border-border'
                    }`}
                  >
                    <Text className={`text-center text-sm ${
                      testData.platform_restriction === option.value ? 'text-white font-semibold' : 'text-foreground'
                    }`}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Max Attempts */}
            <View>
              <Text className="text-sm font-semibold mb-2">Maximum Attempts</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-center"
                placeholder="1"
                value={testData.max_attempts.toString()}
                onChangeText={(text) => setTestData({...testData, max_attempts: parseInt(text) || 1})}
                keyboardType="number-pad"
              />
              <Text className="text-xs text-muted-foreground mt-1">Number of times a student can attempt this test</Text>
            </View>
          </View>
        </View>

        {/* Security & Monitoring */}
        <View className="bg-card rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold mb-4">Security & Monitoring</Text>

          <View className="gap-4">
            {/* Window Switch Detection */}
            <Pressable
              onPress={() => setTestData({...testData, detect_window_switch: !testData.detect_window_switch})}
              className="flex-row items-center justify-between py-3 px-4 bg-background rounded-xl border border-border"
            >
              <View className="flex-1 mr-3">
                <Text className="font-semibold text-foreground">Detect Window Switching</Text>
                <Text className="text-sm text-muted-foreground">Track when student switches to another window/app</Text>
              </View>
              <View className={`w-12 h-6 rounded-full p-1 ${testData.detect_window_switch ? 'bg-primary' : 'bg-border'}`}>
                <View className={`w-4 h-4 rounded-full bg-white transition-all ${testData.detect_window_switch ? 'ml-auto' : ''}`} />
              </View>
            </Pressable>

            {/* Screenshot Prevention */}
            <Pressable
              onPress={() => setTestData({...testData, prevent_screenshot: !testData.prevent_screenshot})}
              className="flex-row items-center justify-between py-3 px-4 bg-background rounded-xl border border-border"
            >
              <View className="flex-1 mr-3">
                <Text className="font-semibold text-foreground">Prevent Screenshots</Text>
                <Text className="text-sm text-muted-foreground">Block screenshot capture during test (mobile only)</Text>
              </View>
              <View className={`w-12 h-6 rounded-full p-1 ${testData.prevent_screenshot ? 'bg-primary' : 'bg-border'}`}>
                <View className={`w-4 h-4 rounded-full bg-white transition-all ${testData.prevent_screenshot ? 'ml-auto' : ''}`} />
              </View>
            </Pressable>

            {/* Phone Call Detection */}
            <Pressable
              onPress={() => setTestData({...testData, detect_phone_call: !testData.detect_phone_call})}
              className="flex-row items-center justify-between py-3 px-4 bg-background rounded-xl border border-border"
            >
              <View className="flex-1 mr-3">
                <Text className="font-semibold text-foreground">Detect Phone Calls</Text>
                <Text className="text-sm text-muted-foreground">Monitor incoming/outgoing calls during test (mobile only)</Text>
              </View>
              <View className={`w-12 h-6 rounded-full p-1 ${testData.detect_phone_call ? 'bg-primary' : 'bg-border'}`}>
                <View className={`w-4 h-4 rounded-full bg-white transition-all ${testData.detect_phone_call ? 'ml-auto' : ''}`} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Test Settings continued */}
        <View className="bg-card rounded-xl p-4 mb-4 border border-border">
          <View className="gap-4">
            {/* Time Window (for timed tests) */}
            {testData.test_type === 'timed' && (
              <>
                <DateTimePicker
                  label="Start Date & Time"
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    setTestData({
                      ...testData, 
                      start_time: date.toISOString()
                    });
                  }}
                  mode="datetime"
                  minimumDate={new Date()}
                />

                <DateTimePicker
                  label="End Date & Time"
                  value={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    setTestData({
                      ...testData, 
                      end_time: date.toISOString()
                    });
                  }}
                  mode="datetime"
                  minimumDate={startDate}
                />
              </>
            )}
          </View>
        </View>

        {/* Info Note */}
        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
          <Text className="text-blue-800 dark:text-blue-200 text-sm">
            💡 <Text className="font-semibold">Note:</Text> Changes to test settings will apply immediately. Questions and materials can be managed from the test details page.
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          onPress={handleUpdateTest}
          disabled={loading}
          className="mb-8"
        >
          <View className="flex-row items-center gap-2 justify-center">
            <ClipboardList size={20} color="#ffffff" />
            <Text className="text-white font-bold text-base">
              {loading ? 'Updating Test...' : 'Update Test'}
            </Text>
          </View>
        </Button>
      </ScrollView>
    </View>
  );
}
