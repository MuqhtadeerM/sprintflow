"use client";

export interface ArrowShape {
  id: string;
  d: string;
  conflict: boolean;
  selected: boolean;
}

export interface LinkLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface DependencyLayerProps {
  width: number;
  height: number;
  arrows: ArrowShape[];
  linkLine: LinkLine | null;
  onSelect: (id: string) => void;
}

const COLORS = {
  normal: "var(--muted-foreground)",
  selected: "var(--primary)",
  conflict: "#ef4444",
} as const;

function Marker({ id, fill }: { id: string; fill: string }) {
  return (
    <marker
      id={id}
      markerUnits="userSpaceOnUse"
      markerWidth="9"
      markerHeight="9"
      refX="8"
      refY="4.5"
      orient="auto"
    >
      <path d="M0,0 L9,4.5 L0,9 z" style={{ fill }} />
    </marker>
  );
}

export function DependencyLayer({
  width,
  height,
  arrows,
  linkLine,
  onSelect,
}: DependencyLayerProps) {
  return (
    <svg
      width={width}
      height={height}
      role="presentation"
      className="pointer-events-none absolute left-0 top-0 z-10"
    >
      <defs>
        <Marker id="gantt-arrow-normal" fill={COLORS.normal} />
        <Marker id="gantt-arrow-selected" fill={COLORS.selected} />
        <Marker id="gantt-arrow-conflict" fill={COLORS.conflict} />
      </defs>

      {arrows.map((a) => {
        const kind = a.selected
          ? "selected"
          : a.conflict
            ? "conflict"
            : "normal";
        return (
          <g key={a.id}>
            <path
              d={a.d}
              fill="none"
              style={{
                stroke: COLORS[kind],
                strokeWidth: a.selected ? 2.5 : 1.5,
                strokeDasharray: a.conflict ? "5 3" : undefined,
                opacity: a.selected || a.conflict ? 1 : 0.65,
              }}
              markerEnd={`url(#gantt-arrow-${kind})`}
            />
            {/* Wide invisible stroke, so thin arrows are easy to click */}
            <path
              d={a.d}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              style={{ pointerEvents: "stroke", cursor: "pointer" }}
              onClick={() => onSelect(a.id)}
            />
          </g>
        );
      })}

      {linkLine && (
        <line
          x1={linkLine.x1}
          y1={linkLine.y1}
          x2={linkLine.x2}
          y2={linkLine.y2}
          style={{
            stroke: COLORS.selected,
            strokeWidth: 2,
            strokeDasharray: "4 3",
          }}
        />
      )}
    </svg>
  );
}
