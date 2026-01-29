import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Switch } from 'react-native';
import { Text, Button, Card, CardHeader, CardContent, CardFooter } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { userAPI, departmentAPI } from '@/lib/api';
import { Users, Edit2, Trash2, X, Check, UserX } from 'lucide-react-native';
import { useAlertDialog } from '@/components/AlertDialog';
import type { User, Department } from '@/lib/types';

export default function ManageUsersScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const alertDialog = useAlertDialog();
  const { showAlert } = alertDialog;
  const AlertDialogComponent = alertDialog.AlertDialog;

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'student' as 'admin' | 'teacher' | 'student',
    department_id: null as number | null,
    is_active: true,
    password: ''
  });
  const [search, setSearch] = useState('');



  useEffect(() => {
    loadData();
  }, []);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, deptRes] = await Promise.all([
        userAPI.getAll(),
        departmentAPI.getAll()
      ]);
      setUsers(usersRes.data.users || []);
      setDepartments(deptRes.data.departments || []);
    } catch {
      showAlert('Error', 'Failed to load users', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'teacher': return 'bg-blue-500';
      case 'student': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDepartmentName = (deptId: number | undefined) => {
    if (!deptId) return 'None';
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Unknown';
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      department_id: user.department?.id ?? null,
      is_active: user.is_active,
      password: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setFormData({
      email: '',
      name: '',
      role: 'student',
      department_id: null,
      is_active: true,
      password: ''
    });
  };

  const handleSaveEdit = async (userId: number) => {
    if (!formData.email.trim() || !formData.name.trim()) {
      showAlert('Validation Error', 'Email and name are required', [{ text: 'OK' }]);
      return;
    }

    try {
      const updateData: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        department_id: formData.department_id,
        is_active: formData.is_active
      };

      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await userAPI.update(userId, updateData);
      showAlert('Success', 'User updated successfully', [{ text: 'OK' }]);
      handleCancelEdit();
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update user';
      showAlert('Update Failed', errorMessage, [{ text: 'OK' }]);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userAPI.update(user.id, { is_active: !user.is_active });
      loadData();
    } catch (error) {
      showAlert('Error', 'Failed to update user status', [{ text: 'OK' }]);
    }
  };

  const handleDelete = (user: User) => {
    showAlert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userAPI.delete(user.id);
              showAlert('Success', 'User deleted successfully', [{ text: 'OK' }]);
              loadData();
            } catch (error: any) {
              const errorMessage = error.response?.data?.error || 'Failed to delete user';
              showAlert('Delete Failed', errorMessage, [{ text: 'OK' }]);
            }
          }
        }
      ]
    );
  };

  // Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
            <Users size={40} color="#ffffff" />
          </View>
          <Text className="text-3xl font-bold">User Management</Text>
          <Text className="text-muted-foreground mt-1">
            {filteredUsers.length} users
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-6">
          <TextInput
            className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
            placeholder="Search by name or email..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Card View */}
        <View className="gap-4">
          {filteredUsers.length === 0 && (
            <View className="items-center justify-center py-12">
              <Users size={48} color="#ccc" />
              <Text className="text-muted-foreground mt-4">No users found</Text>
            </View>
          )}
          {filteredUsers.map((user) => {
            const isEditing = editingUserId === user.id;
            const isCurrentUser = currentUser ? user.id === currentUser.id : false;
            return (
              <Card key={user.id} className="border border-border">
                {isEditing ? (
                  <>
                    <CardContent className="gap-3">
                      {/* Name Input */}
                      <View>
                        <Text className="text-sm font-semibold mb-2">Name *</Text>
                        <TextInput
                          className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                          placeholder="John Doe"
                          value={formData.name}
                          onChangeText={(text) => setFormData({ ...formData, name: text })}
                        />
                      </View>
                      {/* Email Input */}
                      <View>
                        <Text className="text-sm font-semibold mb-2">Email *</Text>
                        <TextInput
                          className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChangeText={(text) => setFormData({ ...formData, email: text })}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                      {/* Role Selector */}
                      <View>
                        <Text className="text-sm font-semibold mb-2">Role</Text>
                        <View className="flex-row gap-2">
                          {(['admin', 'teacher', 'student'] as const).map((role) => (
                            <Button
                              key={role}
                              variant={formData.role === role ? 'default' : 'outline'}
                              onPress={() => setFormData({ ...formData, role })}
                              className="flex-1"
                            >
                              <Text className={formData.role === role ? 'text-white' : 'text-foreground'}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </Text>
                            </Button>
                          ))}
                        </View>
                      </View>
                      {/* Department Selector */}
                      {formData.role !== 'admin' && (
                        <View>
                          <Text className="text-sm font-semibold mb-2">Department</Text>
                          <View className="flex-row gap-2 flex-wrap">
                            <Button
                              variant={formData.department_id === null ? 'default' : 'outline'}
                              onPress={() => setFormData({ ...formData, department_id: null })}
                              className="mb-2"
                            >
                              <Text className={formData.department_id === null ? 'text-white text-xs' : 'text-foreground text-xs'}>
                                None
                              </Text>
                            </Button>
                            {departments.map((dept) => (
                              <Button
                                key={dept.id}
                                variant={formData.department_id === dept.id ? 'default' : 'outline'}
                                onPress={() => setFormData({ ...formData, department_id: dept.id })}
                                className="mb-2"
                              >
                                <Text className={formData.department_id === dept.id ? 'text-white text-xs' : 'text-foreground text-xs'}>
                                  {dept.code}
                                </Text>
                              </Button>
                            ))}
                          </View>
                        </View>
                      )}
                      {/* Password Input */}
                      <View>
                        <Text className="text-sm font-semibold mb-2">New Password</Text>
                        <TextInput
                          className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                          placeholder="Leave empty to keep current"
                          value={formData.password}
                          onChangeText={(text) => setFormData({ ...formData, password: text })}
                          secureTextEntry
                        />
                      </View>
                      {/* Active Status */}
                      <View className="flex-row items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
                        <Text className="font-semibold">Active Status</Text>
                        <Switch
                          value={formData.is_active}
                          onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                        />
                      </View>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onPress={() => handleSaveEdit(user.id)}
                        variant="default"
                        className="flex-1"
                      >
                        <Check size={16} color="#ffffff" />
                        <Text className="text-white font-semibold">Save</Text>
                      </Button>
                      <Button
                        onPress={handleCancelEdit}
                        variant="secondary"
                        className="flex-1"
                      >
                        <X size={16} color="#ffffff" />
                        <Text className="font-semibold">Cancel</Text>
                      </Button>
                    </CardFooter>
                  </>
                ) : (
                  <>
                    <CardHeader className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-lg font-bold">{user.name}</Text>
                          {!user.is_active && (
                            <Text className="text-xs text-destructive ml-2">Inactive</Text>
                          )}
                        </View>
                        <Text className="text-sm text-muted-foreground">{user.email}</Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                        <Text className="text-xs font-bold text-white">
                          {user.role.toUpperCase()}
                        </Text>
                      </View>
                    </CardHeader>
                    <CardContent className="mb-3">
                      <Text className="text-sm text-muted-foreground">
                        Department: {getDepartmentName(user.department?.id)}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {user.is_active ? '✅ Active' : '❌ Inactive'}
                      </Text>
                    </CardContent>
                    <CardFooter>
                      {!isCurrentUser ? (
                        <View className="flex-row gap-2">
                          <Button
                            onPress={() => handleEdit(user)}
                            variant="default"
                            className="flex-1"
                          >
                            <Edit2 size={16} color="#ffffff" />
                            <Text className="text-white font-semibold">Edit</Text>
                          </Button>
                          <Button
                            onPress={() => handleToggleStatus(user)}
                            variant={user.is_active ? 'destructive' : 'success'}
                            className="flex-1"
                          >
                            {user.is_active ? (
                              <>
                                <UserX size={16} color="#ffffff" />
                                <Text className="text-white font-semibold">Deactivate</Text>
                              </>
                            ) : (
                              <>
                                <Check size={16} color="#ffffff" />
                                <Text className="text-white font-semibold">Activate</Text>
                              </>
                            )}
                          </Button>
                          <Button
                            onPress={() => handleDelete(user)}
                            variant="destructive"
                            size="icon"
                          >
                            <Trash2 size={16} color="#ffffff" />
                          </Button>
                        </View>
                      ) : (
                        <View className="bg-blue-500/10 border border-blue-500 rounded-lg p-3 flex-1">
                          <Text className="text-blue-600 text-sm text-center">
                            This is your account
                          </Text>
                        </View>
                      )}
                    </CardFooter>
                  </>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
      <AlertDialogComponent />
    </View>
  );
}
