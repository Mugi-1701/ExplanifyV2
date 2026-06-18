import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

type TaskEmptyStateProps = {
  title?: string;
  description?: string;
  detail?: string;
};

function TaskEmptyState({
  title = "No tasks yet",
  description = "Create the first task for this project and the AI coordination layer will start tracking dependencies.",
  detail = "Task cards, blocked task indicators, and AI explanations will appear here once live data is available.",
}: TaskEmptyStateProps) {
  return <EmptyState icon={<Sparkles className="size-5" />} title={title} description={description} detail={detail} />;
}

export { TaskEmptyState };
