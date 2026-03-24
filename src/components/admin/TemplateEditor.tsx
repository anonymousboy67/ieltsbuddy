"use client";

import { useRef, useState, useCallback } from "react";
import { Plus, Eye, EyeOff, AlertCircle } from "lucide-react";

interface TemplateEditorProps {
  value: string;
  onChange: (val: string) => void;
  startQuestion: number;
  endQuestion: number;
}

export default function TemplateEditor({
  value,
  onChange,
  startQuestion,
  endQuestion,
}: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [nextNum, setNextNum] = useState(startQuestion || 1);

  const insertBlank = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const marker = `(${nextNum}) ......`;
    const newVal = value.slice(0, start) + marker + value.slice(end);
    onChange(newVal);
    setNextNum((n) => n + 1);
    // Restore focus after React re-render
    setTimeout(() => {
      ta.focus();
      const newPos = start + marker.length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  }, [value, onChange, nextNum]);

  // Find which question numbers have markers in the template
  const markerNums = new Set<number>();
  const markerPattern = /\((\d+)\)/g;
  let m;
  while ((m = markerPattern.exec(value)) !== null) {
    markerNums.add(parseInt(m[1]));
  }

  // Check for missing markers
  const missingNums: number[] = [];
  if (startQuestion && endQuestion) {
    for (let i = startQuestion; i <= endQuestion; i++) {
      if (!markerNums.has(i)) missingNums.push(i);
    }
  }

  // Render preview
  const renderPreview = () => {
    if (!value) return <span className="text-[#64748B] italic">No template text</span>;
    const parts = value.split(/\((\d+)\)\s*\.{0,6}/);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        const num = parseInt(part);
        return (
          <span key={i} className="inline-flex items-center gap-1">
            <span className="text-xs font-bold text-[#6366F1]">({num})</span>
            <span className="mx-1 inline-block w-24 rounded border-[0.5px] border-[#2A3150] bg-[#1E2540] px-2 py-0.5 text-center text-xs text-[#64748B]">
              ...
            </span>
          </span>
        );
      }
      return (
        <span key={i}>
          {part.split("\n").map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
      );
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#94A3B8]">Completion Template</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={insertBlank}
            className="inline-flex items-center gap-1 rounded-md bg-[rgba(99,102,241,0.15)] px-2 py-1 text-xs text-[#6366F1] transition-colors hover:bg-[rgba(99,102,241,0.25)]"
          >
            <Plus size={12} strokeWidth={1.75} />
            Insert ({nextNum}) ......
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-1 rounded-md bg-[#2A3150] px-2 py-1 text-xs text-[#94A3B8] transition-colors hover:text-white"
          >
            {showPreview ? <EyeOff size={12} strokeWidth={1.75} /> : <Eye size={12} strokeWidth={1.75} />}
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="min-h-[100px] rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] p-4 text-sm leading-relaxed text-[#94A3B8]">
          {renderPreview()}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          placeholder="Template text with blanks marked as (7) ...... (8) ...... etc."
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 font-mono text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]"
        />
      )}

      {missingNums.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-[rgba(245,158,11,0.1)] px-3 py-2">
          <AlertCircle size={14} strokeWidth={1.75} className="flex-shrink-0 text-[#F59E0B]" />
          <span className="text-xs text-[#F59E0B]">
            Missing markers for Q: {missingNums.join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
