'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';

interface DashboardStats {
  total_users: number;
  total_meetings: number;
  active_meetings: number;
  total_participants: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await apiClient.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
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

