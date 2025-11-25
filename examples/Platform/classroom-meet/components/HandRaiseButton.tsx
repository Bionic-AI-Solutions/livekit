'use client';

import React, { useCallback, useState } from 'react';
import { Room, LocalParticipant } from 'livekit-client';
import toast from 'react-hot-toast';

interface HandRaiseButtonProps {
  room: Room;
  localParticipant: LocalParticipant;
}

export function HandRaiseButton({ room, localParticipant }: HandRaiseButtonProps) {
  const [isRaised, setIsRaised] = useState(false);

  const handleHandRaise = useCallback(async () => {
    try {
      const newState = !isRaised;
      setIsRaised(newState);

      // Send hand raise status via data channel
      await room.localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({
            type: 'hand_raise',
            raised: newState,
            participant: localParticipant.identity,
          }),
        ),
      );

      if (newState) {
        toast.success('Hand raised!');
      } else {
        toast.success('Hand lowered');
      }
    } catch (error) {
      console.error('Error raising hand:', error);
      toast.error('Failed to raise hand');
      setIsRaised(false);
    }
  }, [isRaised, room, localParticipant]);

  return (
    <button
      className="lk-button"
      onClick={handleHandRaise}
      style={{
        fontSize: '1rem',
        padding: '0.75rem 1.5rem',
        background: isRaised ? 'var(--lk-primary)' : 'var(--lk-bg-secondary)',
        border: isRaised ? '2px solid var(--lk-primary)' : '2px solid var(--lk-border)',
      }}
      title={isRaised ? 'Lower hand' : 'Raise hand'}
    >
      {isRaised ? '✋ Hand Raised' : '✋ Raise Hand'}
    </button>
  );
}

