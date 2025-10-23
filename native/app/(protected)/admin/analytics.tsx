import { View, ScrollView, Pressable, Platform, Dimensions, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  FileText
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AnalyticsPage() {
  const { colorScheme } = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/home');
      return;
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch various stats from API
      const [usersRes, coursesRes, testsRes] = await Promise.all([
        api.get('/users'),
        api.get('/courses'),
        api.get('/tests')
      ]);

      const users = usersRes.data.users || [];
      const courses = coursesRes.data.courses || [];
      const tests = testsRes.data.tests || [];

      setStats({
        totalUsers: users.length,
        totalStudents: users.filter((u: any) => u.role === 'student').length,
        totalTeachers: users.filter((u: any) => u.role === 'teacher').length,
        totalAdmins: users.filter((u: any) => u.role === 'admin').length,
        activeUsers: users.filter((u: any) => u.is_active).length,
        inactiveUsers: users.filter((u: any) => !u.is_active).length,
        totalCourses: courses.length,
        activeCourses: courses.filter((c: any) => c.is_active).length,
        totalTests: tests.length,
        activeTests: tests.filter((t: any) => t.is_active).length,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    const confirmExport = Platform.OS === 'web' 
      ? window.confirm('Generate a comprehensive PDF report with all analytics data?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Export Analytics Report',
            'Generate a comprehensive PDF report with all analytics data?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Export PDF', onPress: () => resolve(true) }
            ]
          );
        });

    if (!confirmExport) return;

    try {
      setExporting(true);
      const response = await api.post('/admin/analytics/export', {
        format: 'pdf',
        stats: stats
      });

      // For web, download the file
      if (Platform.OS === 'web') {
        const reportContent = generateReportContent(response.data.data);
        // Change extension to .txt since we're generating plain text
        const filename = response.data.filename.replace('.pdf', '.txt');
        downloadFile(reportContent, filename, 'text/plain');
        alert('Analytics report exported successfully');
      } else {
        Alert.alert('Success', response.data.message || 'Analytics report exported successfully');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to export PDF report';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    const confirmExport = Platform.OS === 'web'
      ? window.confirm('Export raw analytics data in CSV format for further analysis?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Export Data as CSV',
            'Export raw analytics data in CSV format for further analysis?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Export CSV', onPress: () => resolve(true) }
            ]
          );
        });

    if (!confirmExport) return;

    try {
      setExporting(true);
      const response = await api.post('/admin/analytics/export', {
        format: 'csv',
        stats: stats
      });

      // For web, download the CSV file
      if (Platform.OS === 'web') {
        const csvContent = generateCSVContent(response.data.data);
        downloadFile(csvContent, response.data.filename, 'text/csv');
        alert('Analytics data exported successfully as CSV');
      } else {
        Alert.alert('Success', response.data.message || 'Analytics data exported as CSV');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to export CSV data';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setExporting(false);
    }
  };

  // Generate report content from data
  const generateReportContent = (data: any) => {
    const content = `
ANALYTICS REPORT
================
Generated: ${new Date().toLocaleString()}

USER STATISTICS
--------------
Total Users: ${data.stats.users.total}
Students: ${data.stats.users.students}
Teachers: ${data.stats.users.teachers}
Admins: ${data.stats.users.admins}
Active Users: ${data.stats.users.active}
Inactive Users: ${data.stats.users.inactive}

COURSE STATISTICS
----------------
Total Courses: ${data.stats.courses.total}
Active Courses: ${data.stats.courses.active}

TEST STATISTICS
--------------
Total Tests: ${data.stats.tests.total}
Active Tests: ${data.stats.tests.active}

Report generated by Quiz Portal Admin System
`;
    return content;
  };

  // Generate CSV content from data
  const generateCSVContent = (data: any[][]) => {
    return data.map(row => row.join(',')).join('\n');
  };

  // Download file in browser
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }: any) => (
    <View
      className={`flex-1 rounded-2xl p-4 ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
      style={{ minWidth: 150 }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center`}
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={24} color={color} />
        </View>
        {trend && (
          <View className="flex-row items-center">
            {trend > 0 ? (
              <TrendingUp size={16} color="#10b981" />
            ) : (
              <TrendingDown size={16} color="#ef4444" />
            )}
            <Text className={`ml-1 text-xs font-bold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value || 0}
      </Text>
      <Text className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {title}
      </Text>
      {subtitle && (
        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const SectionHeader = ({ title, icon: Icon }: any) => (
    <View className="flex-row items-center mb-4 mt-6">
      <Icon size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
      <Text className={`ml-2 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <View className="flex-1 items-center justify-center">
          <BarChart3 size={48} color={isDark ? '#60a5fa' : '#3b82f6'} />
          <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading analytics...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="pt-6 pb-2">
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Analytics & Reports
          </Text>
          <Text className={`mt-1 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            System statistics and insights
          </Text>
        </View>

        {/* Overview Stats */}
        <SectionHeader title="Overview" icon={BarChart3} />
        <View className="flex-row flex-wrap gap-3 mb-4">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.totalUsers}
            subtitle="All accounts"
            color="#3b82f6"
            trend={5}
          />
          <StatCard
            icon={GraduationCap}
            title="Total Courses"
            value={stats.totalCourses}
            subtitle="All courses"
            color="#10b981"
            trend={3}
          />
        </View>
        <View className="flex-row flex-wrap gap-3">
          <StatCard
            icon={BookOpen}
            title="Total Tests"
            value={stats.totalTests}
            subtitle="All tests"
            color="#f59e0b"
            trend={-2}
          />
          <StatCard
            icon={CheckCircle}
            title="Active Users"
            value={stats.activeUsers}
            subtitle="Currently active"
            color="#8b5cf6"
          />
        </View>

        {/* User Statistics */}
        <SectionHeader title="User Statistics" icon={Users} />
        <View
          className={`rounded-2xl p-4 mb-4 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1">
              <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Students
              </Text>
              <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalStudents}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Teachers
              </Text>
              <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalTeachers}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Admins
              </Text>
              <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalAdmins}
              </Text>
            </View>
          </View>
          
          {/* Status Bar */}
          <View className="mt-4">
            <View className="flex-row justify-between mb-2">
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Active vs Inactive
              </Text>
              <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {stats.activeUsers}/{stats.totalUsers}
              </Text>
            </View>
            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-green-500"
                style={{ width: `${(stats.activeUsers / stats.totalUsers) * 100}%` }}
              />
            </View>
          </View>
        </View>

        {/* Course Statistics */}
        <SectionHeader title="Course Statistics" icon={GraduationCap} />
        <View
          className={`rounded-2xl p-4 mb-4 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Courses
              </Text>
              <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.activeCourses}
              </Text>
            </View>
            <View className="items-end">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Inactive Courses
              </Text>
              <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {stats.totalCourses - stats.activeCourses}
              </Text>
            </View>
          </View>
          
          <View className="mt-4">
            <View className="flex-row justify-between mb-2">
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Course Activation Rate
              </Text>
              <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {stats.totalCourses > 0 ? Math.round((stats.activeCourses / stats.totalCourses) * 100) : 0}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500"
                style={{ 
                  width: `${stats.totalCourses > 0 ? (stats.activeCourses / stats.totalCourses) * 100 : 0}%` 
                }}
              />
            </View>
          </View>
        </View>

        {/* Test Statistics */}
        <SectionHeader title="Test Statistics" icon={BookOpen} />
        <View
          className={`rounded-2xl p-4 mb-4 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Tests
              </Text>
              <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.activeTests}
              </Text>
            </View>
            <View className="items-end">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Tests
              </Text>
              <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalTests}
              </Text>
            </View>
          </View>
        </View>

        {/* Export Options */}
        <SectionHeader title="Export Reports" icon={Award} />
        <View className="gap-3">
          <Pressable
            onPress={handleExportPDF}
            disabled={exporting || loading}
            className={`rounded-xl p-5 border flex-row items-center ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            style={({ pressed }) => [{ opacity: pressed || exporting ? 0.5 : 1 }]}
          >
            <View
              className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                isDark ? 'bg-red-900/30' : 'bg-red-50'
              }`}
            >
              <FileText size={24} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Export Analytics Report (TXT)
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Download comprehensive analytics report as text file
              </Text>
            </View>
            <Download size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          </Pressable>
          
          <Pressable
            onPress={handleExportCSV}
            disabled={exporting || loading}
            className={`rounded-xl p-5 border flex-row items-center ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            style={({ pressed }) => [{ opacity: pressed || exporting ? 0.5 : 1 }]}
          >
            <View
              className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                isDark ? 'bg-green-900/30' : 'bg-green-50'
              }`}
            >
              <BarChart3 size={24} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Export Data (CSV)
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Download raw data for analysis
              </Text>
            </View>
            <Download size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          </Pressable>
        </View>

        {exporting && (
          <View className="mt-4">
            <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Exporting report...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
