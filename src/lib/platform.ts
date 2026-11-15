/** "⌘" on Apple devices, "Ctrl" elsewhere. Call at render time, not at import. */
export const modKey = (): string =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
    ? "⌘"
    : "Ctrl";
