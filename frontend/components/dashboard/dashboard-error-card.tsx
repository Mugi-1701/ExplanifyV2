"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardErrorCardProps = {
  message: string;
  onRetry: () => void;
};

function DashboardErrorCard({ message, onRetry }: DashboardErrorCardProps) {
  return (
    <PageContainer size="wide">
      <Card className="border-red-400/15 bg-red-500/10">
        <CardHeader>
          <div className="flex items-center gap-3 text-red-100">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/15">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Backend unavailable</CardTitle>
              <CardDescription className="text-white/65">We could not load live dashboard data right now.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-white/70">{message}</p>
          <Button onClick={onRetry} className="rounded-xl bg-white text-black hover:bg-white/90">
            <RefreshCcw className="mr-2 size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

export { DashboardErrorCard };
