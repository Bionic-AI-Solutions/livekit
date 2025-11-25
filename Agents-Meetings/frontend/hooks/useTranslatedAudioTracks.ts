'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRoomContext, useParticipants } from '@livekit/components-react';
import { RoomEvent, RemoteTrackPublication, Track, ParticipantEvent } from 'livekit-client';

/**
 * Hook to manage subscription to translated audio tracks
 * Translation agent publishes tracks as: {original_track_sid}-{language_code}
 * These tracks are published by the translation agent participant
 */
export function useTranslatedAudioTracks(language: string) {
  const room = useRoomContext();
  const participants = useParticipants();
  const subscribedTracksRef = useRef<Set<string>>(new Set());
  const originalTracksRef = useRef<Map<string, RemoteTrackPublication>>(new Map());
  const languageRef = useRef<string>(language);

  // Update language ref when it changes
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Find and subscribe to translated track
  const subscribeToTranslatedTrack = useCallback(
    async (originalTrackSid: string, targetLanguage: string) => {
      if (!room) return;

      const translatedTrackName = `${originalTrackSid}-${targetLanguage}`;

      // Find the translation agent participant
      const translatorParticipant = participants.find(
        (p) => p.identity === 'translator' || p.name === 'translator'
      );

      if (!translatorParticipant) {
        console.log('Translation agent not found in room');
        return;
      }

      // Find the translated track publication by name
      const translatedPublication = translatorParticipant
        .getTrackPublications()
        .find(
          (pub) =>
            pub.trackName === translatedTrackName &&
            pub.kind === Track.Kind.Audio &&
            pub instanceof RemoteTrackPublication
        ) as RemoteTrackPublication | undefined;

      if (translatedPublication) {
        try {
          // Subscribe to the translated track
          await translatedPublication.setSubscribed(true);
          subscribedTracksRef.current.add(translatedTrackName);
          console.log(`Subscribed to translated track: ${translatedTrackName} for language ${targetLanguage}`);

          // Find and mute the original track
          for (const participant of participants) {
            for (const pub of participant.getTrackPublications()) {
              if (
                pub.trackSid === originalTrackSid &&
                pub.kind === Track.Kind.Audio &&
                pub instanceof RemoteTrackPublication
              ) {
                // Unsubscribe from original track to mute it
                await pub.setSubscribed(false);
                originalTracksRef.current.set(originalTrackSid, pub);
                console.log(`Muted original track: ${originalTrackSid}`);
                break;
              }
            }
          }
        } catch (error) {
          console.error(`Failed to subscribe to translated track ${translatedTrackName}:`, error);
        }
      } else {
        console.log(`Translated track not found: ${translatedTrackName}`);
      }
    },
    [room, participants]
  );

  // Unsubscribe from translated track and restore original
  const unsubscribeFromTranslatedTrack = useCallback(
    async (trackName: string) => {
      if (!room) return;

      // Find and unsubscribe from the translated track
      const translatorParticipant = participants.find(
        (p) => p.identity === 'translator' || p.name === 'translator'
      );

      if (translatorParticipant) {
        const translatedPublication = translatorParticipant
          .getTrackPublications()
          .find((pub) => pub.trackName === trackName) as RemoteTrackPublication | undefined;

        if (translatedPublication) {
          try {
            await translatedPublication.setSubscribed(false);
            subscribedTracksRef.current.delete(trackName);
            console.log(`Unsubscribed from translated track: ${trackName}`);

            // Restore original track
            const originalTrackSid = trackName.split('-')[0];
            const originalPub = originalTracksRef.current.get(originalTrackSid);
            if (originalPub) {
              await originalPub.setSubscribed(true);
              originalTracksRef.current.delete(originalTrackSid);
              console.log(`Restored original track: ${originalTrackSid}`);
            }
          } catch (error) {
            console.error(`Failed to unsubscribe from track ${trackName}:`, error);
          }
        }
      }
    },
    [room, participants]
  );

  // Handle track published events - subscribe to translated tracks when they become available
  useEffect(() => {
    if (!room) return;

    const handleTrackPublished = async (
      publication: RemoteTrackPublication,
      participant: any
    ) => {
      // Check if this is a translated track published by the translation agent
      if (
        (participant.identity === 'translator' || participant.name === 'translator') &&
        publication.kind === Track.Kind.Audio &&
        publication.trackName
      ) {
        const trackName = publication.trackName;
        const match = trackName.match(/^(.+)-([a-z]{2})$/);
        
        if (match) {
          const [, originalTrackSid, trackLanguage] = match;
          
          // If this is for our current language, subscribe to it
          if (trackLanguage === languageRef.current) {
            console.log(`Translated track published: ${trackName} for language ${trackLanguage}`);
            await subscribeToTranslatedTrack(originalTrackSid, trackLanguage);
          }
        }
      }
    };

    room.on(RoomEvent.TrackPublished, handleTrackPublished);

    return () => {
      room.off(RoomEvent.TrackPublished, handleTrackPublished);
    };
  }, [room, subscribeToTranslatedTrack]);

  // When language changes, update subscriptions
  useEffect(() => {
    if (!room) return;

    const updateSubscriptions = async () => {
      // Unsubscribe from all current translated tracks (for old language)
      const currentTracks = Array.from(subscribedTracksRef.current);
      for (const trackName of currentTracks) {
        const match = trackName.match(/^(.+)-([a-z]{2})$/);
        if (match) {
          const [, , trackLanguage] = match;
          if (trackLanguage !== language) {
            await unsubscribeFromTranslatedTrack(trackName);
          }
        }
      }

      // Find all original audio tracks and subscribe to their translated versions
      const translatorParticipant = participants.find(
        (p) => p.identity === 'translator' || p.name === 'translator'
      );

      if (translatorParticipant) {
        // Find all original tracks
        for (const participant of participants) {
          if (participant.identity === 'translator' || participant.name === 'translator') {
            continue; // Skip translator's own tracks
          }

          for (const publication of participant.getTrackPublications()) {
            if (
              publication.kind === Track.Kind.Audio &&
              publication instanceof RemoteTrackPublication &&
              publication.trackSid
            ) {
              // Check if translated version exists for current language
              const translatedTrackName = `${publication.trackSid}-${language}`;
              const translatedPub = translatorParticipant
                .getTrackPublications()
                .find((pub) => pub.trackName === translatedTrackName);

              if (translatedPub) {
                await subscribeToTranslatedTrack(publication.trackSid, language);
              }
            }
          }
        }
      }
    };

    // Small delay to allow tracks to be published
    const timeout = setTimeout(updateSubscriptions, 500);
    return () => clearTimeout(timeout);
  }, [language, room, participants, subscribeToTranslatedTrack, unsubscribeFromTranslatedTrack]);

  return {
    subscribedTracks: Array.from(subscribedTracksRef.current),
    isTranslatedAudioActive: subscribedTracksRef.current.size > 0,
  };
}

