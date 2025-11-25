'use client';

import React, { useCallback, useState } from 'react';
import { Room, LocalParticipant } from 'livekit-client';
import { useParticipants } from '@livekit/components-react';
import toast from 'react-hot-toast';

interface ClassroomControlsProps {
  room: Room;
}

export function ClassroomControls({ room }: ClassroomControlsProps) {
  const participants = useParticipants();
  const [isMutingAll, setIsMutingAll] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleMuteAll = useCallback(async () => {
    setIsMutingAll(true);
    try {
      const students = participants.filter((p) => {
        const metadata = p.metadata ? JSON.parse(p.metadata) : {};
        return metadata.role === 'student' && p.isMicrophoneEnabled;
      });

      for (const student of students) {
        await room.localParticipant.publishData(
          new TextEncoder().encode(
            JSON.stringify({
              type: 'mute',
              target: student.identity,
            }),
          ),
        );
      }

      toast.success(`Muted ${students.length} student${students.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error muting all:', error);
      toast.error('Failed to mute all students');
    } finally {
      setIsMutingAll(false);
    }
  }, [participants, room]);

  const handleScreenShare = useCallback(async () => {
    try {
      const tracks = room.localParticipant.videoTrackPublications;
      const isScreenSharing = Array.from(tracks.values()).some(
        (pub) => pub.source === 'screen_share',
      );

      if (isScreenSharing) {
        await room.localParticipant.setScreenShareEnabled(false);
        toast.success('Stopped screen sharing');
      } else {
        await room.localParticipant.setScreenShareEnabled(true);
        toast.success('Started screen sharing');
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast.error('Failed to toggle screen share');
    }
  }, [room]);

  const handleEndClass = useCallback(async () => {
    if (confirm('Are you sure you want to end the class? All participants will be disconnected.')) {
      await room.disconnect();
    }
  }, [room]);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <button
        className="lk-button"
        onClick={handleMuteAll}
        disabled={isMutingAll}
        title="Mute all students"
        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
      >
        🔇 Mute All
      </button>
      <button
        className="lk-button"
        onClick={handleScreenShare}
        title="Share screen"
        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
      >
        📺 Share Screen
      </button>
      <button
        className="lk-button"
        onClick={handleEndClass}
        title="End class"
        style={{
          fontSize: '0.9rem',
          padding: '0.5rem 1rem',
          background: 'var(--lk-danger)',
        }}
      >
        🚪 End Class
      </button>
    </div>
  );
}


