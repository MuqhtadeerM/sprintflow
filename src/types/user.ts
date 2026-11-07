export type UserRole = "admin" | "lead" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string; // tailwind-friendly hex, used for initials avatar
  role: UserRole;
}
