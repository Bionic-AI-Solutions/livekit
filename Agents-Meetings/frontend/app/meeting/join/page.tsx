'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

export default function JoinMeetingPage() {
  const [meetingId, setMeetingId] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      
      router.push(`/meeting/room/${room_name}`);
    } catch (error) {
      console.error('Failed to join meeting:', error);
      alert('Failed to join meeting');
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

