"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIRecommendationData } from "@/types/ai";

type AIRecommendationCardProps = {
  recommendation: AIRecommendationData | null;
  loading?: boolean;
  error?: string | null;
  applied?: boolean;
  onUseRecommendation: () => void;
};

function AIRecommendationCard({ recommendation, loading = false, error, applied = false, onUseRecommendation }: AIRecommendationCardProps) {
  const isFallback = Boolean(recommendation && "recommendedUserId" in recommendation && recommendation.recommendedUserId === null);
  const matchScore = recommendation ? Math.round(recommendation.score * 100) : null;

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg text-white">AI Recommendation</CardTitle>
        <CardDescription className="text-white/60">Deterministic assignee suggestion based on required skills and workload.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-white/60">AI analyzing...</p>
        ) : error ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
        ) : recommendation ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-white/70">
                Recommended: <span className="font-semibold text-white">{isFallback ? "No recommendation available" : recommendation.recommendedMember.name}</span>
              </div>
              <Badge variant={recommendation.confidence === "high" ? "success" : recommendation.confidence === "medium" ? "warning" : "muted"}>
                Confidence: {recommendation.confidence.charAt(0).toUpperCase() + recommendation.confidence.slice(1)}
              </Badge>
              {matchScore !== null ? <Badge variant="blue">Match Score: {matchScore}%</Badge> : null}
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Why?</p>
              <ul className="space-y-1 text-sm text-white/70">
                {(recommendation?.reasons ?? []).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-emerald-300">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {isFallback ? (
              <p className="text-sm text-white/55">No recommendation available.</p>
            ) : (
              <Button
                type="button"
                onClick={onUseRecommendation}
                disabled={applied}
                variant={applied ? "outline" : "default"}
                className={
                  applied
                    ? "cursor-not-allowed rounded-2xl border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/10"
                    : "rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95"
                }
              >
                {applied ? "Recommendation Applied" : "Apply Recommendation"}
              </Button>
            )}

            {applied ? <p className="text-xs text-emerald-200/80">AI recommendation applied to assignee field.</p> : null}
          </>
        ) : (
          <p className="text-sm text-white/50">Request an AI recommendation to see a suggested assignee.</p>
        )}
      </CardContent>
    </Card>
  );
}

export { AIRecommendationCard };
