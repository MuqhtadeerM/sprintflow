"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "4rem 1rem",
          textAlign: "center",
        }}
      >
        <h1>SprintFlow couldn&apos;t start</h1>
        <p>Something went wrong while loading the app.</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </body>
    </html>
  );
}
