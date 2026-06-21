function TimelineSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="size-9 animate-pulse rounded-2xl bg-white/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/5 animate-pulse rounded-full bg-white/10" />
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/10" />
              <div className="h-3 w-1/4 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { TimelineSkeleton };
