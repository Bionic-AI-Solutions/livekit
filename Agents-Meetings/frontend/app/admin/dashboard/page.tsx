'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { isAuthenticated, getCurrentUser, logout } from '@/lib/auth';

interface DashboardStats {
  total_users: number;
  total_meetings: number;
  active_meetings: number;
  total_participants: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      try {
        const user = await getCurrentUser();
        if (user.role !== 'admin') {
          router.push('/');
          return;
        }
      } catch (error) {
        logout();
        router.push('/login');
        return;
      }
      
      setAuthLoading(false);
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    
    async function fetchStats() {
      try {
        const response = await apiClient.get('/admin/dashboard');
        setStats(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          logout();
          router.push('/login');
        } else {
          console.error('Failed to fetch dashboard stats:', error);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-4">
          <a href="/admin/users" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Manage Users
          </a>
          <a href="/admin/meetings" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Manage Meetings
          </a>
        </div>
      </div>
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold">Total Users</h2>
            <p className="text-3xl mt-2">{stats.total_users}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold">Total Meetings</h2>
            <p className="text-3xl mt-2">{stats.total_meetings}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold">Active Meetings</h2>
            <p className="text-3xl mt-2">{stats.active_meetings}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold">Total Participants</h2>
            <p className="text-3xl mt-2">{stats.total_participants}</p>
          </div>
        </div>
      )}
    </div>
  );
}

