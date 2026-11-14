import { cn } from "@/lib/utils";

interface ToggleChipProps {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** Optional accent color (hex) used when pressed. */
  color?: string;
}

export function ToggleChip({
  pressed,
  onClick,
  children,
  color,
}: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
        pressed
          ? "border-primary/50 bg-primary/10 text-foreground shadow-sm"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
      style={
        pressed && color
          ? { borderColor: `${color}80`, backgroundColor: `${color}1a` }
          : undefined
      }
    >
      {children}
    </button>
  );
}
