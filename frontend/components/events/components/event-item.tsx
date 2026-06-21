"use client";

import type { EventLog } from "../types";
import { buildDisplayEvent } from "../utils/event-display";
import { formatEventTime } from "../utils/format-event-time";
import { getEventPresentation } from "../utils/event-type-mapping";

type EventItemProps = {
  event: EventLog;
};

function EventItem({ event }: EventItemProps) {
  const presentation = getEventPresentation(event);
  const display = buildDisplayEvent(event);
  const Icon = presentation.icon;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 px-3.5 py-2.5">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-2xl border ${presentation.tone}`}>
          <Icon className="size-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-white">{display.headline}</h4>
              <p className="mt-0.5 text-sm leading-5 text-white/65">{display.details}</p>
            </div>
            <time className="shrink-0 text-xs text-white/40" dateTime={event.createdAt}>
              {formatEventTime(event.createdAt)}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
}

export { EventItem };
