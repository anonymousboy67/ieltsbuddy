"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";

interface UseWebRTCParams {
  socket: Socket | null;
  roomId: string | null;
  isInitiator: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:a.relay.metered.ca:80" },
    {
      urls: "turn:a.relay.metered.ca:80",
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    },
    {
      urls: "turn:a.relay.metered.ca:80?transport=tcp",
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    },
    {
      urls: "turn:a.relay.metered.ca:443",
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    },
    {
      urls: "turn:a.relay.metered.ca:443?transport=tcp",
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    },
  ],
};

export function useWebRTC({ socket, roomId, isInitiator }: UseWebRTCParams) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // FIX 1: Queue candidates that arrive before remoteDescription is set
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    iceCandidateQueue.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("closed");
  }, []);

  const endCall = useCallback(() => {
    if (socket && roomId) {
      socket.emit("end-call", { roomId });
    }
    cleanup();
  }, [socket, roomId, cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Apply remote description then flush any queued ICE candidates
  async function applyRemoteDescriptionAndFlush(
    pc: RTCPeerConnection,
    description: RTCSessionDescriptionInit
  ) {
    await pc.setRemoteDescription(new RTCSessionDescription(description));
    // Flush all candidates that arrived before remoteDescription was ready
    for (const candidate of iceCandidateQueue.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // ignore stale candidates
      }
    }
    iceCandidateQueue.current = [];
  }

  useEffect(() => {
    if (!socket || !roomId) return;

    const sock = socket;
    let cancelled = false;

    async function startConnection() {
      // Get microphone access
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Microphone access denied. Please allow microphone access to join the call."
            : "Could not access microphone. Please check your device settings.";
        setMicError(msg);
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      const remote = new MediaStream();
      setRemoteStream(remote);

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remote.addTrack(track);
        });
        setRemoteStream(new MediaStream(remote.getTracks()));
      };

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      // Send our ICE candidates to the peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sock.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };

      // FIX 1 + FIX 2: Named handler — queues candidates before remoteDescription,
      // and allows precise cleanup (not sock.off("ice-candidate") which removes all)
      const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        if (!pc.remoteDescription) {
          iceCandidateQueue.current.push(candidate);
        } else {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            // ignore stale candidates
          }
        }
      };

      // FIX 3: Register offer + answer listeners BEFORE sending the offer so the
      // responder's listener is ready even if the offer arrives immediately.
      const handleOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
        if (pc.signalingState !== "stable") return;
        await applyRemoteDescriptionAndFlush(pc, offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sock.emit("answer", { roomId, answer });
      };

      const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
        if (pc.signalingState === "have-local-offer") {
          await applyRemoteDescriptionAndFlush(pc, answer);
        }
      };

      sock.on("ice-candidate", handleIceCandidate);
      sock.on("offer", handleOffer);
      sock.on("answer", handleAnswer);

      // Only the initiator sends the offer; responder waits via the listener above
      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sock.emit("offer", { roomId, offer });
      }

      return { handleIceCandidate, handleOffer, handleAnswer };
    }

    const handlersPromise = startConnection();

    return () => {
      cancelled = true;
      // FIX 2: Remove only OUR named listeners, not every listener on the socket
      handlersPromise.then((handlers) => {
        if (handlers) {
          sock.off("offer", handlers.handleOffer);
          sock.off("answer", handlers.handleAnswer);
          sock.off("ice-candidate", handlers.handleIceCandidate);
        }
      });
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomId, isInitiator]);

  return {
    localStream,
    remoteStream,
    isMuted,
    micError,
    connectionState,
    toggleMute,
    endCall,
  };
}
