'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { isAuthenticated, getCurrentUser, logout } from '@/lib/auth';
import Link from 'next/link';
import { useToast } from '@/components/toast/ToastProvider';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  language_preference: string;
  is_active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    async function checkAuth() {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
          toast.error('Access denied. Admin privileges required.');
          router.push('/admin/dashboard');
          return;
        }
        setAuthLoading(false);
        fetchUsers();
      } catch (error) {
        logout();
        router.push('/login');
      }
    }
    checkAuth();
  }, [router, toast]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/');
      setUsers(response.data);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      if (error.response?.status === 401) {
        logout();
        router.push('/login');
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId: string) {
    try {
      await apiClient.post(`/users/${userId}/approve`);
      toast.success('User approved successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to approve user:', error);
      toast.error(error.response?.data?.detail || 'Failed to approve user');
    }
  }

  async function handleReject(userId: string) {
    if (!confirm('Are you sure you want to reject this user?')) {
      return;
    }

    try {
      await apiClient.post(`/users/${userId}/reject`);
      toast.success('User rejected successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to reject user:', error);
      toast.error(error.response?.data?.detail || 'Failed to reject user');
    }
  }

  async function handleToggleActive(userId: string, currentStatus: boolean) {
    try {
      await apiClient.put(`/users/${userId}`, {
        is_active: !currentStatus,
      });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  }

  const filteredUsers = users.filter((user) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !user.is_active;
    if (filter === 'active') return user.is_active;
    if (filter === 'inactive') return !user.is_active;
    return true;
  });

  const pendingCount = users.filter((u) => !u.is_active).length;
  const activeCount = users.filter((u) => u.is_active).length;

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-gray-600">Manage user accounts and approvals</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-2xl font-bold">{users.length}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow border-l-4 border-yellow-400">
          <div className="text-sm text-gray-600">Pending Approval</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border-l-4 border-green-400">
          <div className="text-sm text-gray-600">Active Users</div>
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border-l-4 border-blue-400">
          <div className="text-sm text-gray-600">Filtered</div>
          <div className="text-2xl font-bold text-blue-600">{filteredUsers.length}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium ${
            filter === 'all'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 font-medium ${
            filter === 'pending'
              ? 'border-b-2 border-yellow-500 text-yellow-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 font-medium ${
            filter === 'active'
              ? 'border-b-2 border-green-500 text-green-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 font-medium ${
            filter === 'inactive'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Inactive ({pendingCount})
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.language_preference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {!user.is_active ? (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

