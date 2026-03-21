import { Mic } from "lucide-react";

type MicState = "idle" | "listening" | "processing";

interface MicVisualizerProps {
  state: MicState;
  onToggle: () => void;
}

export default function MicVisualizer({ state, onToggle }: MicVisualizerProps) {
  const isListening = state === "listening";
  const isProcessing = state === "processing";

  return (
    <div className="mt-8 flex flex-col items-center">
      <button
        onClick={onToggle}
        className="relative flex h-[120px] w-[120px] cursor-pointer items-center justify-center"
        aria-label={isListening ? "Stop speaking" : "Start speaking"}
      >
        <span
          className={`mic-ring-outer absolute inset-0 rounded-full border-2 transition-all duration-300 ${
            isListening
              ? "pulsing border-[rgba(99,102,241,0.3)]"
              : isProcessing
                ? "border-[rgba(99,102,241,0.08)] opacity-50"
                : "border-[rgba(99,102,241,0.15)]"
          }`}
        />
        <span
          className={`mic-ring-inner absolute inset-3 rounded-full border-2 transition-all duration-300 ${
            isListening
              ? "pulsing border-[rgba(99,102,241,0.4)]"
              : isProcessing
                ? "border-[rgba(99,102,241,0.1)] opacity-50"
                : "border-[rgba(99,102,241,0.25)]"
          }`}
        />
        <span
          className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 ${
            isListening ? "bg-[#EF4444]" : "bg-[#6366F1]"
          }`}
        >
          <Mic size={24} strokeWidth={1.75} className="text-white" />
        </span>
      </button>

      <p
        className={`mt-4 text-sm transition-colors duration-200 ${
          isListening
            ? "text-[#6366F1]"
            : isProcessing
              ? "text-[#64748B]"
              : "text-[#94A3B8]"
        }`}
      >
        {isListening
          ? "Listening..."
          : isProcessing
            ? "Processing your response..."
            : "Tap to start speaking"}
      </p>
    </div>
  );
}
