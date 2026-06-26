"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, CircleGauge, RotateCcw, Sparkles, Sparkles as SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { KanbanInsightRecommendation, KanbanInsightsData } from "@/types/kanban-ai";

type KanbanAiInsightsProps = {
  projectName: string;
  insights: KanbanInsightsData | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

function toneClasses(tone: KanbanInsightsData["projectHealth"]["tone"]) {
  switch (tone) {
    case "good":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
    case "warn":
      return "border-amber-400/20 bg-amber-500/10 text-amber-100";
    case "critical":
      return "border-rose-400/20 bg-rose-500/10 text-rose-100";
    case "neutral":
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function recommendationTone(priority: KanbanInsightRecommendation["priority"]) {
  switch (priority) {
    case "HIGH":
      return "border-rose-400/20 bg-rose-500/10 text-rose-100";
    case "MEDIUM":
      return "border-amber-400/20 bg-amber-500/10 text-amber-100";
    case "LOW":
    default:
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }
}

function MetricTile({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper?: string;
  tone: "good" | "neutral" | "warn" | "critical";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold", tone === "good" ? "text-emerald-100" : tone === "warn" ? "text-amber-100" : tone === "critical" ? "text-rose-100" : "text-white")}>
        {value}
      </p>
      {helper ? <p className="mt-1 text-sm text-white/55">{helper}</p> : null}
    </div>
  );
}

function KanbanAiRecommendationCard({ recommendation }: { recommendation: KanbanInsightRecommendation }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-white">
            <Sparkles className="size-4 text-violet-200" />
            <span className="font-medium">{recommendation.title}</span>
          </div>
          <p className="text-sm leading-6 text-white/60">{recommendation.summary}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">{recommendation.taskTitle}</span>
            {recommendation.currentColumn ? (
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">{recommendation.currentColumn}</span>
            ) : null}
            {recommendation.from && recommendation.to ? (
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                {recommendation.from} <ArrowRight className="inline size-3 align-[-1px]" /> {recommendation.to}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant="muted" className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em]", recommendationTone(recommendation.priority))}>
            {recommendation.priority}
          </Badge>
          <Badge variant="muted" className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-white/65">
            {recommendation.confidence} CONFIDENCE
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {recommendation.reason.slice(0, 3).map((reason) => (
          <span key={reason} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/60">
            {reason}
          </span>
        ))}
      </div>
    </div>
  );
}

function KanbanAiInsights({
  projectName,
  insights,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: KanbanAiInsightsProps) {
  const [viewAllOpen, setViewAllOpen] = useState(false);

  if (isLoading) {
    return (
      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="space-y-3">
            <div className="h-5 w-52 rounded-full bg-white/10" />
            <div className="h-4 w-72 rounded-full bg-white/5" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 rounded-2xl border border-white/10 bg-white/[0.03]" />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-24 rounded-2xl border border-white/10 bg-white/[0.03]" />
              <div className="h-24 rounded-2xl border border-white/10 bg-white/[0.03]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="space-y-3">
            <div className="h-5 w-48 rounded-full bg-white/10" />
            <div className="h-4 w-64 rounded-full bg-white/5" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-400/15 bg-red-500/10">
        <CardHeader>
          <div className="flex items-center gap-3 text-red-100">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/15">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">AI Kanban Intelligence</CardTitle>
              <CardDescription className="text-white/65">{errorMessage ?? "We could not load Kanban insights right now."}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={onRetry} className="rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/15">
            <RotateCcw className="mr-2 size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  const visibleRecommendations = insights.recommendations.slice(0, 3);
  const hasMoreRecommendations = insights.recommendations.length > visibleRecommendations.length;

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="relative overflow-hidden border-violet-500/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_26%),rgba(255,255,255,0.04)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),transparent_40%,rgba(59,130,246,0.06))]" />
          <CardHeader className="relative space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/15 text-violet-100 shadow-[0_0_30px_rgba(168,85,247,0.24)]">
                <CircleGauge className="size-5" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Kanban Intelligence</CardTitle>
                <CardDescription>Explainable workflow signals for {projectName}.</CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="purple" className={cn("rounded-full border px-3 py-1 text-xs font-medium", toneClasses(insights.projectHealth.tone))}>
                Health {insights.projectHealth.score}%
              </Badge>
              <Badge variant="muted" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                {insights.projectHealth.label}
              </Badge>
              <Badge variant="muted" className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                {insights.workflowSummary.recommendedMoves} suggestion{insights.workflowSummary.recommendedMoves === 1 ? "" : "s"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
              <div className="flex items-center gap-2 text-violet-100">
                <BadgeCheck className="size-4" />
                Project signal
              </div>
              <p className="mt-2 leading-6 text-white/65">{insights.projectHealth.reason}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Ready" value={String(insights.workflowSummary.ready)} helper="Tasks ready to pull." tone="good" />
              <MetricTile label="Blocked" value={String(insights.workflowSummary.blocked)} helper="Waiting on dependencies." tone={insights.workflowSummary.blocked > 0 ? "critical" : "neutral"} />
              <MetricTile label="Overdue" value={String(insights.workflowSummary.overdue)} helper="Past the due date." tone={insights.workflowSummary.overdue > 0 ? "warn" : "neutral"} />
              <MetricTile label="Idle" value={String(insights.workflowSummary.idle)} helper="No recent movement." tone={insights.workflowSummary.idle > 0 ? "warn" : "good"} />
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-white/55">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Total {insights.workflowSummary.totalTasks}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Completed {insights.workflowSummary.completed}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">In progress {insights.workflowSummary.inProgress}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Review {insights.workflowSummary.review}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Unassigned {insights.workflowSummary.unassigned}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-blue-100">
                <SparklesIcon className="size-5" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Suggestions</CardTitle>
                <CardDescription>Top explainable moves based on live Kanban signals.</CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="blue" className="rounded-full border-blue-400/20 bg-blue-500/10 text-blue-100">
                {visibleRecommendations.length} shown
              </Badge>
              <Badge variant="muted" className="rounded-full border-white/10 bg-white/5 text-white/65">
                {insights.recommendations.length} total
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {visibleRecommendations.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/60">
                No AI suggestions right now. The workflow is looking steady.
              </div>
            ) : (
              visibleRecommendations.map((recommendation) => (
                <KanbanAiRecommendationCard key={recommendation.id} recommendation={recommendation} />
              ))
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-white/45">Explainable only. No automatic changes will be made.</p>
              <Button
                type="button"
                onClick={() => setViewAllOpen(true)}
                disabled={!hasMoreRecommendations && insights.recommendations.length === 0}
                className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={viewAllOpen}
        onOpenChange={setViewAllOpen}
        title="AI Kanban Suggestions"
        description="Explainable recommendations generated from current workflow signals."
        size="xl"
      >
        <div className="space-y-4">
          {insights.recommendations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">There are no recommendations to review yet.</div>
          ) : (
            insights.recommendations.map((recommendation) => <KanbanAiRecommendationCard key={recommendation.id} recommendation={recommendation} />)
          )}
        </div>
      </Dialog>
    </>
  );
}

export { KanbanAiInsights };
