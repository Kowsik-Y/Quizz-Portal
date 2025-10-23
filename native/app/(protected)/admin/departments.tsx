import { View, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Edit, Building2 } from 'lucide-react-native';
import api from '@/lib/api';

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at: string;
}

export default function DepartmentsManagementPage() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      setDepartments(response.data.departments || response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      Alert.alert('Error', 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      Alert.alert('Error', 'Department name and code are required');
      return;
    }

    try {
      if (editingId) {
        // Update existing department
        await api.put(`/departments/${editingId}`, formData);
        Alert.alert('Success', 'Department updated successfully');
      } else {
        // Create new department
        await api.post('/departments', formData);
        Alert.alert('Success', 'Department created successfully');
      }
      
      // Reset form
      setFormData({ name: '', code: '', description: '' });
      setShowAddForm(false);
      setEditingId(null);
      
      // Refresh list
      fetchDepartments();
    } catch (error: any) {
      console.error('Failed to save department:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save department');
    }
  };

  const handleEdit = (department: Department) => {
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || ''
    });
    setEditingId(department.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Delete Department',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/departments/${id}`);
              Alert.alert('Success', 'Department deleted successfully');
              fetchDepartments();
            } catch (error: any) {
              console.error('Failed to delete department:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete department');
            }
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    setFormData({ name: '', code: '', description: '' });
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
              Departments Management
            </Text>
            <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Create and manage departments
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
              <Text className="text-white ml-2 font-semibold">Add Department</Text>
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
              {editingId ? 'Edit Department' : 'Add New Department'}
            </Text>

            {/* Department Name */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Department Name *
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Computer Science"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                className={`px-4 py-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </View>

            {/* Department Code */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Department Code *
              </Text>
              <TextInput
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                placeholder="e.g., CS"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                maxLength={10}
                className={`px-4 py-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Description (Optional)
              </Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Brief description of the department"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                multiline
                numberOfLines={3}
                className={`px-4 py-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                style={{ textAlignVertical: 'top' }}
              />
            </View>

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
                className={`flex-1 py-3 rounded-lg border ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Departments List */}
        {loading ? (
          <View className="py-20 items-center">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading...</Text>
          </View>
        ) : departments.length === 0 ? (
          <View className="py-20 items-center">
            <Building2 size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No departments yet
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Click "Add Department" to create one
            </Text>
          </View>
        ) : (
          departments.map((department) => (
            <View
              key={department.id}
              className={`mb-3 p-4 rounded-xl border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {department.name}
                    </Text>
                    <View className={`px-2 py-1 rounded ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                      <Text className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {department.code}
                      </Text>
                    </View>
                  </View>
                  
                  {department.description && (
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {department.description}
                    </Text>
                  )}
                </View>

                <View className="flex-row gap-2 ml-3">
                  <Pressable
                    onPress={() => handleEdit(department)}
                    className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    <Edit size={18} color={isDark ? '#60a5fa' : '#3b82f6'} />
                  </Pressable>
                  
                  <Pressable
                    onPress={() => handleDelete(department.id, department.name)}
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
