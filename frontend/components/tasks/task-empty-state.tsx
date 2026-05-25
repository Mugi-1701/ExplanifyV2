import { Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function TaskEmptyState() {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-100">
          <Sparkles className="size-5" />
        </div>
        <CardTitle className="mt-3 text-xl text-white">No tasks yet</CardTitle>
        <CardDescription className="text-white/60">
          Create the first task for this project and the AI coordination layer will start tracking dependencies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/55">
          Task cards, blocked task indicators, and AI explanations will appear here once live data is available.
        </div>
      </CardContent>
    </Card>
  );
}

export { TaskEmptyState };