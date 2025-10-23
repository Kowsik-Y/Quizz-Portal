import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { courseAPI, departmentAPI } from '@/lib/api';
import { useRouter } from 'expo-router';
import { BookOpen, Save } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Department } from '@/lib/types';
import { useCustomAlert } from '@/components/ui/custom-alert';
import api from '@/lib/api';
import HeaderTile from '@/components/ui/headerTile';

interface AcademicYear {
  id: number;
  year: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export default function EnhancedCreateCourseScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { showAlert } = useCustomAlert();

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    code: ''
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showDeptPicker, setShowDeptPicker] = useState(false);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
    loadAcademicYears();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      setDepartments(response.data.departments || []);
      // Don't auto-select first department - let user choose or select "All"
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadAcademicYears = async () => {
    try {
      const response = await api.get('/academic-years');
      const years = response.data.academicYears || [];
      setAcademicYears(years);
      // Select active year by default
      const activeYear = years.find((y: AcademicYear) => y.is_active);
      if (activeYear) {
        setSelectedYear(activeYear);
      } else if (years.length > 0) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error('Failed to load academic years:', error);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseData.title.trim() || !courseData.code.trim()) {
      showAlert('Error', 'Please fill in course title and code');
      return;
    }

    setLoading(true);
    try {
      // Create course
      const courseResponse = await courseAPI.create({
        ...courseData,
        department_id: selectedDept?.id,
        year_id: selectedYear?.id
      });

      const courseId = courseResponse.data.course.id;

      showAlert('Success', 'Course created successfully!', [
        { 
          text: 'OK', 
          onPress: () => router.replace({
            pathname: '/courses/course-details',
            params: { id: courseId }
          } as any)
        }
      ]);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'student') {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted-foreground">
          Only teachers and admins can create courses
        </Text>
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
          <Text className="text-3xl font-bold">Create New Course</Text>
          <Text className="text-muted-foreground mt-1">Set up your course details</Text>
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
                  {selectedDept ? `${selectedDept.code} - ${selectedDept.name}` : 'All Departments'}
                </Text>
              </Pressable>
              
              {showDeptPicker && (
                <View className="mt-2 border border-border rounded-xl overflow-hidden bg-background">
                  {departments.length === 0 ? (
                    <View className="p-4">
                      <Text className="text-muted-foreground text-center">No departments available</Text>
                    </View>
                  ) : (
                    <>
                      {/* All Departments Option */}
                      <Pressable
                        onPress={() => {
                          setSelectedDept(null);
                          setShowDeptPicker(false);
                        }}
                        className={`p-4 border-b border-border ${
                          selectedDept === null ? 'bg-primary/10' : ''
                        }`}
                      >
                        <Text className="font-semibold text-foreground">ALL</Text>
                        <Text className="text-sm text-muted-foreground">All Departments</Text>
                      </Pressable>

                      {/* Individual Departments */}
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
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Academic Year */}
            <View>
              <Text className="text-sm font-semibold mb-2">Academic Year</Text>
              <Pressable 
                onPress={() => setShowYearPicker(!showYearPicker)}
                className="bg-background border border-border rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Text className="text-foreground">
                  {selectedYear ? selectedYear.year : 'Select academic year'}
                </Text>
              </Pressable>
              
              {showYearPicker && (
                <View className="mt-2 border border-border rounded-xl overflow-hidden bg-background">
                  {academicYears.length === 0 ? (
                    <View className="p-4">
                      <Text className="text-muted-foreground text-center">No academic years available</Text>
                    </View>
                  ) : (
                    academicYears.map((year) => (
                      <Pressable
                        key={year.id}
                        onPress={() => {
                          setSelectedYear(year);
                          setShowYearPicker(false);
                        }}
                        className={`p-4 border-b border-border ${
                          selectedYear?.id === year.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <View>
                            <Text className="font-semibold text-foreground">{year.year}</Text>
                            {year.start_date && year.end_date && (
                              <Text className="text-xs text-muted-foreground">
                                {year.start_date} to {year.end_date}
                              </Text>
                            )}
                          </View>
                          {year.is_active && (
                            <View className="bg-green-100 px-2 py-1 rounded">
                              <Text className="text-xs font-bold text-green-700">ACTIVE</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    ))
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          onPress={handleCreateCourse}
          disabled={loading}
          className="mb-8"
        >
          <View className="flex-row items-center gap-2">
            <Save size={20} color="#ffffff" />
            <Text className="text-white font-bold text-base">
              {loading ? 'Creating Course...' : 'Create Course'}
            </Text>
          </View>
        </Button>
      </ScrollView>
    </View>
  );
}

