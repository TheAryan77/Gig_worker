"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAgora } from "@/hooks/useAgora";
import {
  IconVideo,
  IconVideoOff,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhone,
  IconPhoneOff,
  IconArrowLeft,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { motion } from "motion/react";

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const localVideoRef = useRef<HTMLDivElement>(null);

  // Agora App ID - Replace with your actual Agora App ID
  const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "your-agora-app-id";
  const channelName = `project-${projectId}`;
  
  const projectName = searchParams.get("projectName") || "TrustHire Project";
  const userName = searchParams.get("userName") || "User";

  const {
    localVideoTrack,
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
  } = useAgora({ appId: AGORA_APP_ID, channel: channelName });

  // Play local video track
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }

    return () => {
      if (localVideoTrack) {
        localVideoTrack.stop();
      }
    };
  }, [localVideoTrack]);

  // Play remote video tracks
  useEffect(() => {
    remoteUsers.forEach((user) => {
      const remoteVideoTrack = user.videoTrack;
      const remotePlayerContainer = document.getElementById(`remote-player-${user.uid}`);

      if (remoteVideoTrack && remotePlayerContainer) {
        remoteVideoTrack.play(remotePlayerContainer);
      }
    });
  }, [remoteUsers]);

  const handleLeave = async () => {
    await leave();
    router.back();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b-2 border-orange-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <IconArrowLeft className="w-6 h-6 text-orange-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              <span className="text-orange-500">Trust</span>Hire Video Call
            </h1>
            <p className="text-sm text-neutral-600">{projectName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 rounded-full border border-orange-200">
          <IconUsers className="w-5 h-5 text-orange-600" />
          <span className="text-sm font-medium text-neutral-900">
            {remoteUsers.length + (isJoined ? 1 : 0)} participant{remoteUsers.length + (isJoined ? 1 : 0) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl"
        >
          <p className="font-medium">Error: {error}</p>
        </motion.div>
      )}

      {/* Video Grid */}
      <div className="flex-1 flex items-center justify-center p-6">
        {!isJoined ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="mb-6 p-6 bg-white rounded-2xl border-2 border-orange-100 shadow-lg">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <IconVideo className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Ready to join?
              </h2>
              <p className="text-neutral-600 mb-6">
                Start your video call for <span className="font-semibold text-orange-600">{projectName}</span>
              </p>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 mb-6">
                <p className="text-sm text-neutral-700">
                  <span className="font-semibold">Room:</span> {channelName}
                </p>
                <p className="text-sm text-neutral-700">
                  <span className="font-semibold">User:</span> {userName}
                </p>
              </div>
              <button
                onClick={join}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-neutral-300 disabled:to-neutral-400 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                <IconPhone className="w-5 h-5" />
                {isLoading ? "Joining..." : "Join Call"}
              </button>
            </div>
            <p className="text-sm text-neutral-500">
              Make sure your camera and microphone are enabled
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl">
            {/* Local Video */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-video bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl overflow-hidden shadow-xl border-2 border-orange-200"
            >
              <div
                ref={localVideoRef}
                className="w-full h-full"
                style={{ display: isVideoEnabled ? "block" : "none" }}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-3 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <IconUser className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-white font-semibold text-lg">Camera Off</p>
                    <p className="text-orange-100 text-sm">{userName}</p>
                  </div>
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black bg-opacity-60 px-4 py-2 rounded-full border border-white border-opacity-20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">
                  You {!isAudioEnabled && "(muted)"}
                </span>
              </div>
            </motion.div>

            {/* Remote Videos */}
            {remoteUsers.map((user, index) => (
              <motion.div
                key={user.uid}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative aspect-video bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl overflow-hidden shadow-xl border-2 border-orange-200"
              >
                <div id={`remote-player-${user.uid}`} className="w-full h-full" />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black bg-opacity-60 px-4 py-2 rounded-full border border-white border-opacity-20">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">
                    Participant {user.uid}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Placeholder for empty slots */}
            {remoteUsers.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative aspect-video bg-gradient-to-br from-orange-50 to-white rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-orange-300"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-orange-100 rounded-full flex items-center justify-center">
                    <IconUsers className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-lg font-semibold text-neutral-700">
                    Waiting for others...
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Share the room link to invite participants
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {isJoined && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-center gap-4 px-6 py-6 bg-white border-t-2 border-orange-100 shadow-lg"
        >
          <button
            onClick={toggleVideo}
            className={`p-5 rounded-full transition-all shadow-md hover:shadow-lg ${
              isVideoEnabled
                ? "bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-200"
                : "bg-red-500 hover:bg-red-600 text-white border-2 border-red-600"
            }`}
            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoEnabled ? (
              <IconVideo className="w-6 h-6" />
            ) : (
              <IconVideoOff className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-5 rounded-full transition-all shadow-md hover:shadow-lg ${
              isAudioEnabled
                ? "bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-200"
                : "bg-red-500 hover:bg-red-600 text-white border-2 border-red-600"
            }`}
            title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {isAudioEnabled ? (
              <IconMicrophone className="w-6 h-6" />
            ) : (
              <IconMicrophoneOff className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={handleLeave}
            disabled={isLoading}
            className="p-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-neutral-300 disabled:to-neutral-400 text-white rounded-full transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed border-2 border-red-600"
            title="Leave call"
          >
            <IconPhoneOff className="w-6 h-6" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
