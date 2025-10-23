import React, { useState } from 'react';
import { View, ScrollView, TextInput, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, Shield, Users, GraduationCap, Hash, Building } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useCustomAlert } from '@/components/ui/custom-alert';

export default function CreateUserScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { showAlert } = useCustomAlert();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'admin' | 'teacher' | 'student',
    rollNumber: '',
    department: 'CSE' as 'CSE' | 'IT' | 'ECE' | 'MECH' | 'CIVIL'
  });


  // Only admin can access this page
  if (user?.role !== 'admin') {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Shield size={64} color="#ef4444" />
        <Text className="text-xl font-bold mt-4 text-center text-foreground">
          Access Denied
        </Text>
        <Text className="text-center text-muted-foreground mt-2">
          Only administrators can create users
        </Text>
        <Button onPress={() => router.back()} className="mt-6">
          <Text className="text-white">Go Back</Text>
        </Button>
      </View>
    );
  }
  const isWeb = Platform.OS === 'web';
  const handleCreateUser = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      showAlert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.role === 'student' && !formData.rollNumber) {
      showAlert('Error', 'Roll number is required for students');
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // await userAPI.create(formData);

      console.log('Creating user:', formData);

      showAlert(
        'Success',
        `User ${formData.name} created successfully!`,
        [{
          text: 'OK', onPress: () => {
            // Reset form
            setFormData({
              name: '',
              email: '',
              password: '',
              role: 'student',
              rollNumber: '',
              department: 'CSE'
            });
          }
        }]
      );
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch (formData.role) {
      case 'admin': return <Shield size={20} color="#a855f7" />;
      case 'teacher': return <Users size={20} color="#22c55e" />;
      case 'student': return <GraduationCap size={20} color="#3b82f6" />;
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: isWeb ? 48 : 24,
          paddingTop: isWeb ? 40 : 20
        }}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
            <User size={40} color="#ffffff" />
          </View>
          <Text className="text-3xl font-bold text-foreground">Create New User</Text>
          <Text className="text-muted-foreground text-sm mt-2">
            Admin Panel - User Management
          </Text>
        </View>

        <View className="space-y-5">
          {/* Name Field */}
          <View>
            <Text className="text-sm font-semibold mb-2 text-foreground">Full Name</Text>
            <View className="flex-row items-center bg-secondary rounded-xl px-4 py-4 border border-border">
              <User size={20} color="#666666" />
              <TextInput
                className="flex-1 ml-3 text-base text-foreground"
                placeholder="Enter full name"
                placeholderTextColor="#999"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              />
            </View>
          </View>

          {/* Email Field */}
          <View>
            <Text className="text-sm font-semibold mb-2 text-foreground">Email Address</Text>
            <View className="flex-row items-center bg-secondary rounded-xl px-4 py-4 border border-border">
              <Mail size={20} color="#666666" />
              <TextInput
                className="flex-1 ml-3 text-base text-foreground"
                placeholder="Enter email address"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Field */}
          <View>
            <Text className="text-sm font-semibold mb-2 text-foreground">Password</Text>
            <View className="flex-row items-center bg-secondary rounded-xl px-4 py-4 border border-border">
              <Lock size={20} color="#666666" />
              <TextInput
                className="flex-1 ml-3 text-base text-foreground"
                placeholder="Enter password"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                secureTextEntry
              />
            </View>
          </View>

          {/* Role Picker */}
          <View>
            <Text className="text-sm font-semibold mb-2 text-foreground">Role</Text>
            <View className="flex-row items-center bg-secondary rounded-xl px-4 py-2 border border-border">
              {getRoleIcon()}
              <View className="flex-1 ml-3">
                <Picker
                  selectedValue={formData.role}
                  onValueChange={(value: 'admin' | 'teacher' | 'student') =>
                    setFormData(prev => ({ ...prev, role: value }))
                  }
                  style={{ color: '#ffffff' }}
                >
                  <Picker.Item label="👑 Admin" value="admin" />
                  <Picker.Item label="👨‍🏫 Teacher" value="teacher" />
                  <Picker.Item label="🎓 Student" value="student" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Department Picker */}
          <View>
            <Text className="text-sm font-semibold mb-2 text-foreground">Department</Text>
            <View className="flex-row items-center bg-secondary rounded-xl px-4 py-2 border border-border">
              <Building size={20} color="#666666" />
              <View className="flex-1 ml-3">
                <Picker
                  selectedValue={formData.department}
                  onValueChange={(value: 'CSE' | 'IT' | 'ECE' | 'MECH' | 'CIVIL') =>
                    setFormData(prev => ({ ...prev, department: value }))
                  }
                  style={{ color: '#ffffff' }}
                >
                  <Picker.Item label="Computer Science (CSE)" value="CSE" />
                  <Picker.Item label="Information Technology (IT)" value="IT" />
                  <Picker.Item label="Electronics (ECE)" value="ECE" />
                  <Picker.Item label="Mechanical (MECH)" value="MECH" />
                  <Picker.Item label="Civil (CIVIL)" value="CIVIL" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Roll Number */}
            <View>
              <Text className="text-sm font-semibold mb-2 text-foreground">
                Roll Number *
              </Text>
              <View className="flex-row items-center bg-secondary rounded-xl px-4 py-4 border border-border">
                <Hash size={20} color="#666666" />
                <TextInput
                  className="flex-1 ml-3 text-base text-foreground"
                  placeholder="e.g., 21CSE001"
                  placeholderTextColor="#999"
                  value={formData.rollNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, rollNumber: text.toUpperCase() }))}
                  autoCapitalize="characters"
                />
              </View>
            </View>

          {/* Summary Card */}
          <View className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
            <Text className="text-sm font-bold mb-3 text-foreground">User Summary</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Name:</Text>
                <Text className="text-xs font-semibold text-foreground">
                  {formData.name || '-'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Email:</Text>
                <Text className="text-xs font-semibold text-foreground">
                  {formData.email || '-'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Role:</Text>
                <Text className={`text-xs font-bold ${formData.role === 'admin' ? 'text-purple-500' :
                    formData.role === 'teacher' ? 'text-green-500' : 'text-blue-500'
                  }`}>
                  {formData.role.toUpperCase()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Department:</Text>
                <Text className="text-xs font-semibold text-foreground">{formData.department}</Text>
              </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Roll Number:</Text>
                  <Text className="text-xs font-semibold text-foreground">
                    {formData.rollNumber || '-'}
                  </Text>
                </View>
            </View>
          </View>

          {/* Create Button */}
          <Button
            onPress={handleCreateUser}
            disabled={loading}
            className="mt-6 py-4 sm:py-6"
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Creating User...' : 'Create User'}
            </Text>
          </Button>

          {/* Cancel Button */}
          <Button
            variant="outline"
            onPress={() => router.back()}
            className="py-4 sm:py-6"
          >
            <Text className="text-foreground font-semibold text-base">Cancel</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

