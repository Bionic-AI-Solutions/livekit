'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer, 
  useParticipants, 
  useRoomContext,
  useLocalParticipant,
  TrackToggle,
  MediaDeviceMenu
} from '@livekit/components-react';
import CaptionsDisplay from '@/components/captions/CaptionsDisplay';
import { useTranslatedAudioTracks } from '@/hooks/useTranslatedAudioTracks';
import { useChat } from '@livekit/components-react';
import { RoomEvent, ChatMessage } from 'livekit-client';
import { RoomConnectOptions, RoomOptions, VideoPresets, DisconnectReason, Track } from 'livekit-client';
import { useToast } from '@/components/toast/ToastProvider';
import apiClient from '@/lib/api';

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [isConnecting, setIsConnecting] = useState(true);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Get stored values
    const storedToken = localStorage.getItem('room_token');
    const storedWsUrl = localStorage.getItem('ws_url');
    const storedLanguage = localStorage.getItem('language');
    const storedMeetingId = localStorage.getItem('meeting_id');
    
    if (storedToken) setToken(storedToken);
    if (storedWsUrl) setWsUrl(storedWsUrl);
    if (storedLanguage) setLanguage(storedLanguage);
    if (storedMeetingId) setMeetingId(storedMeetingId);
    
    // Check if user is host
    if (storedMeetingId) {
      checkIfHost(storedMeetingId);
    }
  }, []);

  async function checkIfHost(mId: string) {
    try {
      const response = await apiClient.get(`/meetings/${mId}`);
      // Check if current user is the creator/host
      // This would need to be implemented based on your auth system
      // For now, we'll check if user is admin or creator
      setIsHost(true); // Simplified - should check actual user role
    } catch (error) {
      console.error('Failed to check host status:', error);
    }
  }

  const handleDisconnect = useCallback((reason?: DisconnectReason) => {
    // Preserve meeting_id for redirect
    const preservedMeetingId = meetingId || localStorage.getItem('meeting_id');
    
    // Clean up localStorage (but preserve meeting_id temporarily)
    localStorage.removeItem('room_token');
    localStorage.removeItem('room_name');
    localStorage.removeItem('ws_url');
    localStorage.removeItem('language');
    
    // Preserve meeting_id for redirect
    if (preservedMeetingId) {
      localStorage.setItem('meeting_id', preservedMeetingId);
    }
    
    if (reason === DisconnectReason.CLIENT_INITIATED) {
      toast.info('You left the meeting');
      // Redirect with meeting ID prefilled
      router.push(preservedMeetingId ? `/meeting/join?meetingId=${encodeURIComponent(preservedMeetingId)}` : '/meeting/join');
    } else if (reason) {
      toast.warning('Connection lost');
      // Redirect with meeting ID prefilled
      router.push(preservedMeetingId ? `/meeting/join?meetingId=${encodeURIComponent(preservedMeetingId)}` : '/meeting/join');
    }
  }, [router, toast, meetingId]);

  const handleEndMeeting = useCallback(async () => {
    if (!meetingId) return;
    
    if (!confirm('Are you sure you want to end this meeting? All participants will be disconnected.')) {
      return;
    }

    try {
      await apiClient.post(`/meetings/${meetingId}/end`);
      toast.success('Meeting ended');
      router.push('/meeting/join');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to end meeting');
    }
  }, [meetingId, router, toast]);

  const handleError = useCallback((error: Error) => {
    console.error('Room error:', error);
    toast.error(`Connection error: ${error.message}`);
  }, [toast]);

  if (!token || !wsUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room connection...</p>
        </div>
      </div>
    );
  }

  const roomOptions: RoomOptions = {
    publishDefaults: {
      videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
      red: true,
    },
    adaptiveStream: { pixelDensity: 'screen' },
    dynacast: true,
  };

  const connectOptions: RoomConnectOptions = {
    autoSubscribe: true,
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={wsUrl}
        connect={true}
        options={roomOptions}
        connectOptions={connectOptions}
        onDisconnected={handleDisconnect}
        onError={handleError}
        onConnected={async () => {
          setIsConnecting(false);
          toast.success('Connected to meeting');
          
          // Set language attribute immediately after connection
          // This will be handled by the useEffect in MeetingRoomContent, but we can also set it here
          // as a backup to ensure it's set early
        }}
      >
        <RoomAudioRenderer />
        <MeetingRoomContent 
          language={language}
          setLanguage={setLanguage}
          isHost={isHost}
          onEndMeeting={handleEndMeeting}
          meetingId={meetingId}
        />
      </LiveKitRoom>
    </div>
  );
}

