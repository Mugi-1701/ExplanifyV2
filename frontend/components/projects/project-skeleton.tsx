import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ProjectSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardContent className="space-y-4 p-5 md:p-6">
          <Skeleton className="h-6 w-56 bg-white/10" />
          <Skeleton className="h-12 w-full bg-white/10" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-white/10 bg-white/[0.03]">
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-5 w-3/5 bg-white/10" />
              <Skeleton className="h-4 w-4/5 bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-24 w-full bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { ProjectSkeleton };