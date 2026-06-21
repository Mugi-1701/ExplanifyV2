"use client";

import { AlertTriangle, Activity, ChevronDown, ChevronRight, Filter, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventItem } from "./event-item";
import { TimelineSkeleton } from "./timeline-skeleton";
import { useActivityTimeline } from "../hooks/use-activity-timeline";
import { buildDisplayEvent } from "../utils/event-display";
import type { TimelineScope } from "../types";

type ActivityTimelineProps = {
  scope: TimelineScope;
  id?: string | null;
  title?: string;
  description?: string;
};

function ActivityTimeline({ scope, id, title = "Activity timeline", description = "Recent project events and team changes." }: ActivityTimelineProps) {
  const { events, loading, error, refetch } = useActivityTimeline(scope, id);
  const [filter, setFilter] = useState<"all" | "tasks" | "members" | "projects">("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Today: true,
    Yesterday: false,
    Older: false,
  });
  const storageKey = useMemo(() => `explanify:activity-groups:${scope}:${id ?? "missing"}`, [id, scope]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        setExpandedGroups((current) => ({ ...current, ...parsed }));
      }
    } catch {
      // Ignore storage failures and keep defaults.
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(expandedGroups));
    } catch {
      // Ignore storage failures and keep defaults.
    }
  }, [expandedGroups, storageKey]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") {
      return events;
    }

    return events.filter((event) => buildDisplayEvent(event).category === filter);
  }, [events, filter]);

  const groupedEvents = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-white">{title}</CardTitle>
            <CardDescription className="text-white/60">{description}</CardDescription>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60">
            <Activity className="size-4" />
          </div>
        </div>

        {!loading && !error ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 text-xs">
              <Filter className="ml-2 size-3.5 text-white/45" />
              {[
                { key: "all", label: "All" },
                { key: "tasks", label: "Tasks" },
                { key: "members", label: "Members" },
                { key: "projects", label: "Projects" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key as typeof filter)}
                  className={`rounded-full px-3 py-1.5 transition focus:outline-none focus:ring-2 focus:ring-violet-400/40 ${
                    filter === item.key ? "bg-violet-500/20 text-violet-100" : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`}
                  aria-pressed={filter === item.key}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        {loading ? <TimelineSkeleton /> : null}

        {!loading && error ? (
          <TimelineState
            tone={error}
            action={
              <Button variant="outline" size="sm" onClick={() => void refetch()} className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
                <RefreshCcw className="mr-2 size-4" />
                Retry
              </Button>
            }
            error
          />
        ) : null}

        {!loading && !error && events.length === 0 ? <TimelineState tone="No project activity yet." /> : null}

        {!loading && !error && events.length > 0 && filteredEvents.length === 0 ? <TimelineState tone="No activity matches this filter." /> : null}

        {!loading && !error && groupedEvents.length > 0 ? (
          <div className="space-y-4">
            {groupedEvents.map((group) => {
              const isExpanded = expandedGroups[group.label] ?? false;

              return (
                <div key={group.label} className="space-y-3">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 border-0 bg-transparent p-0 text-left outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpandedGroups((current) => ({
                        ...current,
                        [group.label]: !current[group.label],
                      }))
                    }
                  >
                    <span className="flex size-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55">
                      {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                      {group.label} ({group.events.length})
                    </h3>
                    <div className="h-px flex-1 bg-white/10" />
                  </button>

                  <div className={`grid transition-all duration-300 ease-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="min-h-0 overflow-hidden">
                      <div className="space-y-2.5">
                        {group.events.map((event) => (
                          <EventItem key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TimelineState({ tone, action, error = false }: { tone: string; action?: ReactNode; error?: boolean }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center">
      <div className={`rounded-full border p-3 ${error ? "border-red-400/20 bg-red-500/10 text-red-200" : "border-white/10 bg-white/5 text-white/60"}`}>
        <AlertTriangle className="size-5" />
      </div>
      <p className="text-sm text-white/60">{tone}</p>
      {action}
    </div>
  );
}

function groupEventsByDate(events: Array<{ createdAt: string; id: string } & Record<string, unknown>>) {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<"Today" | "Yesterday" | "Older", typeof events> = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  for (const event of events) {
    const eventDate = startOfDay(new Date(event.createdAt));

    if (sameDay(eventDate, today)) {
      groups.Today.push(event);
    } else if (sameDay(eventDate, yesterday)) {
      groups.Yesterday.push(event);
    } else {
      groups.Older.push(event);
    }
  }

  return [
    { label: "Today", events: groups.Today },
    { label: "Yesterday", events: groups.Yesterday },
    { label: "Older", events: groups.Older },
  ].filter((group) => group.events.length > 0);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function sameDay(left: Date, right: Date) {
  return left.getTime() === right.getTime();
}

export { ActivityTimeline };
