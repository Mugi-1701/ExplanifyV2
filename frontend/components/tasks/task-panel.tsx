"use client";

import { motion } from "framer-motion";
import { PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task } from "@/types/task";
import { TaskBadges } from "./task-badges";
import { getTaskDependencyNodes } from "./task-utils";

type TaskPanelProps = {
  task: Task | null;
  onEdit: (task: Task) => void;
};

function TaskPanel({ task, onEdit }: TaskPanelProps) {
  if (!task) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-xl text-white">Task details</CardTitle>
          <CardDescription className="text-white/60">Select a task to inspect its AI explanation and dependency graph.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-white">{task.title}</CardTitle>
              <CardDescription className="mt-2 text-white/60">{task.description || "No description provided."}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => onEdit(task)}
            >
              <PencilLine className="mr-2 size-4" />
              Edit
            </Button>
          </div>
          <TaskBadges task={task} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">AI explanation</p>
            <p className="mt-2 leading-6">{task.coordinationReason || "No coordination explanation available."}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Dependency state</p>
            <div className="mt-3 space-y-2">
              {getTaskDependencyNodes(task).length > 0 ? (
                getTaskDependencyNodes(task).map((dependency) => (
                  <div key={dependency.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span>{dependency.title}</span>
                    <span className="text-white/45">{dependency.status}</span>
                  </div>
                ))
              ) : (
                <p>No dependencies are currently blocking this task.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { TaskPanel };
