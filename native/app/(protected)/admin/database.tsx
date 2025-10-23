import { View, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Database,
  Download,
  Upload,
  Trash2,
  HardDrive,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Archive,
  FileText
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function DatabaseManagementPage() {
  const { colorScheme } = useColorScheme();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(false);
  const [dbStats, setDbStats] = useState({
    size: '0 MB',
    tables: 0,
    records: 0,
    lastBackup: 'Never',
    health: 'Unknown'
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/home');
    } else {
      fetchDatabaseStats();
    }
  }, [user]);

  const isWeb = Platform.OS === 'web';

  const fetchDatabaseStats = async () => {
    try {
      const response = await api.get('/admin/database/stats');
      if (response.data.stats) {
        setDbStats(response.data.stats);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch database statistics');
    }
  };

  const handleBackupDatabase = async () => {
    Alert.alert(
      'Backup Database',
      'Create a complete backup of the database? This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Backup',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.post('/admin/database/backup');
              Alert.alert('Success', response.data.message || 'Database backup created successfully', [
                {
                  text: 'OK',
                  onPress: () => fetchDatabaseStats()
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to create backup');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRestoreDatabase = async () => {
    Alert.alert(
      '⚠️ Restore Database',
      'WARNING: This will restore the database from the latest backup. All current data will be replaced. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.post('/admin/database/restore');
              Alert.alert('Success', response.data.message || 'Database restored successfully', [
                {
                  text: 'OK',
                  onPress: () => fetchDatabaseStats()
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to restore database');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleOptimizeDatabase = async () => {
    Alert.alert(
      'Optimize Database',
      'This will optimize database tables and improve performance. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Optimize',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.post('/admin/database/optimize');
              Alert.alert('Success', response.data.message || 'Database optimized successfully', [
                {
                  text: 'OK',
                  onPress: () => fetchDatabaseStats()
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to optimize database');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCleanupData = async () => {
    Alert.alert(
      'Clean Up Data',
      'Remove old logs, expired sessions, and temporary data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.post('/admin/database/cleanup');
              Alert.alert('Success', response.data.message || 'Database cleaned up successfully', [
                {
                  text: 'OK',
                  onPress: () => fetchDatabaseStats()
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to cleanup data');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    if (Platform.OS === 'web') {
      // Web-specific export with direct download
      const format = window.prompt('Choose export format (sql/csv/json):', 'sql');
      if (!format || !['sql', 'csv', 'json'].includes(format.toLowerCase())) {
        if (format) alert('Invalid format. Please choose sql, csv, or json');
        return;
      }
      exportDatabaseFormat(format.toLowerCase());
    } else {
      // Mobile alert dialog
      Alert.alert(
        'Export Database',
        'Choose export format:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'SQL', onPress: () => exportDatabaseFormat('sql') },
          { text: 'CSV', onPress: () => exportDatabaseFormat('csv') },
          { text: 'JSON', onPress: () => exportDatabaseFormat('json') }
        ]
      );
    }
  };

  const exportDatabaseFormat = async (format: string) => {
    try {
      setLoading(true);
      const response = await api.post('/admin/database/export', { format });

      // For web, download the file
      if (Platform.OS === 'web' && response.data.data) {
        let content = '';
        let mimeType = '';
        const filename = response.data.filename || `database_export.${format}`;

        switch (format) {
          case 'sql':
            content = response.data.data;
            mimeType = 'application/sql';
            break;
          case 'csv':
            content = Array.isArray(response.data.data)
              ? response.data.data.map((row: any[]) => row.join(',')).join('\n')
              : response.data.data;
            mimeType = 'text/csv';
            break;
          case 'json':
            content = typeof response.data.data === 'string'
              ? response.data.data
              : JSON.stringify(response.data.data, null, 2);
            mimeType = 'application/json';
            break;
        }

        downloadFile(content, filename, mimeType);
        alert(response.data.message || `${format.toUpperCase()} export completed`);
      } else {
        Alert.alert('Success', response.data.message || `${format.toUpperCase()} export completed`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || `Failed to export as ${format.toUpperCase()}`;
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
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

  const handleResetDatabase = async () => {
    Alert.alert(
      '🚨 DANGER ZONE',
      'This will DELETE ALL DATA and reset the database to defaults. This action CANNOT be undone!\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Database',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.post('/admin/database/reset');
              Alert.alert('Success', response.data.message || 'Database reset to defaults', [
                {
                  text: 'OK',
                  onPress: () => fetchDatabaseStats()
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to reset database');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <View
      className={`flex-1 rounded-xl p-4 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
      style={{ minWidth: 150 }}
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={24} color={color} />
      </View>
      <Text className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </Text>
      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </Text>
    </View>
  );

  const ActionCard = ({
    icon: Icon,
    title,
    description,
    color,
    onPress,
    variant = 'default'
  }: any) => (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`rounded-xl p-5 mb-4 ${variant === 'danger'
          ? isDark ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'
          : isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
      style={({ pressed }) => [{ opacity: pressed || loading ? 0.5 : 1 }]}
    >
      <View className="flex-row items-center">
        <View
          className={`w-14 h-14 rounded-xl items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'
            }`}
          style={{ shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}
        >
          <Icon size={26} color={color} />
        </View>
        <View className="ml-4 flex-1">
          <Text className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {description}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Database Health Status */}
        <View className={`rounded-xl p-5 mt-6 ${dbStats.health === 'Good'
            ? isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
            : isDark ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
          }`}>
          <View className="flex-row items-center mb-2">
            {dbStats.health === 'Good' ? (
              <CheckCircle size={24} color="#10b981" />
            ) : (
              <AlertTriangle size={24} color="#f59e0b" />
            )}
            <Text className={`ml-2 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Database Status: {dbStats.health}
            </Text>
          </View>
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            All systems operational
          </Text>
        </View>

        {/* Database Statistics */}
        <View className="mt-6">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Statistics
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <StatCard icon={HardDrive} label="Database Size" value={dbStats.size} color="#3b82f6" />
            <StatCard icon={Database} label="Total Tables" value={dbStats.tables} color="#10b981" />
            <StatCard icon={FileText} label="Total Records" value={dbStats.records} color="#8b5cf6" />
            <StatCard icon={Archive} label="Last Backup" value={dbStats.lastBackup} color="#f59e0b" />
          </View>
        </View>

        {/* Backup & Restore */}
        <View className="mt-8">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Backup & Restore
          </Text>
          <ActionCard
            icon={Download}
            title="Backup Database"
            description="Create a complete backup of the database"
            color="#3b82f6"
            onPress={handleBackupDatabase}
          />
          <ActionCard
            icon={Upload}
            title="Restore Database"
            description="Restore database from a backup file"
            color="#f59e0b"
            onPress={handleRestoreDatabase}
          />
        </View>

        {/* Maintenance */}
        <View className="mt-6">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Maintenance
          </Text>
          <ActionCard
            icon={RefreshCw}
            title="Optimize Database"
            description="Optimize tables and improve performance"
            color="#10b981"
            onPress={handleOptimizeDatabase}
          />
          <ActionCard
            icon={Trash2}
            title="Clean Up Data"
            description="Remove old logs and temporary data"
            color="#8b5cf6"
            onPress={handleCleanupData}
          />
        </View>

        {/* Data Export */}
        <View className="mt-6">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Data Export
          </Text>
          <ActionCard
            icon={Archive}
            title="Export Database"
            description="Export data in SQL, CSV, or JSON format"
            color="#06b6d4"
            onPress={handleExportData}
          />
        </View>

        {/* Danger Zone */}
        <View className="mt-6">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Danger Zone
          </Text>
          <ActionCard
            icon={AlertTriangle}
            title="Reset Database"
            description="WARNING: Delete all data and reset to defaults"
            color="#ef4444"
            variant="danger"
            onPress={handleResetDatabase}
          />
        </View>

        {loading && (
          <View className="mt-4">
            <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Processing operation...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
