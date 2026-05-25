import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPriorityTone, getStatusTone } from "./task-utils";
import type { Task } from "@/types/task";

type TaskBadgesProps = {
  task: Task;
};

function TaskBadges({ task }: TaskBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default" className={cn(getStatusTone(task.status), "capitalize")}>{task.status.replaceAll("_", " ")}</Badge>
      <Badge variant="default" className={getPriorityTone(task.priority)}>{task.priority ?? "MEDIUM"}</Badge>
      {task.isBlocked ? <Badge variant="warning">Blocked</Badge> : <Badge variant="success">Ready</Badge>}
    </div>
  );
}

export { TaskBadges };