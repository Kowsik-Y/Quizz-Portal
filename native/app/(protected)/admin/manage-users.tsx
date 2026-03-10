import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Switch, Pressable, ActivityIndicator } from 'react-native';
import { Text, Button, Card, CardHeader, CardContent, CardFooter } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { userAPI, departmentAPI } from '@/lib/api';
import {
  Users, Edit2, Trash2, X, Check, UserX, Search, Mail, Building2,
  ShieldCheck, GraduationCap, BookOpen, Crown, ChevronDown, ChevronUp
} from 'lucide-react-native';
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
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'student' as 'admin' | 'teacher' | 'student',
    department_id: null as number | null,
    is_active: true,
    password: ''
  });
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'admin' | 'teacher' | 'student'>('all');

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

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: 'bg-red-500/15', text: 'text-red-500', border: 'border-red-500/30', icon: Crown, color: '#ef4444' };
      case 'teacher':
        return { bg: 'bg-blue-500/15', text: 'text-blue-500', border: 'border-blue-500/30', icon: BookOpen, color: '#3b82f6' };
      case 'student':
        return { bg: 'bg-emerald-500/15', text: 'text-emerald-500', border: 'border-emerald-500/30', icon: GraduationCap, color: '#10b981' };
      default:
        return { bg: 'bg-gray-500/15', text: 'text-gray-500', border: 'border-gray-500/30', icon: Users, color: '#6b7280' };
    }
  };

  const getDepartmentName = (deptId: number | undefined) => {
    if (!deptId) return 'No Department';
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Unknown';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setExpandedUserId(user.id);
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

  // Filter users by search and role
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = activeFilter === 'all' || u.role === activeFilter;
    return matchesSearch && matchesRole;
  });

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    students: users.filter(u => u.role === 'student').length,
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center gap-3">
        <ActivityIndicator size="large" />
        <Text className="text-muted-foreground">Loading users...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* ── Header ── */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-primary/10 border-2 border-primary/30 rounded-2xl items-center justify-center mb-3">
            <Users size={32} color="#6366f1" />
          </View>
          <Text className="text-2xl font-bold">User Management</Text>
          <Text className="text-muted-foreground text-sm mt-1">
            Manage all users in your organization
          </Text>
        </View>

        {/* ── Stats Row ── */}
        <View className="flex-row gap-3 mb-5">
          {[
            { label: 'Total', value: stats.total, color: '#6366f1', bg: 'bg-primary/10' },
            { label: 'Admin', value: stats.admins, color: '#ef4444', bg: 'bg-red-500/10' },
            { label: 'Teacher', value: stats.teachers, color: '#3b82f6', bg: 'bg-blue-500/10' },
            { label: 'Student', value: stats.students, color: '#10b981', bg: 'bg-emerald-500/10' },
          ].map((stat) => (
            <View
              key={stat.label}
              className={`flex-1 ${stat.bg} rounded-xl py-3 items-center border border-border/50`}
            >
              <Text style={{ color: stat.color, fontSize: 20, fontWeight: '700' }}>{stat.value}</Text>
              <Text className="text-muted-foreground text-xs mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Search Bar ── */}
        <View className="mb-4">
          <View className="flex-row items-center bg-card border border-border rounded-xl px-3 gap-2">
            <Search size={18} color="#9ca3af" />
            <TextInput
              className="flex-1 py-3 text-foreground"
              placeholder="Search by name or email..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <X size={18} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Role Filter Chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          <View className="flex-row gap-2">
            {(['all', 'admin', 'teacher', 'student'] as const).map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full border ${isActive
                      ? 'bg-primary border-primary'
                      : 'bg-card border-border'
                    }`}
                >
                  <Text
                    className={`text-sm font-semibold capitalize ${isActive ? 'text-white' : 'text-muted-foreground'
                      }`}
                  >
                    {filter === 'all' ? `All (${stats.total})` : `${filter} (${stats[`${filter}s` as keyof typeof stats]})`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* ── User Cards ── */}
        <View className="gap-3">
          {filteredUsers.length === 0 && (
            <View className="items-center justify-center py-16 bg-card border border-border rounded-2xl">
              <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-3">
                <Users size={32} color="#9ca3af" />
              </View>
              <Text className="text-muted-foreground font-semibold">No users found</Text>
              <Text className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters</Text>
            </View>
          )}

          {filteredUsers.map((user) => {
            const isEditing = editingUserId === user.id;
            const isCurrentUser = currentUser ? user.id === currentUser.id : false;
            const isExpanded = expandedUserId === user.id;
            const roleConfig = getRoleConfig(user.role);
            const RoleIcon = roleConfig.icon;

            return (
              <Card key={user.id} className="border border-border overflow-hidden rounded-2xl">
                {isEditing ? (
                  /* ──────────── EDIT MODE ──────────── */
                  <>
                    <CardHeader className="bg-primary/5 border-b border-border pb-3">
                      <View className="flex-row items-center gap-2">
                        <Edit2 size={16} color="#6366f1" />
                        <Text className="text-base font-bold text-primary">Editing User</Text>
                      </View>
                    </CardHeader>
                    <CardContent className="gap-4 pt-4">
                      {/* Name */}
                      <View>
                        <Text className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Name *</Text>
                        <TextInput
                          className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                          placeholder="John Doe"
                          placeholderTextColor="#9ca3af"
                          value={formData.name}
                          onChangeText={(text) => setFormData({ ...formData, name: text })}
                        />
                      </View>
                      {/* Email */}
                      <View>
                        <Text className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Email *</Text>
                        <TextInput
                          className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                          placeholder="email@example.com"
                          placeholderTextColor="#9ca3af"
                          value={formData.email}
                          onChangeText={(text) => setFormData({ ...formData, email: text })}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                      {/* Role */}
                      <View>
                        <Text className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Role</Text>
                        <View className="flex-row gap-2">
                          {(['admin', 'teacher', 'student'] as const).map((role) => {
                            const config = getRoleConfig(role);
                            const isSelected = formData.role === role;
                            return (
                              <Pressable
                                key={role}
                                onPress={() => setFormData({ ...formData, role })}
                                className={`flex-1 items-center py-3 rounded-xl border ${isSelected
                                    ? `${config.bg} ${config.border}`
                                    : 'bg-background border-border'
                                  }`}
                              >
                                <Text
                                  className={`text-sm font-semibold capitalize ${isSelected ? config.text : 'text-muted-foreground'
                                    }`}
                                >
                                  {role}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                      {/* Department */}
                      {formData.role !== 'admin' && (
                        <View>
                          <Text className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Department</Text>
                          <View className="flex-row gap-2 flex-wrap">
                            <Pressable
                              onPress={() => setFormData({ ...formData, department_id: null })}
                              className={`px-4 py-2 rounded-xl border mb-1 ${formData.department_id === null
                                  ? 'bg-primary/10 border-primary/30'
                                  : 'bg-background border-border'
                                }`}
                            >
                              <Text className={`text-xs font-semibold ${formData.department_id === null ? 'text-primary' : 'text-muted-foreground'}`}>
                                None
                              </Text>
                            </Pressable>
                            {departments.map((dept) => (
                              <Pressable
                                key={dept.id}
                                onPress={() => setFormData({ ...formData, department_id: dept.id })}
                                className={`px-4 py-2 rounded-xl border mb-1 ${formData.department_id === dept.id
                                    ? 'bg-primary/10 border-primary/30'
                                    : 'bg-background border-border'
                                  }`}
                              >
                                <Text className={`text-xs font-semibold ${formData.department_id === dept.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {dept.code}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      )}
                      {/* Password */}
                      <View>
                        <Text className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">New Password</Text>
                        <TextInput
                          className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                          placeholder="Leave empty to keep current"
                          placeholderTextColor="#9ca3af"
                          value={formData.password}
                          onChangeText={(text) => setFormData({ ...formData, password: text })}
                          secureTextEntry
                        />
                      </View>
                      {/* Active Status */}
                      <View className="flex-row items-center justify-between bg-background border border-border rounded-xl px-4 py-3">
                        <View className="flex-row items-center gap-2">
                          <ShieldCheck size={16} color="#10b981" />
                          <Text className="font-semibold text-sm">Active Status</Text>
                        </View>
                        <Switch
                          value={formData.is_active}
                          onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                          trackColor={{ false: '#374151', true: '#6366f1' }}
                        />
                      </View>
                    </CardContent>
                    <CardFooter className="gap-2 pt-3 border-t border-border">
                      <Button
                        onPress={() => handleSaveEdit(user.id)}
                        variant="default"
                        className="flex-1"
                      >
                        <Check size={16} color="#ffffff" />
                        <Text className="text-white font-semibold ml-1">Save Changes</Text>
                      </Button>
                      <Button
                        onPress={handleCancelEdit}
                        variant="secondary"
                        className="flex-1"
                      >
                        <X size={16} color="#9ca3af" />
                        <Text className="font-semibold text-muted-foreground ml-1">Cancel</Text>
                      </Button>
                    </CardFooter>
                  </>
                ) : (
                  /* ──────────── VIEW MODE ──────────── */
                  <>
                    <Pressable onPress={() => setExpandedUserId(isExpanded ? null : user.id)}>
                      <CardHeader className="pb-2">
                        <View className="flex-row items-center gap-3">
                          {/* Avatar */}
                          <View
                            className="w-12 h-12 rounded-full items-center justify-center"
                            style={{ backgroundColor: roleConfig.color + '20' }}
                          >
                            <Text style={{ color: roleConfig.color, fontSize: 16, fontWeight: '700' }}>
                              {getInitials(user.name)}
                            </Text>
                          </View>

                          {/* Info */}
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text className="text-base font-bold" numberOfLines={1}>{user.name}</Text>
                              {!user.is_active && (
                                <View className="bg-red-500/15 px-2 py-0.5 rounded-md">
                                  <Text className="text-red-500 text-[10px] font-bold">INACTIVE</Text>
                                </View>
                              )}
                              {isCurrentUser && (
                                <View className="bg-blue-500/15 px-2 py-0.5 rounded-md">
                                  <Text className="text-blue-500 text-[10px] font-bold">YOU</Text>
                                </View>
                              )}
                            </View>
                            <View className="flex-row items-center gap-1 mt-0.5">
                              <Mail size={12} color="#9ca3af" />
                              <Text className="text-sm text-muted-foreground" numberOfLines={1}>{user.email}</Text>
                            </View>
                          </View>

                          {/* Role Badge */}
                          <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl ${roleConfig.bg} border ${roleConfig.border}`}>
                            <RoleIcon size={12} color={roleConfig.color} />
                            <Text className={`text-xs font-bold capitalize ${roleConfig.text}`}>
                              {user.role}
                            </Text>
                          </View>
                        </View>
                      </CardHeader>
                    </Pressable>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <>
                        <CardContent className="pt-2 pb-3 gap-2">
                          {/* Department & Status Info */}
                          <View className="flex-row gap-2">
                            <View className="flex-1 flex-row items-center gap-2 bg-background border border-border rounded-xl px-3 py-2.5">
                              <Building2 size={14} color="#9ca3af" />
                              <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                                {getDepartmentName(user.department?.id)}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-2 bg-background border border-border rounded-xl px-3 py-2.5">
                              <View
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: user.is_active ? '#10b981' : '#ef4444' }}
                              />
                              <Text className="text-sm text-muted-foreground">
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Text>
                            </View>
                          </View>
                        </CardContent>

                        <CardFooter className="border-t border-border pt-3">
                          {!isCurrentUser ? (
                            <View className="flex-row gap-2 flex-1">
                              <Button
                                onPress={() => handleEdit(user)}
                                variant="default"
                                className="flex-1"
                              >
                                <Edit2 size={14} color="#ffffff" />
                                <Text className="text-white font-semibold text-sm ml-1">Edit</Text>
                              </Button>
                              <Button
                                onPress={() => handleToggleStatus(user)}
                                variant={user.is_active ? 'destructive' : 'default'}
                                className="flex-1"
                              >
                                {user.is_active ? (
                                  <>
                                    <UserX size={14} color="#ffffff" />
                                    <Text className="text-white font-semibold text-sm ml-1">Deactivate</Text>
                                  </>
                                ) : (
                                  <>
                                    <Check size={14} color="#ffffff" />
                                    <Text className="text-white font-semibold text-sm ml-1">Activate</Text>
                                  </>
                                )}
                              </Button>
                              <Pressable
                                onPress={() => handleDelete(user)}
                                className="w-11 h-11 bg-red-500/10 border border-red-500/30 rounded-xl items-center justify-center"
                              >
                                <Trash2 size={16} color="#ef4444" />
                              </Pressable>
                            </View>
                          ) : (
                            <View className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex-1 flex-row items-center justify-center gap-2">
                              <ShieldCheck size={16} color="#6366f1" />
                              <Text className="text-primary text-sm font-semibold">
                                This is your account
                              </Text>
                            </View>
                          )}
                        </CardFooter>
                      </>
                    )}
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
