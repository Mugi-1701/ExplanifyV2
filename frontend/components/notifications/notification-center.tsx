"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNotifications } from "./api";
import type { NotificationItem } from "./types";
import { formatRelativeTime, getNotificationPresentation } from "./utils";

function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let active = true;

    getNotifications().then((result) => {
      if (!active) return;
      setNotifications(result.notifications);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Notification Center</p>
        <CardTitle className="text-2xl text-white">All Notifications</CardTitle>
        <CardDescription className="text-white/60">
          Event-log powered notifications for the current workspace. This view is ready to swap to a dedicated notification table later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const presentation = getNotificationPresentation(notification);
              const Icon = presentation.icon;

              return (
                <article key={notification.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl border ${presentation.tone}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      <p className="mt-0.5 text-sm leading-5 text-white/60">{notification.body}</p>
                      <time className="mt-2 block text-xs text-white/40" dateTime={notification.createdAt}>
                        {formatRelativeTime(notification.createdAt)}
                      </time>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/55">
            No notifications yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { NotificationCenter };
