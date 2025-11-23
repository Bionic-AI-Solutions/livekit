/**
 * LiveKit client utilities
 */
import { Room, RoomConnectOptions, RoomOptions } from 'livekit-client';
import { VideoPresets } from 'livekit-client';

export function createRoomOptions(): RoomOptions {
  return {
    publishDefaults: {
      videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
      red: true,
    },
    adaptiveStream: { pixelDensity: 'screen' },
    dynacast: true,
  };
}

export function createConnectOptions(): RoomConnectOptions {
  return {
    autoSubscribe: true,
  };
}

export async function subscribeToLanguageTrack(
  room: Room,
  trackId: string,
  language: string
): Promise<void> {
  // Subscribe to translated audio track for specific language
  const trackName = `${trackId}-${language}`;
  // Implementation depends on LiveKit track subscription API
}

