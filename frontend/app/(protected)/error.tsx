"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProtectedError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <Card className="border-red-400/15 bg-red-500/10">
        <CardHeader>
          <div className="flex items-center gap-3 text-red-100">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/15">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Workspace view unavailable</CardTitle>
              <CardDescription className="text-white/65">This section hit a recoverable rendering error.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-white/70">{error.message || "Please retry this workspace view."}</p>
          <Button onClick={() => unstable_retry()} className="rounded-full bg-white text-black hover:bg-white/90">
            <RefreshCcw className="mr-2 size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
