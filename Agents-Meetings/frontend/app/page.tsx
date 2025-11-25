'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser, logout } from '@/lib/auth';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      if (isAuthenticated()) {
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid, clear it
          logout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-lg">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Multilingual Meeting Platform</h1>
        <p className="text-lg mb-4">Welcome to the platform</p>
        
        {user ? (
          <div className="mb-6">
            <p className="text-lg mb-2">Welcome, {user.full_name}!</p>
            <p className="text-sm text-gray-600 mb-4">Role: {user.role}</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">Please sign in to access the platform</p>
            <a href="/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2">
              Sign In
            </a>
            <a href="/register" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Register
            </a>
          </div>
        )}

        <div className="flex gap-4 flex-wrap">
          {user && (
            <>
              {user.role === 'admin' && (
                <a href="/admin/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Admin Dashboard
                </a>
              )}
              <a href="/meeting/join" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Join Meeting
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

