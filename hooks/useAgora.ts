'use client';

import { useState, useEffect } from 'react';
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';

export interface AgoraConfig {
  appId: string;
  channel: string;
}

export const useAgora = (config: AgoraConfig) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') return;

    // Dynamic import of AgoraRTC
    import('agora-rtc-sdk-ng').then((AgoraRTC) => {
      const agoraClient = AgoraRTC.default.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);

      // Set up event listeners
      agoraClient.on('user-published', async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          setRemoteUsers((prevUsers) => {
            const existingUser = prevUsers.find((u) => u.uid === user.uid);
            if (existingUser) {
              return prevUsers.map((u) => (u.uid === user.uid ? user : u));
            }
            return [...prevUsers, user];
          });
        }

        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      agoraClient.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
        }
      });

      agoraClient.on('user-left', (user) => {
        setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
      });
    });

    return () => {
      client?.removeAllListeners();
    };
  }, []);

  const join = async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      
      // Join the channel
      await client.join(config.appId, config.channel, null, null);
      
      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Publish local tracks
      await client.publish([audioTrack, videoTrack]);
      
      setIsJoined(true);
    } catch (err) {
      console.error('Error joining channel:', err);
      setError(err instanceof Error ? err.message : 'Failed to join channel');
    } finally {
      setIsLoading(false);
    }
  };

  const leave = async () => {
    if (!client) return;

    setIsLoading(true);

    try {
      // Stop and close local tracks
      localVideoTrack?.stop();
      localVideoTrack?.close();
      localAudioTrack?.stop();
      localAudioTrack?.close();

      setLocalVideoTrack(null);
      setLocalAudioTrack(null);

      // Leave the channel
      await client.leave();
      
      setRemoteUsers([]);
      setIsJoined(false);
    } catch (err) {
      console.error('Error leaving channel:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave channel');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  return {
    client,
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isJoined,
    isVideoEnabled,
    isAudioEnabled,
    isLoading,
    error,
    join,
    leave,
    toggleVideo,
    toggleAudio,
  };
};
