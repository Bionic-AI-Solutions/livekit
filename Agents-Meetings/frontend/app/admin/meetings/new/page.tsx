'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { isAuthenticated, getCurrentUser, logout } from '@/lib/auth';
import Link from 'next/link';

export default function NewMeetingPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<'meeting' | 'classroom'>('meeting');
  const [hostType, setHostType] = useState<'human' | 'avatar'>('human');
  const [avatarProvider, setAvatarProvider] = useState('bithuman');
  const [translationEnabled, setTranslationEnabled] = useState(true);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['en']);
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const availableLanguages = [
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

  const handleLanguageToggle = (langCode: string) => {
    if (supportedLanguages.includes(langCode)) {
      if (supportedLanguages.length > 1) {
        setSupportedLanguages(supportedLanguages.filter(l => l !== langCode));
        setError('');
      } else {
        setError('At least one language must be selected');
      }
    } else {
      setSupportedLanguages([...supportedLanguages, langCode]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    try {
      const user = await getCurrentUser();
      if (user.role !== 'admin') {
        setError('Only admins can create meetings');
        return;
      }

      const meetingData: any = {
        title,
        description: description || undefined,
        meeting_type: meetingType,
        translation_enabled: translationEnabled,
        supported_languages: supportedLanguages,
      };

      if (meetingType === 'meeting') {
        meetingData.host_type = hostType;
        if (hostType === 'avatar') {
          meetingData.avatar_provider = avatarProvider;
        }
      } else {
        // Classroom always uses avatar
        meetingData.host_type = 'avatar';
        meetingData.avatar_provider = avatarProvider;
      }

      if (scheduledAt) {
        meetingData.scheduled_at = new Date(scheduledAt).toISOString();
      }
      if (durationMinutes) {
        meetingData.duration_minutes = parseInt(durationMinutes);
      }
      if (maxParticipants) {
        meetingData.max_participants = parseInt(maxParticipants);
      }

      const response = await apiClient.post('/meetings/', meetingData);
      router.push('/admin/meetings');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create New Meeting</h1>
        <Link href="/admin/meetings" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Meeting Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="Enter meeting title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded"
            placeholder="Enter meeting description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Meeting Type *</label>
          <select
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value as 'meeting' | 'classroom')}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="meeting">Meeting</option>
            <option value="classroom">Classroom</option>
          </select>
        </div>

        {meetingType === 'meeting' && (
          <div>
            <label className="block text-sm font-medium mb-2">Host Type *</label>
            <select
              value={hostType}
              onChange={(e) => setHostType(e.target.value as 'human' | 'avatar')}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="human">Human</option>
              <option value="avatar">Avatar</option>
            </select>
          </div>
        )}

        {(meetingType === 'classroom' || hostType === 'avatar') && (
          <div>
            <label className="block text-sm font-medium mb-2">Avatar Provider</label>
            <select
              value={avatarProvider}
              onChange={(e) => setAvatarProvider(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="bithuman">BitHuman</option>
              <option value="anam">Anam</option>
              <option value="tavus">Tavus</option>
              <option value="hedra">Hedra</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Translation</label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={translationEnabled}
              onChange={(e) => setTranslationEnabled(e.target.checked)}
              className="mr-2"
            />
            Enable translation
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Supported Languages *</label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
            {availableLanguages.map((lang) => (
              <label key={lang.code} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={supportedLanguages.includes(lang.code)}
                  onChange={() => handleLanguageToggle(lang.code)}
                  className="mr-2"
                />
                <span className="text-sm">{lang.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Scheduled At</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Participants</label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Meeting'}
          </button>
          <Link
            href="/admin/meetings"
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}






