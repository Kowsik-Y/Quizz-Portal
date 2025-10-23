import { View, ScrollView, Pressable, Platform, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Link as LinkIcon, FileText, Video, FileCode, Save } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { materialAPI } from '@/lib/api';
import { Picker } from '@react-native-picker/picker';
import { useCustomAlert } from '@/components/ui/custom-alert';

type MaterialType = 'document' | 'video' | 'link' | 'pdf' | 'code' | 'other';

export default function AddMaterialToTestPage() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';
  const router = useRouter();
  const { testId } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const { showAlert } = useCustomAlert();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    material_type: 'document' as MaterialType,
    file_url: '',
    content: '',
  });


  // Check if user is teacher or admin
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  if (!isTeacherOrAdmin) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-xl font-bold text-red-500 text-center">
            Access Denied
          </Text>
          <Text className={`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Only teachers and admins can add materials.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 bg-blue-500 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      showAlert('Error', 'Please enter a title');
      return;
    }

    if (formData.material_type === 'link' && !formData.file_url.trim()) {
      showAlert('Error', 'Please enter a URL for link type materials');
      return;
    }

    if (formData.material_type === 'code' && !formData.content.trim()) {
      showAlert('Error', 'Please enter code content');
      return;
    }

    try {
      setLoading(true);

      await materialAPI.create({
        test_id: Number(testId),
        title: formData.title,
        description: formData.description || undefined,
        material_type: formData.material_type,
        file_url: formData.file_url || undefined,
        content: formData.content || undefined,
      });

      showAlert('Success', 'Material added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error adding material:', error);
      showAlert(
        'Error',
        error.response?.data?.error || 'Failed to add material. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const materialTypes: { value: MaterialType; label: string; icon: any }[] = [
    { value: 'document', label: 'Document', icon: FileText },
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'link', label: 'Link/URL', icon: LinkIcon },
    { value: 'code', label: 'Code Snippet', icon: FileCode },
    { value: 'other', label: 'Other', icon: FileText },
  ];

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1 px-6 py-6">
        {/* Title Input */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Material Title *
          </Text>
          <TextInput
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="e.g., Chapter 5 Notes, Video Tutorial"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            className={`px-4 py-3 rounded-lg border ${isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
              }`}
          />
        </View>

        {/* Description Input */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Description
          </Text>
          <TextInput
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Brief description of this material"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            multiline
            numberOfLines={3}
            className={`px-4 py-3 rounded-lg border ${isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
              }`}
            style={{ textAlignVertical: 'top' }}
          />
        </View>

        {/* Material Type Picker */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Material Type *
          </Text>
          <View className={`rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
            <Picker
              selectedValue={formData.material_type}
              onValueChange={(value) => setFormData({ ...formData, material_type: value as MaterialType })}
              style={{ color: isDark ? '#fff' : '#000' }}
              dropdownIconColor={isDark ? '#fff' : '#000'}
            >
              {materialTypes.map((type) => (
                <Picker.Item key={type.value} label={type.label} value={type.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* URL Input (for links, videos, documents) */}
        {['link', 'video', 'document', 'pdf'].includes(formData.material_type) && (
          <View className="mb-6">
            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {formData.material_type === 'link' ? 'URL *' : 'File URL'}
            </Text>
            <TextInput
              value={formData.file_url}
              onChangeText={(text) => setFormData({ ...formData, file_url: text })}
              placeholder={
                formData.material_type === 'link'
                  ? 'https://example.com'
                  : 'https://example.com/file.pdf'
              }
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              keyboardType="url"
              autoCapitalize="none"
              className={`px-4 py-3 rounded-lg border ${isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
                }`}
            />
          </View>
        )}

        {/* Content Input (for code snippets) */}
        {formData.material_type === 'code' && (
          <View className="mb-6">
            <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Code Content *
            </Text>
            <TextInput
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              placeholder="Paste your code here..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              multiline
              numberOfLines={10}
              className={`px-4 py-3 rounded-lg border font-mono ${isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
                }`}
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        )}

        {/* Info Box */}
        <View className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
          <Text className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
            💡 <Text className="font-semibold">Tip:</Text> You can add multiple materials to a test. Students will see all materials when viewing the test details.
          </Text>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`py-4 rounded-lg flex-row items-center justify-center mb-6 ${loading ? 'bg-gray-400' : 'bg-blue-500'
            }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text className="text-white font-bold text-lg ml-2">Add Material</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
