'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { isAuthenticated, getCurrentUser, logout } from '@/lib/auth';
import Link from 'next/link';
import { useToast } from '@/components/toast/ToastProvider';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  meeting_type: string;
  status: string;
  room_name: string;
  host_type?: string;
  translation_enabled: boolean;
  supported_languages: string[];
  created_at: string;
}

interface Participant {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  language_preference: string;
  status: string;
  joined_at?: string;
  left_at?: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [participantLanguage, setParticipantLanguage] = useState('en');
  const [editingMeeting, setEditingMeeting] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Meeting>>({});
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
    
    async function fetchData() {
      try {
        const [meetingsRes, usersRes] = await Promise.all([
          apiClient.get('/meetings/'),
          apiClient.get('/users/')
        ]);
        setMeetings(meetingsRes.data);
        setUsers(usersRes.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          logout();
          router.push('/login');
        } else {
          console.error('Failed to fetch data:', error);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [authLoading, router]);

  useEffect(() => {
    if (selectedMeeting) {
      fetchParticipants(selectedMeeting);
      // Poll for participant count updates every 5 seconds
      const interval = setInterval(() => {
        fetchParticipants(selectedMeeting);
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setParticipants([]);
    }
  }, [selectedMeeting]);

  async function fetchParticipants(meetingId: string) {
    try {
      const [participantsRes, roomRes] = await Promise.all([
        apiClient.get(`/participants/meeting/${meetingId}/participants`).catch(() => ({ data: [] })),
        apiClient.get(`/rooms/meeting/${meetingId}`).catch(() => ({ data: { num_participants: 0 } }))
      ]);
      setParticipants(participantsRes.data || []);
      // Update meeting with actual participant count from LiveKit
      const numParticipants = roomRes.data?.num_participants || 0;
      if (numParticipants > 0) {
        // Update the meeting in the list to show correct count
        setMeetings(prev => prev.map(m => 
          m.id === meetingId ? { ...m, _livekit_participants: numParticipants } : m
        ));
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      setParticipants([]);
    }
  }

  async function handleAddParticipant(meetingId: string) {
    if (!selectedUserId) {
      toast.warning('Please select a user');
      return;
    }

    console.log('Adding participant:', { meetingId, selectedUserId, participantLanguage });
    
    try {
      const response = await apiClient.post(`/participants/meeting/${meetingId}/participants`, {
        user_id: selectedUserId,
        language_preference: participantLanguage
      });
      console.log('Participant added successfully:', response.data);
      
      // Refresh participants list
      await fetchParticipants(meetingId);
      // Also refresh meetings list to ensure data is up to date
      const meetingsRes = await apiClient.get('/meetings/');
      setMeetings(meetingsRes.data);
      setShowAddParticipant(false);
      setSelectedUserId('');
      setParticipantLanguage('en');
      toast.success('Participant added successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to add participant';
      console.error('Error adding participant:', error);
      toast.error(errorMsg);
    }
  }

  async function handleRemoveParticipant(meetingId: string, participantId: string) {
    if (!confirm('Are you sure you want to remove this participant?')) {
      return;
    }

    try {
      await apiClient.delete(`/participants/meeting/${meetingId}/participants/${participantId}`);
      await fetchParticipants(meetingId);
      // Refresh meetings list
      const meetingsRes = await apiClient.get('/meetings/');
      setMeetings(meetingsRes.data);
      toast.success('Participant removed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to remove participant');
      console.error('Error removing participant:', error);
    }
  }

  function handleEditMeeting(meeting: Meeting) {
    setEditingMeeting(meeting.id);
    setEditForm({
      title: meeting.title,
      description: meeting.description || '',
      translation_enabled: meeting.translation_enabled,
      supported_languages: meeting.supported_languages || ['en']
    });
  }

  function handleCancelEdit() {
    setEditingMeeting(null);
    setEditForm({});
  }

  async function handleSaveMeeting(meetingId: string) {
    try {
      await apiClient.put(`/meetings/${meetingId}`, editForm);
      // Refresh meetings list
      const meetingsRes = await apiClient.get('/meetings/');
      setMeetings(meetingsRes.data);
      setEditingMeeting(null);
      setEditForm({});
      toast.success('Meeting updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update meeting');
      console.error('Error updating meeting:', error);
    }
  }

  async function handleEndMeeting(meetingId: string) {
    if (!confirm('Are you sure you want to end this meeting? All participants will be disconnected.')) {
      return;
    }

    try {
      await apiClient.post(`/meetings/${meetingId}/end`);
      // Refresh meetings list
      const meetingsRes = await apiClient.get('/meetings/');
      setMeetings(meetingsRes.data);
      toast.success('Meeting ended successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to end meeting');
      console.error('Error ending meeting:', error);
    }
  }

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
        <h1 className="text-3xl font-bold">Meeting Management</h1>
        <div className="flex gap-4">
          <Link href="/admin/dashboard" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Back to Dashboard
          </Link>
          <Link href="/admin/meetings/new" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Create Meeting
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="bg-white p-6 rounded shadow">
            {editingMeeting === meeting.id ? (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-4">Edit Meeting</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.translation_enabled || false}
                        onChange={(e) => setEditForm({...editForm, translation_enabled: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Translation Enabled</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Supported Languages (comma-separated)</label>
                    <input
                      type="text"
                      value={editForm.supported_languages?.join(', ') || 'en'}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        supported_languages: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                      })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="en, es, fr"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveMeeting(meeting.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{meeting.title}</h2>
                    {meeting.description && (
                      <p className="text-gray-600 mt-1">{meeting.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMeeting(meeting)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    {meeting.status === 'active' && (
                      <button
                        onClick={() => handleEndMeeting(meeting.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        End Meeting
                      </button>
                    )}
                    <span className={`px-3 py-1 rounded text-sm ${
                      meeting.status === 'active' ? 'bg-green-100 text-green-800' :
                      meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {meeting.status}
                    </span>
                    <span className="px-3 py-1 rounded text-sm bg-purple-100 text-purple-800">
                      {meeting.meeting_type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                  <div>
                    <strong>Meeting ID:</strong> 
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{meeting.id}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(meeting.id);
                          toast.success('Meeting ID copied to clipboard!');
                        }}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                        title="Copy Meeting ID"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <strong>Room:</strong> {meeting.room_name}
                  </div>
                  <div>
                    <strong>Host Type:</strong> {meeting.host_type || 'N/A'}
                  </div>
                  <div>
                    <strong>Translation:</strong> {meeting.translation_enabled ? 'Enabled' : 'Disabled'}
                  </div>
                  <div>
                    <strong>Languages:</strong> {meeting.supported_languages?.join(', ') || 'en'}
                  </div>
                  <div className="col-span-2">
                    <Link
                      href={`/meeting/join?meetingId=${encodeURIComponent(meeting.id)}`}
                      className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Join Meeting
                    </Link>
                  </div>
                </div>
              </>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">
                  Participants ({selectedMeeting === meeting.id ? participants.length : (meeting as any)._livekit_participants || 0})
                </h3>
                {selectedMeeting === meeting.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddParticipant(!showAddParticipant)}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      {showAddParticipant ? 'Cancel' : 'Add Participant'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMeeting(null);
                        setShowAddParticipant(false);
                      }}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Hide
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedMeeting(meeting.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    View Participants
                  </button>
                )}
              </div>

              {editingMeeting !== meeting.id && selectedMeeting === meeting.id && (
                <div className="mt-4">
                  {showAddParticipant && (
                    <div className="bg-gray-50 p-4 rounded mb-4">
                      <h4 className="font-semibold mb-2">Add Participant</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">User</label>
                          <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                          >
                            <option value="">Select a user...</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.full_name} ({user.email}) - {user.role}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Language</label>
                          <select
                            value={participantLanguage}
                            onChange={(e) => setParticipantLanguage(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
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
                      </div>
                      <button
                        onClick={() => handleAddParticipant(meeting.id)}
                        className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add Participant
                      </button>
                    </div>
                  )}

                  {participants.length === 0 ? (
                    <p className="text-gray-500 text-sm">No participants yet</p>
                  ) : (
                    <div className="space-y-2">
                      {participants.map((participant) => (
                        <div key={participant.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div>
                            <div className="font-medium">{participant.user_name}</div>
                            <div className="text-sm text-gray-600">
                              {participant.user_email} • Language: {participant.language_preference} • Status: {participant.status}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveParticipant(meeting.id, participant.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {meetings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No meetings found. Create your first meeting to get started.</p>
        </div>
      )}
    </div>
  );
}
