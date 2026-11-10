import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface UserAvatarProps {
  user: Pick<User, "name" | "avatarColor">;
  size?: number; // px
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserAvatar({ user, size = 28, className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: user.avatarColor,
        fontSize: Math.round(size * 0.4),
      }}
      aria-hidden="true"
    >
      {initials(user.name)}
    </span>
  );
}
