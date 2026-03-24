"use client";

import { useEffect, useRef } from "react";

interface AudioBarsProps {
  color: string;
  label: string;
  stream: MediaStream | null;
}

const BAR_COUNT = 5;

export default function AudioBars({ color, label, stream }: AudioBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      if (!canvas || !analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth * dpr;
      const height = canvas.clientHeight * dpr;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / BAR_COUNT) * 0.5;
      const gap = (width - barWidth * BAR_COUNT) / (BAR_COUNT + 1);

      for (let i = 0; i < BAR_COUNT; i++) {
        // Sample from different frequency ranges
        const freqIndex = Math.floor((i / BAR_COUNT) * (dataArray.length * 0.6)) + 2;
        const value = dataArray[freqIndex] / 255;
        const barHeight = Math.max(value * height * 0.9, height * 0.08);

        const x = gap + i * (barWidth + gap);
        const y = height - barHeight;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      analyserRef.current = null;
      audioCtx.close();
    };
  }, [stream, color]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        className="h-10 w-16"
        style={{ imageRendering: "auto" }}
      />
      <span className="text-xs text-[#78716C]">{label}</span>
    </div>
  );
}
