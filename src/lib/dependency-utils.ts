import type { Dependency } from "@/types";

/** Would "predecessor must finish before successor" create a loop? */
export function wouldCreateCycle(
  deps: Dependency[],
  predecessorId: string,
  successorId: string,
): boolean {
  if (predecessorId === successorId) return true;
  const stack = [successorId];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (current === predecessorId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const d of deps) {
      if (d.predecessorId === current) stack.push(d.successorId);
    }
  }
  return false;
}
