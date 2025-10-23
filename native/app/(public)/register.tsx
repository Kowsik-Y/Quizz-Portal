import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User, Hash, ChevronDown, ShieldAlert } from 'lucide-react-native';
import { departmentAPI } from '@/lib/api';
import type { Department } from '@/lib/types';
import { useCustomAlert } from '@/components/ui/custom-alert';

export default function RegisterScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isWeb = Platform.OS === 'web';

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: isWeb ? 48 : 24,
            paddingTop: isWeb ? 80 : 60,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <View style={{ width: isWeb ? 500 : '100%', maxWidth: '100%' }}>
            {/* Restricted Access Message */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-red-500/20 rounded-full items-center justify-center mb-6">
                <ShieldAlert size={48} color="#ef4444" />
              </View>
              <Text className="text-3xl font-bold mb-4 text-foreground text-center">
                Access Restricted
              </Text>
              <Text className="text-muted-foreground text-base text-center mb-8">
                Only administrators can create new user accounts.
              </Text>
            </View>

            {/* Info Card */}
            <View className="bg-muted rounded-xl p-6 mb-6">
              <Text className="font-semibold text-base mb-3 text-foreground">
                📧 Need an Account?
              </Text>
              <Text className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Please contact your system administrator to request account creation.
                They will create an account for you with the appropriate role and permissions.
              </Text>
              <Text className="font-semibold text-sm text-foreground mb-2">
                Contact Information:
              </Text>
              <Text className="text-sm text-muted-foreground">
                • Email: admin@quiz.com{'\n'}
                • Phone: Contact your institution
              </Text>
            </View>

            {/* Back to Login Button */}
            <Button
              onPress={() => router.replace('/login')}
              className="mb-4"
            >
              <Text className="text-white font-semibold text-base">
                Back to Login
              </Text>
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  // If admin, show the full registration form
  return <AdminCreateUserForm />;
}