function MeetingRoomContent({ 
  language, 
  setLanguage, 
  isHost, 
  onEndMeeting,
  meetingId
}: {
  language: string;
  setLanguage: (lang: string) => void;
  isHost: boolean;
  onEndMeeting: () => void;
  meetingId: string | null;
}) {
  const participants = useParticipants();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const router = useRouter();
  const toast = useToast();

  // Subscribe to translated audio tracks
  const { isTranslatedAudioActive } = useTranslatedAudioTracks(language);
  const { chatMessages } = useChat();

  // Handle translated chat messages from the translation agent
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = async (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      // Handle translated chat messages
      if (topic === 'lk-chat-translated') {
        try {
          const dataStr = new TextDecoder().decode(payload);
          const data = JSON.parse(dataStr);
          
          // If this is a translated message for our language
          if (data.translated && data.targetLanguage === language) {
            console.log(`Received translated chat message: ${data.message} (from ${data.sourceLanguage} to ${data.targetLanguage})`);
            
            // The message will be displayed by LiveKit's chat system
            // We can optionally show a toast or indicator
            if (data.original !== data.message) {
              // Message was translated
              toast.info(`Translated message received`);
            }
          }
        } catch (e) {
          console.error('Error processing translated chat message:', e);
        }
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, language, toast]);

  // Set initial language attribute when room connects
  useEffect(() => {
    if (room && localParticipant) {
      const setInitialLanguage = async () => {
        try {
          await localParticipant.setAttributes({ language: language });
          console.log(`Initial language attribute set to: ${language}`);
        } catch (error) {
          console.error('Failed to set initial language attribute:', error);
        }
      };
      setInitialLanguage();
    }
  }, [room, localParticipant, language]);

  // Auto-end meeting when last participant leaves
  useEffect(() => {
    if (room && participants.length === 0 && isHost) {
      // Small delay to allow for reconnection attempts
      const timeout = setTimeout(() => {
        if (participants.length === 0) {
          onEndMeeting();
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [room, participants.length, isHost, onEndMeeting]);

  useEffect(() => {
    if (room && participants.length > 0) {
      console.log(`=== Meeting Status ===`);
      console.log(`Room: ${room.name}`);
      console.log(`Participants: ${participants.length}`);
      participants.forEach((p) => {
        console.log(`\nParticipant: ${p.name || p.identity}`);
        console.log(`  - Identity: ${p.identity}`);
        console.log(`  - Is speaking: ${p.isSpeaking}`);
        console.log(`  - Microphone enabled: ${p.isMicrophoneEnabled}`);
        console.log(`  - Camera enabled: ${p.isCameraEnabled}`);
      });
    }
  }, [room, participants]);

  const handleLeave = useCallback(() => {
    // Get meeting ID before disconnecting
    const preservedMeetingId = localStorage.getItem('meeting_id');
    
    if (room) {
      room.disconnect();
    }
    
    // Redirect with meeting ID
    if (preservedMeetingId) {
      router.push(`/meeting/join?meetingId=${encodeURIComponent(preservedMeetingId)}`);
    } else {
      router.push('/meeting/join');
    }
  }, [room, router]);

  const languages = [
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

  return (
    <div className="h-full w-full relative" data-lk-theme="default">
      {/* Participant Info Bar */}
      {participants.length > 0 && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
          <div className="text-sm font-semibold mb-1">
            Participants: {participants.length}
          </div>
          <div className="text-xs text-gray-300 space-y-1 max-h-32 overflow-y-auto">
            {participants.map((p) => (
              <div key={p.identity} className="flex items-center gap-2">
                <span>{p.name || p.identity}</span>
                <span className={p.isMicrophoneEnabled ? 'text-green-400' : 'text-red-400'}>
                  {p.isMicrophoneEnabled ? '🎤' : '🔇'}
                </span>
                <span className={p.isCameraEnabled ? 'text-green-400' : 'text-red-400'}>
                  {p.isCameraEnabled ? '📹' : '📷'}
                </span>
                {p.isSpeaking && <span className="text-yellow-400 animate-pulse">●</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-50 bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur-sm border border-white/20">
        <label className="text-xs font-semibold mb-1 block">
          Language {language && `(${languages.find(l => l.code === language)?.name})`}
        </label>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={async (e) => {
              const newLanguage = e.target.value;
              setLanguage(newLanguage);
              localStorage.setItem('language', newLanguage);
              
              // Update participant attributes for translation agent
              if (localParticipant) {
                try {
                  await localParticipant.setAttributes({ language: newLanguage });
                  console.log(`Language attribute set to: ${newLanguage}`);
                  toast.info(`Language changed to ${languages.find(l => l.code === newLanguage)?.name}`);
                } catch (error) {
                  console.error('Failed to set language attribute:', error);
                  toast.error('Failed to change language');
                }
              }
            }}
            className="bg-black/50 text-white text-xs px-2 py-1 rounded border border-white/20"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          {isTranslatedAudioActive && (
            <span className="text-green-400 text-xs" title="Translated audio active">
              🔊
            </span>
          )}
        </div>
      </div>

      {/* Custom Controls Bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
        <div className="flex items-center gap-2">
          {/* Microphone Toggle */}
          <div className="flex items-center gap-1">
            <TrackToggle source={Track.Source.Microphone}>
              {localParticipant.isMicrophoneEnabled ? '🎤' : '🔇'}
            </TrackToggle>
            <div className="lk-button-group-menu">
              <MediaDeviceMenu kind="audioinput" />
            </div>
          </div>

          {/* Camera Toggle */}
          <div className="flex items-center gap-1">
            <TrackToggle source={Track.Source.Camera}>
              {localParticipant.isCameraEnabled ? '📹' : '📷'}
            </TrackToggle>
            <div className="lk-button-group-menu">
              <MediaDeviceMenu kind="videoinput" />
            </div>
          </div>

          {/* Speaker/Output Device */}
          <div className="flex items-center gap-1">
            <button className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
              🔊
            </button>
            <div className="lk-button-group-menu">
              <MediaDeviceMenu kind="audiooutput" />
            </div>
          </div>

          {/* Leave Button */}
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
          >
            Leave
          </button>

          {/* End Meeting Button (Host only) */}
          {isHost && (
            <button
              onClick={onEndMeeting}
              className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 text-sm font-medium"
            >
              End Meeting
            </button>
          )}
        </div>
      </div>
      
      {/* Video Conference - with fixed chat positioning */}
      <div className="h-full w-full" style={{ paddingBottom: '80px' }}>
        <VideoConference
          chatMessageFormatter={(message) => {
            // The translation agent handles translation server-side
            // Messages are already translated when they arrive
            // Just return the message as-is
            return message;
          }}
          SettingsComponent={undefined}
        />
      </div>

      {/* Captions Display */}
      <CaptionsDisplay language={language} enabled={true} />
    </div>
  );
}

