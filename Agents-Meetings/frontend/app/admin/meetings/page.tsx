'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import Link from 'next/link';

interface Meeting {
  id: string;
  title: string;
  meeting_type: string;
  status: string;
  room_name: string;
  created_at: string;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const response = await apiClient.get('/meetings');
        setMeetings(response.data);
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meetings</h1>
        <Link href="/admin/meetings/new" className="px-4 py-2 bg-blue-500 text-white rounded">
          Create Meeting
        </Link>
      </div>
      <div className="grid gap-4">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold">{meeting.title}</h2>
            <p className="text-gray-600">Type: {meeting.meeting_type}</p>
            <p className="text-gray-600">Status: {meeting.status}</p>
            <p className="text-gray-600">Room: {meeting.room_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

