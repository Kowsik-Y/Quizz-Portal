import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { courseAPI, departmentAPI } from '@/lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BookOpen, Save } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Department } from '@/lib/types';
import { useCustomAlert } from '@/components/ui/custom-alert';

export default function EditCourseScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseId = params.courseId ? parseInt(params.courseId as string) : null;
  const { showAlert } = useCustomAlert();

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    code: '',
    semester: '',
    academic_year: '',
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showDeptPicker, setShowDeptPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!courseId) {
      showAlert('Error', 'Course ID is required');
      router.back();
      return;
    }

    setInitialLoading(true);
    try {
      // Load departments and course data in parallel
      const [deptResponse, courseResponse] = await Promise.all([
        departmentAPI.getAll(),
        courseAPI.getById(courseId)
      ]);

      const depts = deptResponse.data.departments || [];
      setDepartments(depts);

      const course = courseResponse.data.course;
      setCourseData({
        title: course.title || '',
        description: course.description || '',
        code: course.code || '',
        semester: course.semester || '',
        academic_year: course.academic_year || '',
      });

      // Set selected department
      const dept = depts.find((d: Department) => d.id === course.department_id);
      setSelectedDept(dept || null);
    } catch (error) {
      console.error('Failed to load data:', error);
      showAlert('Error', 'Failed to load course data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!courseId) {
      showAlert('Error', 'Course ID is required');
      return;
    }

    if (!courseData.title.trim() || !courseData.code.trim()) {
      showAlert('Error', 'Please fill in course title and code');
      return;
    }

    setLoading(true);
    try {
      // Update course
      await courseAPI.update(courseId, {
        ...courseData,
        department_id: selectedDept?.id
      });

      showAlert('Success', 'Course updated successfully!', [
        { 
          text: 'OK', 
          onPress: () => router.back()
        }
      ]);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'student') {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted-foreground">
          Only teachers and admins can edit courses
        </Text>
      </View>
    );
  }

  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-muted-foreground mt-4">Loading course data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
            <BookOpen size={40} color="#ffffff" />
          </View>
          <Text className="text-3xl font-bold">Edit Course</Text>
          <Text className="text-muted-foreground mt-1">Update course details</Text>
        </View>

        {/* Course Details Section */}
        <View className="bg-card rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold mb-4">Course Details</Text>

          <View className="gap-4">
            {/* Title */}
            <View>
              <Text className="text-sm font-semibold mb-2">Course Title *</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="e.g., C Programming"
                value={courseData.title}
                onChangeText={(text) => setCourseData({...courseData, title: text})}
              />
            </View>

            {/* Code */}
            <View>
              <Text className="text-sm font-semibold mb-2">Course Code *</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="e.g., CSE101"
                value={courseData.code}
                onChangeText={(text) => setCourseData({...courseData, code: text})}
                autoCapitalize="characters"
              />
            </View>

            {/* Description */}
            <View>
              <Text className="text-sm font-semibold mb-2">Description</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Course description..."
                value={courseData.description}
                onChangeText={(text) => setCourseData({...courseData, description: text})}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Department */}
            <View>
              <Text className="text-sm font-semibold mb-2">Department</Text>
              <Pressable 
                onPress={() => setShowDeptPicker(!showDeptPicker)}
                className="bg-background border border-border rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Text className="text-foreground">
                  {selectedDept ? `${selectedDept.code} - ${selectedDept.name}` : 'Select department'}
                </Text>
              </Pressable>
              
              {showDeptPicker && (
                <View className="mt-2 border border-border rounded-xl overflow-hidden bg-background">
                  {departments.map((dept) => (
                    <Pressable
                      key={dept.id}
                      onPress={() => {
                        setSelectedDept(dept);
                        setShowDeptPicker(false);
                      }}
                      className={`p-4 border-b border-border ${
                        selectedDept?.id === dept.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <Text className="font-semibold text-foreground">{dept.code}</Text>
                      <Text className="text-sm text-muted-foreground">{dept.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Row: Semester, Year, Credits */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-sm font-semibold mb-2">Semester</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Fall"
                  value={courseData.semester}
                  onChangeText={(text) => setCourseData({...courseData, semester: text})}
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold mb-2">Year</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="2024-25"
                  value={courseData.academic_year}
                  onChangeText={(text) => setCourseData({...courseData, academic_year: text})}
                />
              </View>

            </View>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          onPress={handleUpdateCourse}
          disabled={loading}
          className="mb-8"
        >
          <View className="flex-row items-center gap-2">
            <Save size={20} color="#ffffff" />
            <Text className="text-white font-bold text-base">
              {loading ? 'Updating Course...' : 'Update Course'}
            </Text>
          </View>
        </Button>
      </ScrollView>
    </View>
  );
}
