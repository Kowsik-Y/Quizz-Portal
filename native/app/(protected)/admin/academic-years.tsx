import { View, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Edit, Calendar } from 'lucide-react-native';
import api from '@/lib/api';

interface AcademicYear {
  id: number;
  year: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export default function AcademicYearsPage() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    year: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      setLoading(true);
      const response = await api.get('/academic-years');
      setYears(response.data.academicYears || response.data);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
      Alert.alert('Error', 'Failed to load academic years');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.year.trim()) {
      Alert.alert('Error', 'Academic year is required');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/academic-years/${editingId}`, formData);
        Alert.alert('Success', 'Academic year updated successfully');
      } else {
        await api.post('/academic-years', formData);
        Alert.alert('Success', 'Academic year created successfully');
      }
      
      setFormData({ year: '', start_date: '', end_date: '', is_active: true });
      setShowAddForm(false);
      setEditingId(null);
      fetchYears();
    } catch (error: any) {
      console.error('Failed to save academic year:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save academic year');
    }
  };

  const handleEdit = (year: AcademicYear) => {
    setFormData({
      year: year.year,
      start_date: year.start_date || '',
      end_date: year.end_date || '',
      is_active: year.is_active
    });
    setEditingId(year.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: number, year: string) => {
    Alert.alert(
      'Delete Academic Year',
      `Are you sure you want to delete "${year}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/academic-years/${id}`);
              Alert.alert('Success', 'Academic year deleted successfully');
              fetchYears();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    setFormData({ year: '', start_date: '', end_date: '', is_active: true });
    setShowAddForm(false);
    setEditingId(null);
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Academic Years
            </Text>
            <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage academic years for courses
            </Text>
          </View>
          
          {!showAddForm && (
            <Pressable
              onPress={() => setShowAddForm(true)}
              className={`flex-row items-center px-4 py-2 rounded-lg ${
                isDark ? 'bg-blue-600' : 'bg-blue-500'
              }`}
            >
              <Plus size={20} color="#fff" />
              <Text className="text-white ml-2 font-semibold">Add Year</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Add/Edit Form */}
        {showAddForm && (
          <View className={`mb-6 p-4 rounded-xl border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editingId ? 'Edit Academic Year' : 'Add Academic Year'}
            </Text>

            {/* Year */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Academic Year * (e.g., 2024-2025)
              </Text>
              <TextInput
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                placeholder="2024-2025"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                className={`px-4 py-3 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </View>

            {/* Start Date */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Start Date (Optional)
              </Text>
              <TextInput
                value={formData.start_date}
                onChangeText={(text) => setFormData({ ...formData, start_date: text })}
                placeholder="2024-09-01"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                className={`px-4 py-3 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </View>

            {/* End Date */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                End Date (Optional)
              </Text>
              <TextInput
                value={formData.end_date}
                onChangeText={(text) => setFormData({ ...formData, end_date: text })}
                placeholder="2025-06-30"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                className={`px-4 py-3 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </View>

            {/* Active Status */}
            <Pressable
              onPress={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className="flex-row items-center mb-4"
            >
              <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                formData.is_active 
                  ? 'bg-blue-500 border-blue-500' 
                  : isDark ? 'border-gray-600' : 'border-gray-300'
              }`}>
                {formData.is_active && (
                  <Text className="text-white text-xs">✓</Text>
                )}
              </View>
              <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Active Year
              </Text>
            </Pressable>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleSubmit}
                className={`flex-1 py-3 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
              >
                <Text className="text-white text-center font-semibold">
                  {editingId ? 'Update' : 'Create'}
                </Text>
              </Pressable>
              
              <Pressable
                onPress={handleCancel}
                className={`flex-1 py-3 rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
              >
                <Text className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Years List */}
        {loading ? (
          <View className="py-20 items-center">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading...</Text>
          </View>
        ) : years.length === 0 ? (
          <View className="py-20 items-center">
            <Calendar size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No academic years yet
            </Text>
          </View>
        ) : (
          years.map((year) => (
            <View
              key={year.id}
              className={`mb-3 p-4 rounded-xl border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {year.year}
                    </Text>
                    {year.is_active && (
                      <View className="px-2 py-1 rounded bg-green-100">
                        <Text className="text-xs font-bold text-green-700">ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  
                  {(year.start_date || year.end_date) && (
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {year.start_date && `From: ${year.start_date}`}
                      {year.start_date && year.end_date && ' | '}
                      {year.end_date && `To: ${year.end_date}`}
                    </Text>
                  )}
                </View>

                <View className="flex-row gap-2 ml-3">
                  <Pressable
                    onPress={() => handleEdit(year)}
                    className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    <Edit size={18} color={isDark ? '#60a5fa' : '#3b82f6'} />
                  </Pressable>
                  
                  <Pressable
                    onPress={() => handleDelete(year.id, year.year)}
                    className={`p-2 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}
                  >
                    <Trash2 size={18} color={isDark ? '#f87171' : '#ef4444'} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
