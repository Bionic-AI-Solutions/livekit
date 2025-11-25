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
  scheduled_at?: string;
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

const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-teal-500',
  'bg-cyan-500',
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'as', name: 'Assamese (অসমীয়া)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'ne', name: 'Nepali (नेपाली)' },
];

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Meeting>>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [participantLanguage, setParticipantLanguage] = useState('en');
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
        const meetingsData = meetingsRes.data;
        setUsers(usersRes.data);
        
        // Fetch and update participant counts for all meetings
        const meetingsWithCounts = await updateParticipantCountsForAllMeetings(meetingsData);
        setMeetings(meetingsWithCounts);
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
      fetchParticipants(selectedMeeting.id);
    }
  }, [selectedMeeting]);

  async function updateParticipantCountsForAllMeetings(meetingsList: Meeting[]) {
    const participantCountPromises = meetingsList.map(async (meeting: Meeting) => {
      try {
        const participantsRes = await apiClient.get(`/participants/meeting/${meeting.id}/participants`).catch(() => ({ data: [] }));
        let count = participantsRes.data?.length || 0;
        
        if (meeting.status === 'active') {
          try {
            const roomRes = await apiClient.get(`/rooms/meeting/${meeting.id}`).catch(() => null);
            if (roomRes?.data?.num_participants !== undefined) {
              count = roomRes.data.num_participants;
            }
          } catch (error) {
            console.log(`Room not found for active meeting ${meeting.id}, using participants count:`, count);
          }
        }
        
        return { meetingId: meeting.id, count };
      } catch (error) {
        console.error(`Error fetching participant count for meeting ${meeting.id}:`, error);
        return { meetingId: meeting.id, count: 0 };
      }
    });
    
    const participantCounts = await Promise.all(participantCountPromises);
    const updated = meetingsList.map((m: Meeting) => {
      const countData = participantCounts.find(pc => pc.meetingId === m.id);
      return countData ? { ...m, _livekit_participants: countData.count } : { ...m, _livekit_participants: 0 };
    });
    return updated;
  }

  async function fetchParticipants(meetingId: string) {
    try {
      const [participantsRes, roomRes] = await Promise.all([
        apiClient.get(`/participants/meeting/${meetingId}/participants`).catch(() => ({ data: [] })),
        apiClient.get(`/rooms/meeting/${meetingId}`).catch(() => ({ data: { num_participants: 0 } }))
      ]);
      setParticipants(participantsRes.data || []);
      const numParticipants = roomRes.data?.num_participants || 0;
      if (numParticipants > 0) {
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

    try {
      await apiClient.post(`/participants/meeting/${meetingId}/participants`, {
        user_id: selectedUserId,
        language_preference: participantLanguage
      });
      
      await fetchParticipants(meetingId);
      const meetingsRes = await apiClient.get('/meetings/');
      const meetingsData = meetingsRes.data;
      const meetingsWithCounts = await updateParticipantCountsForAllMeetings(meetingsData);
      setMeetings(meetingsWithCounts);
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
      const meetingsRes = await apiClient.get('/meetings/');
      const meetingsData = meetingsRes.data;
      const meetingsWithCounts = await updateParticipantCountsForAllMeetings(meetingsData);
      setMeetings(meetingsWithCounts);
      toast.success('Participant removed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to remove participant');
      console.error('Error removing participant:', error);
    }
  }

  async function handleSaveMeeting(meetingId: string) {
    try {
      await apiClient.put(`/meetings/${meetingId}`, editForm);
      const meetingsRes = await apiClient.get('/meetings/');
      const meetingsData = meetingsRes.data;
      const meetingsWithCounts = await updateParticipantCountsForAllMeetings(meetingsData);
      setMeetings(meetingsWithCounts);
      setShowEditModal(false);
      setSelectedMeeting(null);
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
      const meetingsRes = await apiClient.get('/meetings/');
      const meetingsData = meetingsRes.data;
      const meetingsWithCounts = await updateParticipantCountsForAllMeetings(meetingsData);
      setMeetings(meetingsWithCounts);
      toast.success('Meeting ended successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to end meeting');
      console.error('Error ending meeting:', error);
    }
  }

  async function handleDeleteMeeting(meetingId: string) {
    if (!confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/meetings/${meetingId}`);
      const meetingsRes = await apiClient.get('/meetings/');
      const meetingsData = meetingsRes.data;
      const meetingsWithCounts = await updateParticipantCountsForAllMeetings(meetingsData);
      setMeetings(meetingsWithCounts);
      setShowEditModal(false);
      setSelectedMeeting(null);
      toast.success('Meeting deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete meeting');
      console.error('Error deleting meeting:', error);
    }
  }

  function handleMeetingClick(meeting: Meeting) {
    setSelectedMeeting(meeting);
    setEditForm({
      title: meeting.title,
      description: meeting.description || '',
      translation_enabled: meeting.translation_enabled,
      supported_languages: meeting.supported_languages || ['en']
    });
    setShowEditModal(true);
  }

  function getMeetingsForDate(date: Date): Meeting[] {
    const dateStr = date.toISOString().split('T')[0];
    return meetings.filter(meeting => {
      if (!meeting.scheduled_at) {
        // If no scheduled_at, use created_at
        const meetingDate = new Date(meeting.created_at).toISOString().split('T')[0];
        return meetingDate === dateStr;
      }
      const meetingDate = new Date(meeting.scheduled_at).toISOString().split('T')[0];
      return meetingDate === dateStr;
    });
  }

  function getCalendarDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }

  function getMeetingColor(meeting: Meeting, index: number): string {
    return COLORS[index % COLORS.length];
  }

  function navigateMonth(direction: number) {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const calendarDays = getCalendarDays();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ← Previous
          </button>
          <h2 className="text-2xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-gray-700 py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const dayMeetings = getMeetingsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={date.toISOString()}
                className={`aspect-square border rounded p-2 ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'} hover:bg-gray-50 transition-colors`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayMeetings.slice(0, 3).map((meeting, idx) => (
                    <div
                      key={meeting.id}
                      className={`${getMeetingColor(meeting, idx)} text-white text-xs px-1 py-0.5 rounded cursor-pointer hover:opacity-80 truncate`}
                      title={meeting.title}
                      onClick={() => handleMeetingClick(meeting)}
                    >
                      {meeting.title}
                    </div>
                  ))}
                  {dayMeetings.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayMeetings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Meeting Modal */}
      {showEditModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Meeting</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedMeeting(null);
                  setEditForm({});
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

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
                <label className="block text-sm font-medium mb-2">Supported Languages *</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <label key={lang.code} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={editForm.supported_languages?.includes(lang.code) || false}
                        onChange={(e) => {
                          const currentLangs = editForm.supported_languages || ['en'];
                          if (e.target.checked) {
                            setEditForm({
                              ...editForm,
                              supported_languages: [...currentLangs, lang.code]
                            });
                          } else {
                            if (currentLangs.length > 1) {
                              setEditForm({
                                ...editForm,
                                supported_languages: currentLangs.filter(l => l !== lang.code)
                              });
                            } else {
                              toast.warning('At least one language must be selected');
                            }
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{lang.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Participants ({participants.length})</h3>
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
                      onClick={() => handleAddParticipant(selectedMeeting.id)}
                      className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Add Participant
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setShowAddParticipant(!showAddParticipant)}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    {showAddParticipant ? 'Cancel' : 'Add Participant'}
                  </button>
                </div>

                {participants.length === 0 ? (
                  <p className="text-gray-500 text-sm">No participants yet</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <div>
                          <div className="font-medium">{participant.user_name}</div>
                          <div className="text-sm text-gray-600">
                            {participant.user_email} • Language: {participant.language_preference} • Status: {participant.status}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveParticipant(selectedMeeting.id, participant.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleSaveMeeting(selectedMeeting.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
                {selectedMeeting.status === 'active' && (
                  <button
                    onClick={() => handleEndMeeting(selectedMeeting.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    End Meeting
                  </button>
                )}
                <button
                  onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Meeting
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMeeting(null);
                    setEditForm({});
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