// Admin-only user creation form
function AdminCreateUserForm() {
  const router = useRouter();
  const { register, loading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'student' as 'admin' | 'teacher' | 'student'
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const isWeb = Platform.OS === 'web';
  const { showAlert } = useCustomAlert();
  // Load departments
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      setDepartments(response.data.departments || []);
      if (response.data.departments?.length > 0) {
        setSelectedDept(response.data.departments[0]);
      }
    } catch (error) {
      showAlert('Error', 'Failed to load departments');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.email || !formData.password || !formData.name) {
      showAlert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return;
    }

    const success = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role
    );

    if (success) {
      showAlert('Success', 'User created successfully!', [
        {
          text: 'OK', onPress: () => {
            setFormData({ email: '', password: '', confirmPassword: '', name: '', role: 'student' });
            router.replace('/(protected)/(tabs)/home');
          }
        }
      ]);
    }
    // Error handling is done by the store with toast notifications
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: isWeb ? 48 : 24,
          paddingTop: isWeb ? 60 : 40,
          alignItems: isWeb ? 'center' : 'stretch'
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: isWeb ? 500 : '100%', maxWidth: '100%' }}>
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
              <User size={40} color="#ffffff" />
            </View>
            <Text className="text-3xl font-bold mb-1 text-foreground">Create New User</Text>
            <Text className="text-muted-foreground text-sm text-center">
              Admin - User Management
            </Text>
          </View>

          {/* Registration Form */}
          <View className="gap-4">
            {/* Email Field */}
            <View>
              <Text className="text-sm font-semibold mb-2 text-foreground">Email Address *</Text>
              <View className={`flex-row items-center rounded-xl px-4 py-2 sm:py-4 border ${isWeb ? 'bg-secondary/50' : 'bg-secondary'
                } border-border`}>
                <Mail size={20} color="#666666" />
                <TextInput
                  className="flex-1 ml-3 text-base text-foreground"
                  placeholder="your.email@example.com"
                  placeholderTextColor="#999"
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Role Selector */}
            <View>
              <Text className="text-sm font-semibold mb-2 text-foreground">User Role *</Text>
              <View className="flex-row gap-2">
                {(['admin', 'teacher', 'student'] as const).map((role) => (
                  <Pressable
                    key={role}
                    onPress={() => setFormData(prev => ({ ...prev, role }))}
                    className={`flex-1 py-3 rounded-xl border ${formData.role === role
                        ? 'bg-primary border-primary'
                        : isWeb ? 'bg-secondary/50 border-border' : 'bg-secondary border-border'
                      }`}
                  >
                    <Text className={`text-center font-semibold capitalize ${formData.role === role ? 'text-white' : 'text-foreground'
                      }`}>
                      {role}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Full Name Field */}
            <View>
              <Text className="text-sm font-semibold mb-2 text-foreground">Full Name *</Text>
              <View className={`flex-row items-center rounded-xl px-4 py-2 sm:py-4 border ${isWeb ? 'bg-secondary/50' : 'bg-secondary'
                } border-border`}>
                <User size={20} color="#666666" />
                <TextInput
                  className="flex-1 ml-3 text-base text-foreground"
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            </View>

            {/* Department Picker - Only for non-admin roles */}
            {formData.role !== 'admin' && (
              <View>
                <Text className="text-sm font-semibold mb-2 text-foreground">Department</Text>
                <Pressable
                  onPress={() => setShowDeptPicker(!showDeptPicker)}
                  className={`flex-row items-center justify-between rounded-xl px-4 py-3 sm:py-4 border ${isWeb ? 'bg-secondary/50' : 'bg-secondary'
                    } border-border`}
                >
                  <View className="flex-row items-center flex-1">
                    <Hash size={20} color="#666666" />
                    <Text className="ml-3 text-base text-foreground">
                      {selectedDept ? `${selectedDept.code} - ${selectedDept.name}` : 'Select department'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color="#666666" />
                </Pressable>

                {showDeptPicker && (
                  <View className="mt-2 border border-border rounded-xl overflow-hidden bg-secondary">
                    {departments.map((dept) => (
                      <Pressable
                        key={dept.id}
                        onPress={() => {
                          setSelectedDept(dept);
                          setShowDeptPicker(false);
                        }}
                        className={`p-4 border-b border-border ${selectedDept?.id === dept.id ? 'bg-primary/10' : ''
                          }`}
                      >
                        <Text className="font-semibold text-foreground">{dept.code}</Text>
                        <Text className="text-sm text-muted-foreground">{dept.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Password Field */}
            <View>
              <Text className="text-sm font-semibold mb-2 text-foreground">Password *</Text>
              <View className={`flex-row items-center rounded-xl px-4 py-2 sm:py-4 border ${isWeb ? 'bg-secondary/50' : 'bg-secondary'
                } border-border`}>
                <Lock size={20} color="#666666" />
                <TextInput
                  className="flex-1 ml-3 text-base text-foreground"
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
              </View>
            </View>

            {/* Confirm Password Field */}
            <View>
              <Text className="text-sm font-semibold mb-2 text-foreground">Confirm Password *</Text>
              <View className={`flex-row items-center rounded-xl px-4 py-2 sm:py-4 border ${isWeb ? 'bg-secondary/50' : 'bg-secondary'
                } border-border`}>
                <Lock size={20} color="#666666" />
                <TextInput
                  className="flex-1 ml-3 text-base text-foreground"
                  placeholder="Re-enter your password"
                  placeholderTextColor="#999"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
              </View>
            </View>

            {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              disabled={loading}
              className="mt-4"
            >
              <Text className="text-white font-semibold text-base">
                {loading ? 'Creating User...' : 'Create User'}
              </Text>
            </Button>

            {/* Back to Home Link */}
            <View className="flex-row justify-center items-center mt-4">
              <Pressable onPress={() => router.replace('/(protected)/(tabs)/home')}>
                <Text className="text-primary font-semibold">← Back to Dashboard</Text>
              </Pressable>
            </View>

            {/* Role Detection Guide */}
            <View className="mt-6 p-4 bg-muted rounded-xl">
              <Text className="font-semibold text-sm mb-2 text-foreground">📧 Email Pattern Guide:</Text>
              <Text className="text-xs text-muted-foreground mb-1">• <Text className="font-mono">admin@*</Text> → Admin</Text>
              <Text className="text-xs text-muted-foreground mb-1">• <Text className="font-mono">teacher@*</Text> → Teacher</Text>
              <Text className="text-xs text-muted-foreground">• <Text className="font-mono">student@*</Text> or <Text className="font-mono">21cse001@*</Text> → Student</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
