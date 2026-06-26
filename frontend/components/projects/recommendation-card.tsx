"use client";

import { MoveRight } from "lucide-react";

import type { AIWorkloadRecommendation } from "@/types/ai";

function RecommendationCard({ recommendation }: { recommendation: AIWorkloadRecommendation }) {
  const priority = recommendation.priority ?? derivePriority(recommendation.reason);
  const confidence = recommendation.confidence ?? deriveConfidence(recommendation.reason);

  return (
    <div className="rounded-2xl border border-blue-400/15 bg-blue-500/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-sm text-white">
            <MoveRight className="size-4 text-blue-200" />
            <span className="font-medium">{recommendation.taskTitle}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 font-medium text-violet-100">
              {recommendation.from}
            </span>
            <span className="text-white/45">→</span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-100">
              {recommendation.to}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <SmallTag label={priority} tone={priority.toLowerCase() as "high" | "medium" | "low" | "confidence"} />
          <SmallTag label={`${confidence} CONFIDENCE`} tone="confidence" />
        </div>
      </div>

      <ul className="mt-2 space-y-1 text-xs text-blue-100/80">
        {recommendation.reason.map((reason) => (
          <li key={reason}>• {reason}</li>
        ))}
      </ul>
    </div>
  );
}

function SmallTag({
  label,
  tone,
}: {
  label: string;
  tone: "high" | "medium" | "low" | "confidence";
}) {
  const tones = {
    high: "bg-rose-500/15 text-rose-100 border-rose-400/20",
    medium: "bg-amber-500/15 text-amber-100 border-amber-400/20",
    low: "bg-emerald-500/15 text-emerald-100 border-emerald-400/20",
    confidence: "bg-violet-500/15 text-violet-100 border-violet-400/20",
  } as const;

  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${tones[tone]}`}>
      {label}
    </span>
  );
}

function derivePriority(reason: string[]) {
  const text = reason.join(" ").toLowerCase();
  if (text.includes("high") || text.includes("urgent") || text.includes("critical")) return "HIGH";
  if (text.includes("medium") || text.includes("moderate") || text.includes("balanced")) return "MEDIUM";
  return "LOW";
}

function deriveConfidence(reason: string[]) {
  const text = reason.join(" ").toLowerCase();
  if (text.includes("confidence") || text.includes("strong") || text.includes("94%")) return "HIGH";
  if (text.includes("moderate") || text.includes("balanced")) return "MEDIUM";
  return "LOW";
}

export { RecommendationCard };
