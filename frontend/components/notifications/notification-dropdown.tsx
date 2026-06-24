"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "./types";
import { formatRelativeTime, getNotificationPresentation } from "./utils";
import { markAllNotificationsRead } from "./api";
import { useNotifications } from "@/hooks/useNotifications";
import { notificationsQueryKey } from "@/hooks/useNotifications";

type NotificationDropdownProps = {
  className?: string;
};

function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const { data, unreadCount, isLoading, isFetching, error } = useNotifications();
  const markReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey });
      const previous = queryClient.getQueryData<{ data?: NotificationItem[]; unreadCount?: number }>(notificationsQueryKey);

      queryClient.setQueryData(notificationsQueryKey, (current: { data?: NotificationItem[]; unreadCount?: number } | undefined) => ({
        data: current?.data ?? previous?.data ?? [],
        unreadCount: 0,
      }));

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log({
      isLoading,
      isFetching,
      error,
      queryData: data,
      notifications: data?.data,
    });
  }, [data, error, isFetching, isLoading]);

  useEffect(() => {
    if (!open || hasMarkedRead || markReadMutation.isPending) {
      return;
    }

    setHasMarkedRead(true);
    void markReadMutation.mutateAsync();
  }, [hasMarkedRead, markReadMutation, open]);

  useEffect(() => {
    if (open) {
      setHasMarkedRead(false);
    }
  }, [open]);

  const latestNotifications = useMemo(() => (data?.data ?? []).slice(0, 5), [data?.data]);
  const showSkeleton = open && (isLoading || isFetching) && latestNotifications.length === 0;
  const showEmptyState = !showSkeleton && latestNotifications.length === 0;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((next) => !next)}
        className="relative border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full border border-rose-400/25 bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-[0_8px_20px_rgba(244,63,94,0.35)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(92vw,22rem)] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#09111f]/98 shadow-[0_35px_90px_-32px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Notifications</p>
              <p className="text-xs text-white/45">Latest workspace activity</p>
            </div>
            <Badge variant="muted" className="border-white/10 bg-white/5 text-white/65">
              {unreadCount} unread
            </Badge>
          </div>

          <div className="max-h-[22rem] overflow-y-auto p-2">
            {showSkeleton ? (
              <div className="space-y-2 p-2">
                <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
                <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
                <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
              </div>
            ) : latestNotifications.length > 0 ? (
              <div className="space-y-2">
                {latestNotifications.map((notification) => (
                  <NotificationRow key={notification.id} notification={notification} />
                ))}
              </div>
            ) : showEmptyState || error ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/55">
                No notifications yet
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 p-2">
            <Button asChild variant="ghost" className="w-full justify-between rounded-2xl px-4 text-white/80 hover:bg-white/10">
              <Link href="/notifications" onClick={() => setOpen(false)}>
                <span>View All Notifications</span>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  const presentation = getNotificationPresentation(notification);
  const Icon = presentation.icon;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-colors hover:border-white/15 hover:bg-white/5">
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl border", presentation.tone)}>
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
}

export { NotificationDropdown };
