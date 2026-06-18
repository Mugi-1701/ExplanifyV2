"use client";

import { motion } from "framer-motion";

import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <PageContainer size="wide">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-56 bg-white/10" />
          <Skeleton className="h-12 w-full max-w-2xl bg-white/10" />
          <Skeleton className="h-6 w-full max-w-3xl bg-white/10" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="flex min-h-[160px] flex-col border-white/10 bg-white/5">
              <CardContent className="flex flex-1 flex-col space-y-3 p-6">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-10 w-28 bg-white/10" />
                <Skeleton className="h-5 w-full bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-5 w-40 bg-white/10" />
              <Skeleton className="h-40 w-full bg-white/10" />
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-5 w-44 bg-white/10" />
              <Skeleton className="h-64 w-full bg-white/10" />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </PageContainer>
  );
}

export { DashboardSkeleton };
