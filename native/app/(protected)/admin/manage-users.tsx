import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Platform, TextInput, Switch } from 'react-native';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/stores/authStore';
import { userAPI, departmentAPI } from '@/lib/api';
import { Users, Edit2, Trash2, X, Check, UserX, UserCheck, Save } from 'lucide-react-native';
import { useAlertDialog } from '@/components/AlertDialog';
import type { User, Department } from '@/lib/types';

export default function ManageUsersScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const alertDialog = useAlertDialog();
  const { showAlert } = alertDialog;
  const AlertDialogComponent = alertDialog.AlertDialog;
  const isWeb = Platform.OS === 'web';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptRes] = await Promise.all([
        userAPI.getAll(),
        departmentAPI.getAll()
      ]);
      setUsers(usersRes.data.users || []);
      setDepartments(deptRes.data.departments || []);
    } catch (error) {
      showAlert('Error', 'Failed to load users', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
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

  const handleToggleStatus = async (user: User) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    showAlert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: user.is_active ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await userAPI.toggleStatus(user.id);
              showAlert('Success', `User ${action}d successfully`, [{ text: 'OK' }]);
              loadData();
            } catch (error: any) {
              const errorMessage = error.response?.data?.error || `Failed to ${action} user`;
              showAlert('Status Update Failed', errorMessage, [{ text: 'OK' }]);
            }
          }
        }
      ]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'teacher': return 'bg-blue-500';
      case 'student': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDepartmentName = (deptId: number | null | undefined) => {
    if (!deptId) return '-';
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.code : '-';
  };

  if (currentUser?.role !== 'admin') {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <UserX size={48} color="#ef4444" />
        <Text className="text-center text-muted-foreground mt-4">
          Only administrators can access user management
        </Text>
        <AlertDialogComponent />
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading users...</Text>
        <AlertDialogComponent />
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
            {users.length} total users
          </Text>
        </View>

        {/* Users Table - Desktop/Web */}
        {isWeb ? (
          <View className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Table Header */}
            <View className="flex-row bg-muted/50 border-b border-border px-4 py-3">
              <Text className="w-[200px] font-bold text-sm">Name</Text>
              <Text className="w-[250px] font-bold text-sm">Email</Text>
              <Text className="w-[100px] font-bold text-sm text-center">Role</Text>
              <Text className="w-[80px] font-bold text-sm text-center">Dept</Text>
              <Text className="w-[80px] font-bold text-sm text-center">Status</Text>
              <Text className="w-[80px] font-bold text-sm text-center">Edit</Text>
              <Text className="w-[120px] font-bold text-sm text-center">Activate</Text>
              <Text className="w-[80px] font-bold text-sm text-center">Delete</Text>
            </View>

            {/* Table Rows */}
            <ScrollView style={{ maxHeight: 600 }}>
              {users.map((user, index) => {
                const isEditing = editingUserId === user.id;
                const isCurrentUser = user.id === currentUser.id;

                return (
                  <View
                    key={user.id}
                    className={`border-b border-border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      } ${isEditing ? 'bg-blue-500/10' : ''}`}
                  >
                    {isEditing ? (
                      // Edit Mode
                      <View className="p-4 gap-3">
                        {/* Name Input */}
                        <View className="flex-row items-center gap-2">
                          <Text className="w-20 text-sm font-semibold">Name:</Text>
                          <TextInput
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                            placeholder="John Doe"
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                          />
                        </View>

                        {/* Email Input */}
                        <View className="flex-row items-center gap-2">
                          <Text className="w-20 text-sm font-semibold">Email:</Text>
                          <TextInput
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>

                        {/* Role Selector */}
                        <View className="flex-row items-center gap-2">
                          <Text className="w-20 text-sm font-semibold">Role:</Text>
                          <View className="flex-row gap-2">
                            {(['admin', 'teacher', 'student'] as const).map((role) => (
                              <Pressable
                                key={role}
                                onPress={() => setFormData({ ...formData, role })}
                                className={`px-4 py-2 rounded-lg border ${formData.role === role
                                    ? 'bg-primary border-primary'
                                    : 'bg-background border-border'
                                  }`}
                              >
                                <Text className={`text-xs font-semibold ${formData.role === role ? 'text-white' : 'text-foreground'
                                  }`}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>

                        {/* Department Selector */}
                        {formData.role !== 'admin' && (
                          <View className="flex-row items-center gap-2">
                            <Text className="w-20 text-sm font-semibold">Dept:</Text>
                            <View className="flex-row gap-2 flex-wrap">
                              <Pressable
                                onPress={() => setFormData({ ...formData, department_id: null })}
                                className={`px-3 py-2 rounded-lg border ${formData.department_id === null
                                    ? 'bg-primary border-primary'
                                    : 'bg-background border-border'
                                  }`}
                              >
                                <Text className={formData.department_id === null ? 'text-white text-xs' : 'text-foreground text-xs'}>
                                  None
                                </Text>
                              </Pressable>
                              {departments.map((dept) => (
                                <Pressable
                                  key={dept.id}
                                  onPress={() => setFormData({ ...formData, department_id: dept.id })}
                                  className={`px-3 py-2 rounded-lg border ${formData.department_id === dept.id
                                      ? 'bg-primary border-primary'
                                      : 'bg-background border-border'
                                    }`}
                                >
                                  <Text className={formData.department_id === dept.id ? 'text-white text-xs' : 'text-foreground text-xs'}>
                                    {dept.code}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Password Input */}
                        <View className="flex-row items-center gap-2">
                          <Text className="w-20 text-sm font-semibold">Password:</Text>
                          <TextInput
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                            placeholder="Leave empty to keep current"
                            value={formData.password}
                            onChangeText={(text) => setFormData({ ...formData, password: text })}
                            secureTextEntry
                          />
                        </View>

                        {/* Active Status */}
                        <View className="flex-row items-center gap-2">
                          <Text className="w-20 text-sm font-semibold">Active:</Text>
                          <Switch
                            value={formData.is_active}
                            onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                          />
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row gap-2 mt-2">
                          <Pressable
                            onPress={() => handleSaveEdit(user.id)}
                            className="flex-1 bg-green-500 rounded-lg py-3 flex-row items-center justify-center gap-2"
                          >
                            <Check size={16} color="#ffffff" />
                            <Text className="text-white font-semibold">Save</Text>
                          </Pressable>
                          <Pressable
                            onPress={handleCancelEdit}
                            className="flex-1 bg-gray-500 rounded-lg py-3 flex-row items-center justify-center gap-2"
                          >
                            <X size={16} color="#ffffff" />
                            <Text className="text-white font-semibold">Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      // View Mode
                      <View className="flex-row items-center px-4 py-3">
                        {/* Name */}
                        <View className="w-[200px]">
                          <Text className="font-semibold text-foreground">{user.name}</Text>
                          {!user.is_active && (
                            <Text className="text-xs text-red-600">Inactive</Text>
                          )}
                        </View>

                        {/* Email */}
                        <Text className="w-[250px] text-sm text-muted-foreground">{user.email}</Text>

                        {/* Role Badge */}
                        <View className="w-[100px] items-center">
                          <View className={`px-3 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                            <Text className="text-xs font-bold text-white">
                              {user.role.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        {/* Department */}
                        <Text className="w-[80px] text-sm text-center text-muted-foreground">
                          {getDepartmentName(user.department?.id)}
                        </Text>

                        {/* Status */}
                        <View className="w-[80px] items-center">
                          {user.is_active ? (
                            <View className="bg-green-500/20 px-2 py-1 rounded">
                              <Text className="text-xs text-green-600 font-semibold">Active</Text>
                            </View>
                          ) : (
                            <View className="bg-red-500/20 px-2 py-1 rounded">
                              <Text className="text-xs text-red-600 font-semibold">Inactive</Text>
                            </View>
                          )}
                        </View>

                        {/* Actions */}
                        <View className="w-[80px] items-center">
                          {!isCurrentUser ? (
                            <Pressable
                              onPress={() => handleEdit(user)}
                              className="bg-blue-500 rounded-lg px-3 py-2 flex-row items-center gap-1"
                            >
                              <Edit2 size={14} color="#ffffff" />
                              <Text className="text-white text-xs font-semibold">Edit</Text>
                            </Pressable>
                          ) : (
                            <View className="bg-blue-500/10 border border-blue-500 rounded px-2 py-1">
                              <Text className="text-blue-600 text-xs">You</Text>
                            </View>
                          )}
                        </View>

                        <View className="w-[120px] items-center">
                          {!isCurrentUser && (
                            <Pressable
                              onPress={() => handleToggleStatus(user)}
                              className={`rounded-lg px-3 py-2 flex-row items-center gap-1 ${user.is_active ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                            >
                              {user.is_active ? (
                                <>
                                  <UserX size={14} color="#ffffff" />
                                  <Text className="text-white text-xs font-semibold">Deactivate</Text>
                                </>
                              ) : (
                                <>
                                  <UserCheck size={14} color="#ffffff" />
                                  <Text className="text-white text-xs font-semibold">Activate</Text>
                                </>
                              )}
                            </Pressable>
                          )}
                        </View>

                        <View className="w-[80px] items-center">
                          {!isCurrentUser && (
                            <Pressable
                              onPress={() => handleDelete(user)}
                              className="bg-red-500 rounded-lg px-3 py-2 flex-row items-center gap-1"
                            >
                              <Trash2 size={14} color="#ffffff" />
                              <Text className="text-white text-xs font-semibold">Delete</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Empty State */}
            {users.length === 0 && (
              <View className="items-center justify-center py-12">
                <Users size={48} color="#ccc" />
                <Text className="text-muted-foreground mt-4">No users found</Text>
              </View>
            )}
          </View>
        ) : (
          // Mobile Card View
          <View className="gap-3">
            {users.map((user) => {
              const isEditing = editingUserId === user.id;
              const isCurrentUser = user.id === currentUser.id;

              return (
                <View
                  key={user.id}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  {isEditing ? (
                    // Edit Mode
                    <View className="gap-3">
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
                            <Pressable
                              key={role}
                              onPress={() => setFormData({ ...formData, role })}
                              className={`flex-1 py-2 rounded-lg border ${formData.role === role
                                  ? 'bg-primary border-primary'
                                  : 'bg-background border-border'
                                }`}
                            >
                              <Text className={`text-xs font-semibold text-center ${formData.role === role ? 'text-white' : 'text-foreground'
                                }`}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      {/* Department Selector */}
                      {formData.role !== 'admin' && (
                        <View>
                          <Text className="text-sm font-semibold mb-2">Department</Text>
                          <View className="flex-row gap-2 flex-wrap">
                            <Pressable
                              onPress={() => setFormData({ ...formData, department_id: null })}
                              className={`px-3 py-2 rounded-lg border ${formData.department_id === null
                                  ? 'bg-primary border-primary'
                                  : 'bg-background border-border'
                                }`}
                            >
                              <Text className={formData.department_id === null ? 'text-white text-xs' : 'text-foreground text-xs'}>
                                None
                              </Text>
                            </Pressable>
                            {departments.map((dept) => (
                              <Pressable
                                key={dept.id}
                                onPress={() => setFormData({ ...formData, department_id: dept.id })}
                                className={`px-3 py-2 rounded-lg border ${formData.department_id === dept.id
                                    ? 'bg-primary border-primary'
                                    : 'bg-background border-border'
                                  }`}
                              >
                                <Text className={formData.department_id === dept.id ? 'text-white text-xs' : 'text-foreground text-xs'}>
                                  {dept.code}
                                </Text>
                              </Pressable>
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

                      {/* Action Buttons */}
                      <View className="flex-row gap-2 mt-2">
                        <Pressable
                          onPress={() => handleSaveEdit(user.id)}
                          className="flex-1 bg-green-500 rounded-lg py-3 flex-row items-center justify-center gap-2"
                        >
                          <Check size={16} color="#ffffff" />
                          <Text className="text-white font-semibold">Save</Text>
                        </Pressable>
                        <Pressable
                          onPress={handleCancelEdit}
                          className="flex-1 bg-gray-500 rounded-lg py-3 flex-row items-center justify-center gap-2"
                        >
                          <X size={16} color="#ffffff" />
                          <Text className="text-white font-semibold">Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    // View Mode
                    <>
                      {/* User Header */}
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 mb-1">
                            <Text className="text-lg font-bold">{user.name}</Text>
                            {!user.is_active && (
                              <View className="bg-red-500/20 px-2 py-1 rounded">
                                <Text className="text-xs text-red-600 font-semibold">Inactive</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-sm text-muted-foreground">{user.email}</Text>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                          <Text className="text-xs font-bold text-white">
                            {user.role.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* User Details */}
                      <View className="mb-3">
                        <Text className="text-sm text-muted-foreground">
                          Department: {getDepartmentName(user.department?.id)}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          {user.is_active ? '✅ Active' : '❌ Inactive'}
                        </Text>
                      </View>

                      {/* Action Buttons */}
                      {!isCurrentUser ? (
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => handleEdit(user)}
                            className="flex-1 bg-blue-500 rounded-lg py-3 flex-row items-center justify-center gap-2"
                          >
                            <Edit2 size={16} color="#ffffff" />
                            <Text className="text-white font-semibold">Edit</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleToggleStatus(user)}
                            className={`flex-1 rounded-lg py-3 flex-row items-center justify-center gap-2 ${user.is_active ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                          >
                            {user.is_active ? (
                              <>
                                <UserX size={16} color="#ffffff" />
                                <Text className="text-white font-semibold text-xs">Deactivate</Text>
                              </>
                            ) : (
                              <>
                                <UserCheck size={16} color="#ffffff" />
                                <Text className="text-white font-semibold text-xs">Activate</Text>
                              </>
                            )}
                          </Pressable>

                          <Pressable
                            onPress={() => handleDelete(user)}
                            className="bg-red-500 rounded-lg px-4 py-3 items-center justify-center"
                          >
                            <Trash2 size={16} color="#ffffff" />
                          </Pressable>
                        </View>
                      ) : (
                        <View className="bg-blue-500/10 border border-blue-500 rounded-lg p-3">
                          <Text className="text-blue-600 text-sm text-center">
                            This is your account
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })}

            {users.length === 0 && (
              <View className="items-center justify-center py-12">
                <Users size={48} color="#ccc" />
                <Text className="text-muted-foreground mt-4">No users found</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <AlertDialogComponent />
    </View>
  );
}
