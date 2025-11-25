'use client';

import { useEffect, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import {
  TranscriptionSegment,
  RoomEvent,
  TrackPublication,
  Participant,
} from 'livekit-client';

interface CaptionsDisplayProps {
  language: string;
  enabled?: boolean;
  showSpeaker?: boolean;
}

export default function CaptionsDisplay({ language, enabled = true, showSpeaker = true }: CaptionsDisplayProps) {
  const room = useRoomContext();
  const [transcriptions, setTranscriptions] = useState<{
    [language: string]: {
      [id: string]: TranscriptionSegment & {
        participantIdentity?: string;
        participantName?: string;
      };
    };
  }>({});

  useEffect(() => {
    if (!room || !enabled) return;

    const updateTranscriptions = (
      segments: TranscriptionSegment[],
      participant?: Participant,
      publication?: TrackPublication
    ) => {
      setTranscriptions((prev) => {
        // Create a copy of the previous state
        const newTranscriptions = { ...prev };

        for (const segment of segments) {
          // Extract the language and id from the segment
          let segmentLanguage = segment.language || '';
          
          // If language is empty, try to get from segment attributes or default to 'en'
          if (segmentLanguage === '') {
            segmentLanguage = 'en';
          }

          // Ensure the language group exists
          if (!newTranscriptions[segmentLanguage]) {
            newTranscriptions[segmentLanguage] = {};
          }

          // Update or add the transcription segment in the correct group
          // Store participant info if available
          const segmentWithParticipant = {
            ...segment,
            participantIdentity: participant?.identity,
            participantName: participant?.name || participant?.identity,
          };
          newTranscriptions[segmentLanguage][segment.id] = segmentWithParticipant;
        }

        return newTranscriptions;
      });
    };

    room.on(RoomEvent.TranscriptionReceived, updateTranscriptions);
    return () => {
      room.off(RoomEvent.TranscriptionReceived, updateTranscriptions);
    };
  }, [room, enabled]);

  if (!enabled) {
    return null;
  }

  // Get transcriptions for the selected language
  const languageTranscriptions = transcriptions[language] || {};
  
  // Get the last 2-3 segments, sorted by firstReceivedTime
  const segments = Object.values(languageTranscriptions)
    .sort((a, b) => a.firstReceivedTime - b.firstReceivedTime)
    .slice(-2);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="lk-captions">
      <ul className="text-center space-y-1">
        {segments.map((segment, i, arr) => (
          <li
            key={segment.id}
            className={`text-white text-lg font-medium px-4 py-2 rounded ${
              i === 0 && arr.length > 1 ? 'opacity-50' : 'opacity-100'
            }`}
            style={{
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            {showSpeaker && (segment as any).participantName && (
              <span className="text-sm opacity-75 mr-2">
                {(segment as any).participantName}:
              </span>
            )}
            <span>{segment.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

