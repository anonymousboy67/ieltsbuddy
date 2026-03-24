"use client";

import { useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";

type MicState = "idle" | "listening" | "processing";

interface MicVisualizerProps {
  state: MicState;
  onToggle: () => void;
  duration: number;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function MicVisualizer({
  state,
  onToggle,
  duration,
}: MicVisualizerProps) {
  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isListening) {
      cancelAnimationFrame(animFrameRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;

    async function startVisualizer() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
          if (!analyserRef.current || !ctx || !canvas) return;
          animFrameRef.current = requestAnimationFrame(draw);
          analyserRef.current.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.5;
          const centerY = canvas.height / 2;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * centerY * 0.8;
            const gradient = ctx.createLinearGradient(
              x, centerY - barHeight,
              x, centerY + barHeight
            );
            gradient.addColorStop(0, "rgba(4, 120, 87, 0.8)");
            gradient.addColorStop(0.5, "rgba(4, 120, 87, 0.4)");
            gradient.addColorStop(1, "rgba(4, 120, 87, 0.8)");
            ctx.fillStyle = gradient;
            ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);
            x += barWidth;
          }
        }
        draw();
      } catch {
        // mic access denied — fail silently
      }
    }

    startVisualizer();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioCtx) audioCtx.close();
      analyserRef.current = null;
    };
  }, [isListening]);

  return (
    <div className="mt-8 flex flex-col items-center">
      {/* Waveform canvas */}
      <div className="relative mb-4 h-16 w-full max-w-xs overflow-hidden rounded-xl">
        <canvas
          ref={canvasRef}
          width={300}
          height={64}
          className="h-full w-full"
        />
        {!isListening && !isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-[#E7E5E4]"
                  style={{ height: `${8 + Math.sin(i * 0.5) * 8}px` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Duration */}
      {isListening && (
        <p className="mb-3 font-mono text-lg font-medium text-[#047857]">
          {formatDuration(duration)}
        </p>
      )}

      {/* Mic button */}
      <button
        onClick={onToggle}
        disabled={isProcessing}
        className="relative flex h-[88px] w-[88px] cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={isListening ? "Stop speaking" : "Start speaking"}
      >
        <span
          className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
            isListening
              ? "animate-pulse border-[rgba(185,28,28,0.32)]"
              : isProcessing
                ? "border-[rgba(4,120,87,0.08)]"
                : "border-[rgba(4,120,87,0.22)]"
          }`}
        />
        <span
          className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-300 ${
            isListening ? "bg-[#B91C1C]" : "bg-[#047857]"
          }`}
        >
          {isListening ? (
            <Square size={20} strokeWidth={1.75} className="text-white" />
          ) : (
            <Mic size={24} strokeWidth={1.75} className="text-white" />
          )}
        </span>
      </button>

      <p
        className={`mt-3 text-sm transition-colors duration-200 ${
          isListening
            ? "text-[#B91C1C]"
            : isProcessing
              ? "text-[#78716C]"
              : "text-[#57534E]"
        }`}
      >
        {isListening
          ? "Recording... tap to stop"
          : isProcessing
            ? "Evaluating your response..."
            : "Tap to start speaking"}
      </p>
    </div>
  );
}
