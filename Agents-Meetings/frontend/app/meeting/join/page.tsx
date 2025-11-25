'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useToast } from '@/components/toast/ToastProvider';

export default function JoinMeetingPage() {
  const [meetingId, setMeetingId] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

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
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
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

