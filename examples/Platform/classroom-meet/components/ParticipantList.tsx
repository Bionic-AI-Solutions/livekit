'use client';

import React from 'react';
import { Participant, LocalParticipant } from 'livekit-client';
import { useParticipants } from '@livekit/components-react';

interface ParticipantListProps {
  participants: Participant[];
  localParticipant: LocalParticipant;
  role: 'teacher' | 'student';
}

export function ParticipantList({ participants, localParticipant, role }: ParticipantListProps) {
  const getParticipantRole = (participant: Participant): 'teacher' | 'student' => {
    try {
      const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
      return metadata.role || 'student';
    } catch {
      return 'student';
    }
  };

  const allParticipants = [localParticipant, ...participants.filter((p) => p !== localParticipant)];

  return (
    <div
      style={{
        position: 'absolute',
        top: '80px',
        right: '1rem',
        width: '300px',
        maxHeight: 'calc(100vh - 100px)',
        background: 'var(--lk-bg)',
        border: '1px solid var(--lk-border)',
        borderRadius: '8px',
        padding: '1rem',
        overflowY: 'auto',
        zIndex: 1000,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Participants</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {allParticipants.map((participant) => {
          const participantRole = getParticipantRole(participant);
          const isLocal = participant === localParticipant;
          const isTeacher = participantRole === 'teacher';

          return (
            <div
              key={participant.identity}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: isLocal ? 'var(--lk-bg-secondary)' : 'transparent',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: participant.isSpeaking
                    ? 'var(--lk-primary)'
                    : participant.isMicrophoneEnabled
                      ? 'var(--lk-success)'
                      : 'var(--lk-danger)',
                }}
              />
              <span style={{ flex: 1, fontSize: '0.9rem' }}>
                {participant.name || participant.identity}
                {isLocal && ' (You)'}
              </span>
              {isTeacher && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    background: 'var(--lk-primary)',
                    borderRadius: '4px',
                  }}
                >
                  👨‍🏫
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

