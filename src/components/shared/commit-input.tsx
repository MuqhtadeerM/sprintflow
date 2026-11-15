"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

interface CommitInputProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "onBlur" | "onFocus"
> {
  value: string;
  onCommit: (next: string) => void;
}

/**
 * While focused it shows your draft. Otherwise it shows the real value, so
 * outside changes (like an undo later) appear without any syncing effect.
 */
export function CommitInput({
  value,
  onCommit,
  onKeyDown,
  ...props
}: CommitInputProps) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);

  return (
    <Input
      {...props}
      value={focused ? draft : value}
      onFocus={() => {
        setDraft(value);
        setFocused(true);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setFocused(false);
        if (draft !== value) onCommit(draft);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
