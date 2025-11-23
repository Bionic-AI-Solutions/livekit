'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { Room, RoomConnectOptions, RoomOptions, VideoPresets } from 'livekit-client';

export default function MeetingRoomPage() {
  const params = useParams();
  const roomName = params?.roomId as string;
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Get stored values
    const storedToken = localStorage.getItem('room_token');
    const storedWsUrl = localStorage.getItem('ws_url');
    const storedLanguage = localStorage.getItem('language');
    
    if (storedToken) setToken(storedToken);
    if (storedWsUrl) setWsUrl(storedWsUrl);
    if (storedLanguage) setLanguage(storedLanguage);
  }, []);

  if (!token || !wsUrl) {
    return <div>Loading room connection...</div>;
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
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={wsUrl}
      connect={true}
      options={roomOptions}
      connectOptions={connectOptions}
    >
      <div className="h-screen w-screen">
        <VideoConference />
      </div>
    </LiveKitRoom>
  );
}

