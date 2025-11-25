'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useParticipants,
  useRoomContext,
  useLocalParticipant,
  formatChatMessageLinks,
} from '@livekit/components-react';
import {
  Room,
  RoomOptions,
  RoomConnectOptions,
  RoomEvent,
  VideoPresets,
  TrackPublishDefaults,
  VideoCaptureOptions,
  DisconnectReason,
} from 'livekit-client';
import { ConnectionDetails } from '@/lib/types';
import { ClassroomControls } from '@/components/ClassroomControls';
import { HandRaiseButton } from '@/components/HandRaiseButton';
import { ParticipantList } from '@/components/ParticipantList';
import toast from 'react-hot-toast';

const CONN_DETAILS_ENDPOINT = '/api/connection-details';

interface ClassroomClientProps {
  roomName: string;
  participantName: string;
  role: 'teacher' | 'student';
}

export function ClassroomClient({ roomName, participantName, role }: ClassroomClientProps) {
  const router = useRouter();
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const fetchConnectionDetails = async () => {
      try {
        const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
        url.searchParams.append('roomName', roomName);
        url.searchParams.append('participantName', participantName);
        url.searchParams.append('role', role);

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to get connection details');
        }
        const data = await response.json();
        setConnectionDetails(data);
      } catch (error) {
        console.error('Error fetching connection details:', error);
        toast.error('Failed to connect to classroom');
        router.push('/');
      }
    };

    fetchConnectionDetails();
  }, [roomName, participantName, role, router]);

  const roomOptions = useMemo((): RoomOptions => {
    const videoCaptureDefaults: VideoCaptureOptions = {
      resolution: VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: [VideoPresets.h720, VideoPresets.h540],
      red: true,
    };
    return {
      videoCaptureDefaults,
      publishDefaults,
      adaptiveStream: true,
      dynacast: true,
    };
  }, []);

  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  const handleDisconnect = useCallback(
    (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.USER_REQUESTED) {
        toast.success('Left classroom');
      } else if (reason) {
        toast.error(`Disconnected: ${reason}`);
      }
      router.push('/');
    },
    [router],
  );

  const handleError = useCallback((error: Error) => {
    console.error('Room error:', error);
    toast.error(`Error: ${error.message}`);
  }, []);

  if (!connectionDetails) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <div>Connecting to classroom...</div>
      </div>
    );
  }

  return (
    <div className="lk-room-container" style={{ height: '100vh', width: '100vw' }}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={connectionDetails.participantToken}
        serverUrl={connectionDetails.serverUrl}
        connect={true}
        options={roomOptions}
        connectOptions={connectOptions}
        onDisconnected={handleDisconnect}
        onError={handleError}
        onConnected={() => {
          setIsConnecting(false);
          toast.success(`Connected as ${role}`);
        }}
      >
        <RoomAudioRenderer />
        <ClassroomContent role={role} roomName={roomName} />
      </LiveKitRoom>
    </div>
  );
}

function ClassroomContent({ role, roomName }: { role: 'teacher' | 'student'; roomName: string }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with room info and controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          background: 'var(--lk-bg)',
          borderBottom: '1px solid var(--lk-border)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
            {role === 'teacher' ? '👨‍🏫' : '🎓'} Classroom: {roomName}
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </p>
        </div>
        {role === 'teacher' ? (
          <ClassroomControls room={room} />
        ) : (
          <HandRaiseButton room={room} localParticipant={localParticipant} />
        )}
      </div>

      {/* Main video conference area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          settings={{ showControlBar: true }}
        />
      </div>

      {/* Participant list sidebar */}
      <ParticipantList participants={participants} localParticipant={localParticipant} role={role} />
    </div>
  );
}


