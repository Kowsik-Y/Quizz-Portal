import { View, ScrollView, Pressable, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  BookOpen, Calendar, Clock, Download, Video, FileText,
  Users, ChevronLeft, ExternalLink, Plus, PlayCircle,
  FileCode, File, PlusCircle, Edit, List, Trash2, Activity,
  AlertTriangle, Shield, ChevronRight
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useTestStore } from '@/stores/testStore';
import { testAPI, materialAPI, attemptAPI } from '@/lib/api';
import type { CourseMaterial, Test } from '@/lib/types';
import { Picker } from '@react-native-picker/picker';
import { EditTestTitleModal } from '@/components/EditTestTitleModal';
import { useCustomAlert } from '@/components/ui/custom-alert';
import LiveAttempts from '@/components/LiveAttempts';
import StudentReports from '@/components/StudentReports';

export default function TestDetailsPage() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM - 11:00 AM');
  const isWeb = Platform.OS === 'web';
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const { fetchTestById } = useTestStore();
  const { showAlert } = useCustomAlert();

  // State for dynamic data
  const [test, setTest] = useState<Test | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditTitleModal, setShowEditTitleModal] = useState(false);
  const [updatingTitle, setUpdatingTitle] = useState(false);
  const [deletingTest, setDeletingTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'materials' | 'attempts' | 'reports'>('materials');
  const [studentAttempts, setStudentAttempts] = useState<any[]>([]);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth > 1024;
  const isMediumScreen = screenWidth > 768;


  // Check if user is teacher or admin
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  // Fetch test details and materials
  const loadTestData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (id) {
        // Fetch test details
        const testResponse = await testAPI.getById(Number(id));
        setTest(testResponse.data.test);

        // Debug: Check test_type value
        console.log('📊 Test Type:', testResponse.data.test?.test_type);
        console.log('📊 Test Type (lowercase):', testResponse.data.test?.test_type?.toLowerCase());

        // Fetch materials for this test (don't fail the whole load if this fails)
        try {
          const materialsResponse = await materialAPI.getByTest(Number(id));
          setMaterials(materialsResponse.data.materials || []);
        } catch (materialsError) {
          console.log('Could not load materials:', materialsError);
          setMaterials([]); // Set empty array so UI can still render
        }

        // If student, check their attempts
        if (!isTeacherOrAdmin && user?.id) {
          try {
            const attemptsResponse = await attemptAPI.getStudentAttempts(user.id, Number(id));
            const attempts = attemptsResponse.data.attempts || [];
            setStudentAttempts(attempts);

            // Check if max attempts reached
            const testData = testResponse.data.test;
            if (testData.max_attempts && testData.max_attempts > 0) {
              const completedAttempts = attempts.filter((a: any) => a.status === 'submitted').length;
              setMaxAttemptsReached(completedAttempts >= testData.max_attempts);
            }
          } catch (err) {
            console.log('Could not load student attempts:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error loading test data:', err);
      setError('Failed to load test data');
      showAlert('Error', 'Failed to load test details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestData();
  }, [id]);

  // Handle title update
  const handleUpdateTitle = async (newTitle: string) => {
    try {
      setUpdatingTitle(true);
      await testAPI.update(Number(id), { title: newTitle });
      showAlert('Success', 'Test title updated successfully!');
      setShowEditTitleModal(false);
      loadTestData(); // Reload test data
    } catch (error: any) {
      console.error('Error updating test title:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update test title';
      showAlert('Error', errorMessage);
    } finally {
      setUpdatingTitle(false);
    }
  };

  // Handle test deletion
  const handleDeleteTest = () => {
    showAlert(
      'Delete Test',
      'Are you sure you want to delete this test? This will also delete all associated questions, materials, and student attempts. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingTest(true);
              await testAPI.delete(Number(id));
              showAlert(
                'Success',
                'Test deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error: any) {
              console.error('Error deleting test:', error);
              const errorMessage = error.response?.data?.error || 'Failed to delete test';
              showAlert('Error', errorMessage);
            } finally {
              setDeletingTest(false);
            }
          }
        }
      ]
    );
  };

  // Helper function to get relative time
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const MaterialCard = ({ material }: { material: CourseMaterial }) => {
    const getIcon = () => {
      const type = material.material_type || 'document';
      switch (type.toLowerCase()) {
        case 'video':
        case 'mp4':
        case 'avi':
        case 'mov':
          return <Video size={20} color="#3b82f6" />;
        case 'pdf':
          return <FileText size={20} color="#ef4444" />;
        case 'code':
        case 'programming':
          return <FileCode size={20} color="#8b5cf6" />;
        default:
          return <File size={20} color="#8b5cf6" />;
      }
    };

    const getTypeColor = () => {
      const type = material.material_type || 'document';
      switch (type.toLowerCase()) {
        case 'video':
          return 'text-blue-500';
        case 'pdf':
          return 'text-red-500';
        case 'code':
          return 'text-purple-500';
        default:
          return 'text-gray-500';
      }
    };

    const handleOpenMaterial = () => {
      if (material.file_url) {
        showAlert('Open Material', `Opening: ${material.title}`);
      }
    };

    const handleDownload = () => {
      if (material.file_url) {
        showAlert('Download', `Downloading: ${material.title}`);
      } else {
        showAlert('Not Available', 'This material cannot be downloaded');
      }
    };

    return (
      <View
        className={`rounded-xl p-5 mb-4 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        style={{
          width: isWeb ? (isLargeScreen ? '32%' : isMediumScreen ? '48.5%' : '100%') : '100%',
        }}
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              {getIcon()}
              <Text className={`ml-2 text-xs font-semibold ${getTypeColor()}`}>
                {(material.material_type || 'document').toUpperCase()}
              </Text>
            </View>
            <Text
              className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
              numberOfLines={2}
            >
              {material.title}
            </Text>
            {material.description && (
              <Text
                className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                numberOfLines={2}
              >
                {material.description}
              </Text>
            )}
          </View>
        </View>

        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center">
            <Clock size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`ml-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {getRelativeTime(material.created_at || new Date().toISOString())}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2 mt-3">
          <Pressable
            onPress={handleOpenMaterial}
            className="flex-1 bg-blue-500 rounded-lg py-3 px-4 min-h-[44px] items-center justify-center"
            style={{ minWidth: 80 }}
          >
            <View className="flex-row items-center justify-center gap-2">
              {material.material_type?.toLowerCase().includes('video') ? (
                <PlayCircle size={18} color="white" />
              ) : (
                <ExternalLink size={18} color="white" />
              )}
              <Text className="text-white font-semibold text-sm">
                {material.material_type?.toLowerCase().includes('video') ? 'Watch' : 'View'}
              </Text>
            </View>
          </Pressable>
          {material.file_url && (
            <Pressable
              onPress={handleDownload}
              className={`flex-1 rounded-lg py-3 px-4 min-h-[44px] items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              style={{ minWidth: 80 }}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Download size={18} color={isDark ? '#d1d5db' : '#374151'} />
                <Text
                  className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                >
                  Download
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className={`${isWeb ? 'px-8 pt-8' : 'px-4 pt-6'} pb-4`}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {test?.title || 'Test Details'}
            </Text>
            <Text className={`mt-1 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {test?.description || 'Materials and booking for this test'}
            </Text>
          </View>

          {/* Edit Title & View Questions Buttons - Teachers/Admins only */}
          {isTeacherOrAdmin && !loading && (
            <View className="flex-row gap-2 ml-4">
              <Pressable
                onPress={() => setShowEditTitleModal(true)}
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}
              >
                <Edit size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
              </Pressable>

              <Pressable
                onPress={() => router.push({
                  pathname: '/tests/questions/view-questions',
                  params: { testId: id, testName: test?.title }
                } as any)}
                className={`p-3 rounded-lg flex-row items-center gap-2 ${isDark ? 'bg-purple-900/30 border border-purple-700' : 'bg-purple-50 border border-purple-200'
                  }`}
              >
                <List size={20} color={isDark ? '#c084fc' : '#9333ea'} />
                <Text className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                  View Questions
                </Text>
              </Pressable>

              {/* Delete Button - Admin only */}
              {isAdmin && (
                <Pressable
                  onPress={handleDeleteTest}
                  disabled={deletingTest}
                  className={`p-3 rounded-lg ${deletingTest
                      ? isDark ? 'bg-gray-700' : 'bg-gray-300'
                      : isDark ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
                    }`}
                >
                  {deletingTest ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Trash2 size={20} color="#ef4444" />
                  )}
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Loading State */}
      {loading && (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className={`mt-4 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading test details...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View className="flex-1 items-center justify-center px-6 py-20">
          <View className={`rounded-xl p-6 ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              Failed to load test
            </Text>
            <Text className={`text-base mb-4 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
              {error}
            </Text>
            <Pressable
              onPress={() => {
                setError(null);
                loadTestData();
              }}
              className="bg-blue-500 rounded-lg py-3 px-6"
            >
              <Text className="text-white font-semibold text-center">
                Try Again
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Content - Only show when not loading and no error */}
      {!loading && !error && (
        <>
          {/* Test Info Card */}
          <View className={isWeb ? 'px-8 mb-4' : 'px-4 mb-4'}>
            <View
              className={`rounded-xl p-5 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}
            >
              <View className="flex-row flex-wrap gap-2 mb-4">
                <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Text className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    {test?.quiz_type?.toUpperCase() || 'MIXED'}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                  <Text className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                    {test?.test_type ? (test.test_type.charAt(0).toUpperCase() + test.test_type.slice(1)) : 'Instant'}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <Text className={`text-xs ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    {test?.duration_minutes} min
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                  <Text className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    {test?.total_marks} marks
                  </Text>
                </View>
              </View>

              {/* Action Buttons for Teachers/Admins */}
              {isTeacherOrAdmin && (
                <View className="gap-2">
                  <Pressable
                    onPress={() => router.push({
                      pathname: '/courses/materials/add-material-to-test',
                      params: { testId: id, testName: test?.title }
                    } as any)}
                    className={`flex-row items-center justify-center py-3 rounded-lg ${isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                      }`}
                  >
                    <Plus size={18} color={isDark ? '#60a5fa' : '#3b82f6'} />
                    <Text className={`ml-2 font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      Add Materials to Test
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push({
                      pathname: '/tests/questions/add-questions',
                      params: { testId: id, testName: test?.title }
                    } as any)}
                    className={`flex-row items-center justify-center py-3 rounded-lg ${isDark ? 'bg-purple-900/30 border border-purple-700' : 'bg-purple-50 border border-purple-200'
                      }`}
                  >
                    <Edit size={18} color={isDark ? '#c084fc' : '#9333ea'} />
                    <Text className={`ml-2 font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                      Add Questions
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Take Test Button for Students */}
              {!isTeacherOrAdmin && (
                <>
                  {/* Show attempts if max reached, otherwise show Take Test button */}
                  {maxAttemptsReached ? (
                    <View className="gap-3">
                      {/* Max Attempts Banner */}
                      <View className={`rounded-lg p-4 ${isDark ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
                        <View className="flex-row items-center justify-center mb-2">
                          <AlertTriangle size={20} color={isDark ? '#fbbf24' : '#f59e0b'} />
                          <Text className={`ml-2 font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                            Maximum Attempts Reached ({test?.max_attempts}/{test?.max_attempts})
                          </Text>
                        </View>
                        <Text className={`text-center text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
                          View your attempt history below
                        </Text>
                      </View>

                      {/* Completed Attempts List */}
                      {studentAttempts.filter(a => a.status === 'submitted').map((attempt, index) => {
                        const percentage = Math.round((attempt.score / attempt.total_points) * 100);
                        const passed = percentage >= (test?.passing_score || 60);

                        return (
                          <Pressable
                            key={attempt.id}
                            onPress={() => router.push(`/tests/review?attemptId=${attempt.id}` as any)}
                            className={`rounded-lg p-4 border ${passed
                                ? isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                                : isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                              }`}
                          >
                            <View className="flex-row items-center justify-between mb-2">
                              <View className="flex-row items-center gap-2">
                                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  Attempt #{attempt.attempt_number}
                                </Text>
                                {passed ? (
                                  <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-green-900/50' : 'bg-green-100'}`}>
                                    <Text className={`text-xs font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                                      ✓ PASSED
                                    </Text>
                                  </View>
                                ) : (
                                  <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-red-900/50' : 'bg-red-100'}`}>
                                    <Text className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                                      ✗ FAILED
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text className={`text-2xl font-bold ${passed
                                  ? isDark ? 'text-green-400' : 'text-green-600'
                                  : isDark ? 'text-red-400' : 'text-red-600'
                                }`}>
                                {percentage}%
                              </Text>
                            </View>

                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center gap-4">
                                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Score: {attempt.score}/{attempt.total_points}
                                </Text>
                                {attempt.violation_count > 0 && (
                                  <View className="flex-row items-center gap-1">
                                    <Shield size={14} color={isDark ? '#ef4444' : '#dc2626'} />
                                    <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                      {attempt.violation_count} violations
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <ChevronRight size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                            </View>

                            <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {new Date(attempt.submitted_at).toLocaleString()}
                            </Text>
                          </Pressable>
                        );
                      })}

                      {/* View All Reports Button */}
                      <Pressable
                        onPress={() => setActiveTab('reports')}
                        className={`rounded-lg py-3 border ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
                          }`}
                      >
                        <Text className={`text-center font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          View Detailed Reports →
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      {/* Instant Test - Always Available (default if no test_type specified) */}
                      {(() => {
                        const testType = test?.test_type?.toLowerCase();
                        console.log('🎯 Checking Instant Test:', {
                          original: test?.test_type,
                          lowercase: testType,
                          willShow: (!testType || testType === 'instant')
                        });
                        return (!testType || testType === 'instant') && (
                          <Pressable
                            onPress={() => router.push(`/tests/take-test?id=${id}`)}
                            className="bg-green-500 rounded-lg py-4 flex-row items-center justify-center"
                          >
                            <PlayCircle size={20} color="white" />
                            <Text className="text-white font-bold text-center ml-2 text-lg">
                              Take Test
                            </Text>
                          </Pressable>
                        );
                      })()}

                      {/* Timed Test - Check if within time window */}
                      {(() => {
                        const testType = test?.test_type?.toLowerCase();
                        console.log('⏰ Checking Timed Test:', {
                          original: test?.test_type,
                          lowercase: testType,
                          willShow: testType === 'timed'
                        });
                        if (testType !== 'timed') return null;

                        return (
                          <>
                            {(() => {
                              const now = new Date();
                              const startTime = test?.start_time ? new Date(test.start_time) : null;
                              const endTime = test?.end_time ? new Date(test.end_time) : null;

                              const isBeforeStart = startTime && now < startTime;
                              const isAfterEnd = endTime && now > endTime;
                              const isWithinWindow = startTime && endTime && now >= startTime && now <= endTime;

                              if (isBeforeStart) {
                                return (
                                  <View className={`rounded-lg py-4 px-4 ${isDark ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
                                    <View className="flex-row items-center justify-center mb-2">
                                      <Clock size={20} color={isDark ? '#fbbf24' : '#f59e0b'} />
                                      <Text className={`ml-2 font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                                        Test Not Yet Available
                                      </Text>
                                    </View>
                                    <Text className={`text-center text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
                                      Available from: {startTime?.toLocaleString()}
                                    </Text>
                                  </View>
                                );
                              }

                              if (isAfterEnd) {
                                return (
                                  <View className={`rounded-lg py-4 px-4 ${isDark ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                                    <View className="flex-row items-center justify-center mb-2">
                                      <Clock size={20} color="#ef4444" />
                                      <Text className="ml-2 font-bold text-red-500">
                                        Test Window Closed
                                      </Text>
                                    </View>
                                    <Text className={`text-center text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                                      Ended: {endTime?.toLocaleString()}
                                    </Text>
                                  </View>
                                );
                              }

                              if (isWithinWindow) {
                                return (
                                  <Pressable
                                    onPress={() => router.push(`/tests/take-test?id=${id}`)}
                                    className="bg-green-500 rounded-lg py-4 flex-row items-center justify-center"
                                  >
                                    <PlayCircle size={20} color="white" />
                                    <Text className="text-white font-bold text-center ml-2 text-lg">
                                      Take Test Now
                                    </Text>
                                  </Pressable>
                                );
                              }

                              // Fallback - no timing info
                              return (
                                <View className={`rounded-lg py-4 px-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Test timing information not available
                                  </Text>
                                </View>
                              );
                            })()}
                          </>
                        );
                      })()}

                      {/* Booking Test - Show Book Slot Option */}
                      {(() => {
                        const testType = test?.test_type?.toLowerCase();
                        console.log('📅 Checking Booking Test:', {
                          original: test?.test_type,
                          lowercase: testType,
                          willShow: testType === 'booking'
                        });
                        if (testType !== 'booking') return null;

                        return (
                          <View className="gap-3">
                            {/* Book Slot Section */}
                            <View className={`rounded-lg p-4 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                              <Text className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Select Time Slot
                              </Text>
                              <View className={`rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`}>
                                <Picker
                                  selectedValue={selectedSlot}
                                  onValueChange={(value) => setSelectedSlot(value)}
                                  style={{
                                    color: isDark ? '#fff' : '#000',
                                    backgroundColor: 'transparent'
                                  }}
                                >
                                  <Picker.Item label="10:00 AM - 11:00 AM" value="10:00 AM - 11:00 AM" />
                                  <Picker.Item label="11:00 AM - 12:00 PM" value="11:00 AM - 12:00 PM" />
                                  <Picker.Item label="02:00 PM - 03:00 PM" value="02:00 PM - 03:00 PM" />
                                  <Picker.Item label="03:00 PM - 04:00 PM" value="03:00 PM - 04:00 PM" />
                                </Picker>
                              </View>
                            </View>

                            {/* Book Slot Button */}
                            <Pressable
                              onPress={() => {
                                showAlert('Success', `Slot booked: ${selectedSlot}`);
                              }}
                              className="bg-blue-500 rounded-lg py-4 flex-row items-center justify-center"
                            >
                              <Calendar size={20} color="white" />
                              <Text className="text-white font-bold text-center ml-2 text-lg">
                                Book Slot
                              </Text>
                            </Pressable>

                            {/* Take Test Button (if slot is booked) */}
                            <Pressable
                              onPress={() => router.push(`/tests/take-test?id=${id}`)}
                              className="bg-green-500 rounded-lg py-4 flex-row items-center justify-center"
                            >
                              <PlayCircle size={20} color="white" />
                              <Text className="text-white font-bold text-center ml-2 text-lg">
                                Take Test
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })()}
                    </>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Tabs (Materials / Attempters) - Only show Attempters tab for teachers/admins */}
          {isTeacherOrAdmin ? (
            <>
              <View className={`flex-row border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} ${isWeb ? 'px-8' : 'px-4'}`}>
                <Pressable
                  onPress={() => setActiveTab('materials')}
                  className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${activeTab === 'materials'
                      ? isDark ? 'border-blue-500' : 'border-blue-600'
                      : 'border-transparent'
                    }`}
                >
                  <FileText size={20} color={activeTab === 'materials' ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#6b7280' : '#9ca3af')} />
                  <Text className={`font-semibold ${activeTab === 'materials'
                      ? isDark ? 'text-blue-400' : 'text-blue-600'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Materials
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab('attempts')}
                  className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${activeTab === 'attempts'
                      ? isDark ? 'border-green-500' : 'border-green-600'
                      : 'border-transparent'
                    }`}
                >
                  <Activity size={20} color={activeTab === 'attempts' ? (isDark ? '#86efac' : '#16a34a') : (isDark ? '#6b7280' : '#9ca3af')} />
                  <Text className={`font-semibold ${activeTab === 'attempts'
                      ? isDark ? 'text-green-400' : 'text-green-600'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Attempters
                  </Text>
                </Pressable>
              </View>

              {/* Tab Content */}
              {activeTab === 'materials' ? (
                <ScrollView className={`flex-1 ${isWeb ? 'px-8' : 'px-4'}`}>
                  {/* Materials Section */}
                  <View className="mb-6 mt-4">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Test Materials
                      </Text>
                      <Pressable
                        onPress={() => router.push({
                          pathname: '/courses/materials/add-material-to-test',
                          params: { testId: id, testName: test?.title }
                        } as any)}
                        className="flex-row items-center"
                      >
                        <PlusCircle size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                        <Text className={`ml-2 font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          Add
                        </Text>
                      </Pressable>
                    </View>
                    <View
                      className="flex-row flex-wrap"
                      style={{
                        gap: 12,
                        justifyContent: isWeb ? 'flex-start' : 'center'
                      }}
                    >
                      {materials.length > 0 ? (
                        materials.map(material => (
                          <MaterialCard key={material.id} material={material} />
                        ))
                      ) : (
                        <View className="w-full items-center py-12">
                          <FileText size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                          <Text className={`mt-4 text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            No materials available yet
                          </Text>
                          <Text className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Add materials to help students prepare
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="h-4" />
                </ScrollView>
              ) : (
                <LiveAttempts testId={Number(id)} autoRefresh={true} refreshInterval={10} />
              )}
            </>
          ) : (
            // Students view: Materials and Reports tabs
            <>
              <View className={`flex-row border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} ${isWeb ? 'px-8' : 'px-4'}`}>
                <Pressable
                  onPress={() => setActiveTab('materials')}
                  className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${activeTab === 'materials'
                      ? isDark ? 'border-blue-500' : 'border-blue-600'
                      : 'border-transparent'
                    }`}
                >
                  <FileText size={20} color={activeTab === 'materials' ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#6b7280' : '#9ca3af')} />
                  <Text className={`font-semibold ${activeTab === 'materials'
                      ? isDark ? 'text-blue-400' : 'text-blue-600'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Materials
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab('reports')}
                  className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${activeTab === 'reports'
                      ? isDark ? 'border-purple-500' : 'border-purple-600'
                      : 'border-transparent'
                    }`}
                >
                  <Activity size={20} color={activeTab === 'reports' ? (isDark ? '#c4b5fd' : '#7c3aed') : (isDark ? '#6b7280' : '#9ca3af')} />
                  <Text className={`font-semibold ${activeTab === 'reports'
                      ? isDark ? 'text-purple-400' : 'text-purple-600'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    My Reports
                  </Text>
                </Pressable>
              </View>

              {activeTab === 'materials' ? (
                <ScrollView className={`flex-1 ${isWeb ? 'px-8' : 'px-4'}`}>
                  {/* Materials Section */}
                  <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Test Materials
                      </Text>
                    </View>
                    <View
                      className="flex-row flex-wrap"
                      style={{
                        gap: 12,
                        justifyContent: isWeb ? 'flex-start' : 'center'
                      }}
                    >
                      {materials.length > 0 ? (
                        materials.map(material => (
                          <MaterialCard key={material.id} material={material} />
                        ))
                      ) : (
                        <View className="w-full items-center py-12">
                          <FileText size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                          <Text className={`mt-4 text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            No materials available yet
                          </Text>
                          <Text className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Check back later for test materials
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="h-4" />
                </ScrollView>
              ) : (
                <StudentReports testId={Number(id)} studentId={user?.id!} />
              )}
            </>
          )}
        </>
      )}

      {/* Edit Title Modal */}
      {test && (
        <EditTestTitleModal
          visible={showEditTitleModal}
          currentTitle={test.title}
          onClose={() => setShowEditTitleModal(false)}
          onSave={handleUpdateTitle}
          loading={updatingTitle}
        />
      )}
    </View>
  );
}

