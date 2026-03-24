"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, CheckCircle } from "lucide-react";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept: string;
  endpoint: "/api/admin/upload-image" | "/api/admin/upload-audio";
  folder?: string;
  label?: string;
}

export default function FileUpload({
  value,
  onChange,
  accept,
  endpoint,
  folder = "ieltsbuddy",
  label = "Upload file",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    setProgress(10);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      // Simulate progress
      const progressTimer = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 300);

      const res = await fetch(endpoint, { method: "POST", body: fd });
      clearInterval(progressTimer);

      if (res.ok) {
        const { url } = await res.json();
        setProgress(100);
        onChange(url);
      } else {
        const data = await res.json();
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }

  const isImage = accept.startsWith("image");
  const isAudio = accept.startsWith("audio");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${label} URL (or upload)`}
          className="flex-1 rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]"
        />
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border-[0.5px] border-[#2A3150] bg-[#1E2540] text-[#94A3B8] transition-all hover:border-[#6366F1] hover:text-white disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
          ) : (
            <Upload size={16} strokeWidth={1.75} />
          )}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:text-[#EF4444]"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {uploading && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#2A3150]">
          <div
            className="h-1 rounded-full bg-[#6366F1] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="text-xs text-[#EF4444]">{error}</p>}

      {value && !uploading && (
        <div className="flex items-center gap-2">
          <CheckCircle size={12} strokeWidth={1.75} className="text-[#22C55E]" />
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Preview" className="h-16 rounded-lg border-[0.5px] border-[#2A3150] object-cover" />
          )}
          {isAudio && (
            <audio src={value} controls className="h-8" />
          )}
          {!isImage && !isAudio && (
            <span className="truncate text-xs text-[#22C55E]">{value.split("/").pop()}</span>
          )}
        </div>
      )}
    </div>
  );
}
