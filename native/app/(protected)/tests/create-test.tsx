import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { testAPI, courseAPI } from '@/lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ClipboardList, Calendar, Clock } from 'lucide-react-native';
import { DateTimePicker } from '@/components/DateTimePicker';
import { useCustomAlert } from '@/components/ui/custom-alert';
import type { Course } from '@/lib/types';
import SelectOption from '@/components/ui/select';
import ToggleSwitch from '@/components/ui/switch';

// ===== REUSABLE COMPONENTS =====

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => (
  <View className="bg-card rounded-xl p-4 mb-4 border border-border">
    <Text className="text-lg font-bold mb-4">{title}</Text>
    {children}
  </View>
);

interface FormInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'number-pad';
  helpText?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  helpText
}) => (
  <View>
    <Text className="text-sm font-semibold mb-2">{label}</Text>
    <TextInput
      className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={multiline ? numberOfLines : undefined}
      textAlignVertical={multiline ? "top" : "auto"}
      keyboardType={keyboardType}
    />
    {helpText && (
      <Text className="text-xs text-muted-foreground mt-1">{helpText}</Text>
    )}
  </View>
);

interface NumberInputProps {
  label: string;
  placeholder: string;
  value: number;
  onChangeValue: (value: number) => void;
  helpText?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  placeholder,
  value,
  onChangeValue,
  helpText
}) => (
  <View className="flex-1">
    <Text className="text-sm font-semibold mb-2">{label}</Text>
    <TextInput
      className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-center"
      placeholder={placeholder}
      value={value.toString()}
      onChangeText={(text) => onChangeValue(parseInt(text) || 0)}
      keyboardType="number-pad"
    />
    {helpText && (
      <Text className="text-xs text-muted-foreground mt-1">{helpText}</Text>
    )}
  </View>
);



interface ButtonGroupOption {
  value: string;
  label: string;
}

interface ButtonGroupProps {
  options: ButtonGroupOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  options,
  selectedValue,
  onSelect
}) => (
  <View className="flex-row gap-2">
    {options.map((option) => (
      <Pressable
        key={option.value}
        onPress={() => onSelect(option.value)}
        className={`flex-1 py-3 rounded-xl border ${selectedValue === option.value
          ? 'bg-primary border-primary'
          : 'bg-background border-border'
          }`}
      >
        <Text className={`text-center text-sm ${selectedValue === option.value ? 'text-white font-semibold' : 'text-foreground'
          }`}>
          {option.label}
        </Text>
      </Pressable>
    ))}
  </View>
);

// ===== MAIN COMPONENT =====

