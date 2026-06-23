import * as React from "react";

import { cn } from "@/lib/utils";

// Reward badge (handover §4.2 — D-047). The celebratory "IQ UP! Истражувач" tile
// tied to the 100% puzzle-brain: a violet rounded tile + a purpose-built yellow
// star + a warm, child-facing line. Decorative star is custom SVG (brand §6), not
// an emoji. Pure/presentational — the parent composes it with the whole brain on
// the completion screen.
interface RewardBadgeProps {
  title: string;
  line?: string;
  className?: string;
}

function StarBurst() {
  return (
    <svg
      viewBox="0 0 100 100"
      width={56}
      height={56}
      role="presentation"
      aria-hidden
    >
      <polygon
        points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"
        fill="#FFC20E"
        stroke="#F7941D"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <circle cx={50} cy={52} r={9} fill="#FFFFFF" fillOpacity={0.9} />
    </svg>
  );
}

function RewardBadge({ title, line, className }: RewardBadgeProps) {
  return (
    <div
      data-slot="reward-badge"
      className={cn(
        "flex flex-col items-center gap-3 rounded-card-lg bg-pur px-7 py-6 text-center text-white",
        className,
      )}
    >
      <StarBurst />
      <p className="text-subhead font-extrabold text-white">{title}</p>
      {line && <p className="text-body text-white/85">{line}</p>}
    </div>
  );
}

export { RewardBadge };
