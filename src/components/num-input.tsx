import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export function NumInput({
  value,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  className,
  disabled,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const commit = () => {
    const n = Number(text.replace(/[^0-9]/g, ""));
    const next = Number.isFinite(n) ? n : min;
    const clamped = Math.max(min, Math.min(max, next));
    onChange(clamped);
    setText(String(clamped));
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={text}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={className}
    />
  );
}
