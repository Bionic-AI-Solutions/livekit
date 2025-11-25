'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useToast } from '@/components/toast/ToastProvider';
import { isAuthenticated, getCurrentUser, logout } from '@/lib/auth';

export default function JoinMeetingPage() {
  const [meetingId, setMeetingId] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  // Check authentication and user status
  useEffect(() => {
    async function checkAuth() {
      if (!isAuthenticated()) {
        toast.error('Please log in to join a meeting');
        router.push('/login');
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user || !user.is_active) {
          toast.error('Your account is pending approval. Please contact an administrator.');
          logout();
          router.push('/login');
          return;
        }
        setAuthLoading(false);
      } catch (error) {
        toast.error('Authentication failed. Please log in again.');
        logout();
        router.push('/login');
      }
    }
    checkAuth();
  }, [router, toast]);

  // Pre-fill meeting ID from URL parameter or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // First check URL parameter
      const params = new URLSearchParams(window.location.search);
      const meetingIdParam = params.get('meetingId');
      if (meetingIdParam) {
        setMeetingId(meetingIdParam);
        // Also preserve in localStorage
        localStorage.setItem('meeting_id', meetingIdParam);
      } else {
        // Fallback to localStorage if no URL param
        const storedMeetingId = localStorage.getItem('meeting_id');
        if (storedMeetingId) {
          setMeetingId(storedMeetingId);
          // Update URL to include meeting ID
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('meetingId', storedMeetingId);
          window.history.replaceState({}, '', newUrl.toString());
        }
      }
      
      // Also check for stored language preference
      const storedLanguage = localStorage.getItem('language');
      if (storedLanguage) {
        setLanguage(storedLanguage);
      }
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiClient.post('/rooms/token', {
        meeting_id: meetingId,
        language: language,
      });
      
      const { token, room_name, ws_url } = response.data;
      // Store token and redirect to room
      localStorage.setItem('room_token', token);
      localStorage.setItem('room_name', room_name);
      localStorage.setItem('ws_url', ws_url);
      localStorage.setItem('language', language);
      localStorage.setItem('meeting_id', meetingId);
      
      router.push(`/meeting/room/${room_name}`);
    } catch (error: any) {
      console.error('Failed to join meeting:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to join meeting';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-8 max-w-md">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-md">
      <h1 className="text-3xl font-bold mb-8">Join Meeting</h1>
      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="block mb-2">Meeting ID</label>
          <input
            type="text"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="en">English</option>
            <option value="hi">Hindi (हिंदी)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="bn">Bengali (বাংলা)</option>
            <option value="mr">Marathi (मराठी)</option>
            <option value="gu">Gujarati (ગુજરાતી)</option>
            <option value="kn">Kannada (ಕನ್ನಡ)</option>
            <option value="ml">Malayalam (മലയാളം)</option>
            <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
            <option value="or">Odia (ଓଡ଼ିଆ)</option>
            <option value="as">Assamese (অসমীয়া)</option>
            <option value="ur">Urdu (اردو)</option>
            <option value="ne">Nepali (नेपाली)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Meeting'}
        </button>
      </form>
    </div>
  );
}