export default function CreateTestScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseId = params.courseId ? parseInt(params.courseId as string) : null;
  const { showAlert } = useCustomAlert();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);

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
    end_time: '',
    questions_to_ask: null as number | null, // Number of questions to randomly select
    show_review_to_students: false // Whether students can see review/answers
  });

  // Date/Time picker states
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000)); // 1 hour later
  const loadCourseData = useCallback(async () => {
    if (!courseId) return;
    try {
      const courseRes = await courseAPI.getById(courseId);
      setCourse(courseRes.data.course);
    } catch {
      showAlert('Error', 'Failed to load course data');
    }
  }, [courseId, showAlert]);
  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, loadCourseData]);



  const handleCreateTest = async () => {
    if (!courseId) {
      showAlert('Error', 'Course ID is required');
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
      // Create the test
      const testResponse = await testAPI.create({
        course_id: courseId!,
        ...testData
      });

      const testId = testResponse.data.test.id;

      showAlert(
        'Success',
        'Test created successfully! You can now add materials and questions.',
        [
          {
            text: 'Add Materials & Questions',
            onPress: () => router.push(`/tests/test-details?id=${testId}`)
          },
          {
            text: 'Back to Course',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create test';
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'student') {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted-foreground">
          Only teachers and admins can create tests
        </Text>
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
          <Text className="text-3xl font-bold">Create New Test</Text>
          {course && (
            <Text className="text-muted-foreground mt-1">
              For: {course.title} ({course.code})
            </Text>
          )}
        </View>

        {/* Basic Info */}
        <SectionCard title="Test Details">
          <View className="gap-4">
            <FormInput
              label="Test Title *"
              placeholder="e.g., Midterm Exam - Data Structures"
              value={testData.title}
              onChangeText={(text) => setTestData({ ...testData, title: text })}
            />

            <FormInput
              label="Description"
              placeholder="Test description..."
              value={testData.description}
              onChangeText={(text) => setTestData({ ...testData, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>
        </SectionCard>

        {/* Quiz Type */}
        <SectionCard title="Question Type">
          <View className="gap-2">
            {quizTypes.map((type) => (
              <SelectOption
                key={type.value}
                value={type.value}
                label={type.label}
                description={type.desc}
                selected={testData.quiz_type === type.value}
                onPress={() => setTestData({ ...testData, quiz_type: type.value as any })}
              />
            ))}
          </View>
        </SectionCard>

        {/* Test Type */}
        <SectionCard title="Availability Type">
          <View className="gap-2">
            {testTypes.map((type) => (
              <SelectOption
                key={type.value}
                value={type.value}
                label={type.label}
                description={type.desc}
                icon={type.icon}
                selected={testData.test_type === type.value}
                onPress={() => setTestData({ ...testData, test_type: type.value as any })}
              />
            ))}
          </View>
        </SectionCard>

        {/* Test Settings */}
        <SectionCard title="Test Settings">
          <View className="gap-4">
            {/* Duration and Passing Score */}
            <View className="flex-row gap-2">
              <NumberInput
                label="Duration (min)"
                placeholder="60"
                value={testData.duration_minutes}
                onChangeValue={(value) => setTestData({ ...testData, duration_minutes: value || 60 })}
              />

              <NumberInput
                label="Passing Score (%)"
                placeholder="60"
                value={testData.passing_score}
                onChangeValue={(value) => setTestData({ ...testData, passing_score: value || 60 })}
              />

              <NumberInput
                label="Total Marks"
                placeholder="100"
                value={testData.total_marks}
                onChangeValue={(value) => setTestData({ ...testData, total_marks: value || 100 })}
              />
            </View>

            {/* Platform Restriction */}
            <View>
              <Text className="text-sm font-semibold mb-2">Platform Restriction</Text>
              <ButtonGroup
                options={platformOptions}
                selectedValue={testData.platform_restriction}
                onSelect={(value) => setTestData({ ...testData, platform_restriction: value as any })}
              />
            </View>

            <FormInput
              label="Maximum Attempts"
              placeholder="1"
              value={testData.max_attempts.toString()}
              onChangeText={(text) => setTestData({ ...testData, max_attempts: parseInt(text) || 1 })}
              keyboardType="number-pad"
              helpText="Number of times a student can attempt this test"
            />

            <FormInput
              label="Questions to Ask (Optional)"
              placeholder="Leave empty for all questions"
              value={testData.questions_to_ask?.toString() || ''}
              onChangeText={(text) => {
                const value = text.trim();
                setTestData({
                  ...testData,
                  questions_to_ask: value === '' ? null : parseInt(value) || null
                });
              }}
              keyboardType="number-pad"
              helpText="Number of questions to randomly select from the question pool. Leave empty to use all questions."
            />

            <ToggleSwitch
              label="Show Review to Students"
              description="Allow students to view answers and explanations after completing the test"
              value={testData.show_review_to_students}
              onToggle={() => setTestData({ ...testData, show_review_to_students: !testData.show_review_to_students })}
            />
          </View>
        </SectionCard>

        {/* Security & Monitoring */}
        <SectionCard title="Security & Monitoring">
          <View className="gap-4">
            <ToggleSwitch
              label="Detect Window Switching"
              description="Track when student switches to another window/app"
              value={testData.detect_window_switch}
              onToggle={() => setTestData({ ...testData, detect_window_switch: !testData.detect_window_switch })}
            />

            <ToggleSwitch
              label="Prevent Screenshots"
              description="Block screenshot capture during test (mobile only)"
              value={testData.prevent_screenshot}
              onToggle={() => setTestData({ ...testData, prevent_screenshot: !testData.prevent_screenshot })}
            />

            <ToggleSwitch
              label="Detect Phone Calls"
              description="Monitor incoming/outgoing calls during test (mobile only)"
              value={testData.detect_phone_call}
              onToggle={() => setTestData({ ...testData, detect_phone_call: !testData.detect_phone_call })}
            />
          </View>
        </SectionCard>

        {/* Time Window (for timed tests) */}
        {testData.test_type === 'timed' && (
          <SectionCard title="Time Window">
            <View className="gap-4">
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
            </View>
          </SectionCard>
        )}

        {/* Info Note */}
        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
          <Text className="text-blue-800 dark:text-blue-200 text-sm">
            💡 <Text className="font-semibold">Note:</Text> After creating the test, you&apos;ll be able to add materials and questions from the test details page.
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          onPress={handleCreateTest}
          disabled={loading}
          className="mb-8"
        >
          <View className="flex-row items-center gap-2 justify-center">
            <ClipboardList size={20} color="#ffffff" />
            <Text className="text-white font-bold text-base">
              {loading ? 'Creating Test...' : 'Create Test'}
            </Text>
          </View>
        </Button>
      </ScrollView>
    </View>
  );
}
