"use client";
import { CSSProperties } from "react";

interface SliderProps {
  value: number;
  max: number;
  /** Fires continuously while dragging. */
  onChange: (value: number) => void;
  /** Fires once when the user releases (mouse/touch/keyboard) - use it to commit a seek. */
  onCommit?: (value: number) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export default function Slider({ value, max, onChange, onCommit, label, disabled, className = "" }: SliderProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const commit = (el: HTMLInputElement) => onCommit?.(Number(el.value));
  return (
    <input
      type="range"
      aria-label={label}
      className={`slider ${className}`}
      min={0}
      max={max || 1}
      step={1}
      value={Math.min(value, max || 1)}
      disabled={disabled}
      style={{ "--fill": `${pct}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
      onPointerUp={(e) => commit(e.currentTarget)}
      onKeyUp={(e) => commit(e.currentTarget)}
    />
  );
}
