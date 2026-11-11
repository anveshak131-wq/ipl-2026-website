export default function NewsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-label="Loading 2027 season newsroom">
      {/* Countdown Strip Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="h-24 rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-center justify-between"
          >
            <div className="space-y-2.5 w-2/3">
              <div className="h-3 w-20 bg-white/10 rounded-full" />
              <div className="h-4 w-40 bg-white/15 rounded" />
              <div className="h-3 w-28 bg-white/10 rounded" />
            </div>
            <div className="h-12 w-16 rounded-xl bg-white/10" />
          </div>
        ))}
      </div>

      {/* Bento Hero Spotlight Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-[420px] rounded-3xl bg-white/[0.05] border border-white/10 p-6 flex flex-col justify-end space-y-4">
          <div className="h-4 w-32 bg-white/15 rounded-full" />
          <div className="h-8 w-5/6 bg-white/20 rounded-lg" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-2/3 bg-white/10 rounded" />
        </div>
        <div className="lg:col-span-5 space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="h-[126px] rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-center gap-4"
            >
              <div className="w-28 h-20 rounded-xl bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-3 w-20 bg-white/10 rounded-full" />
                <div className="h-4 w-full bg-white/15 rounded" />
                <div className="h-3 w-24 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Magazine Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden"
          >
            <div className="aspect-[16/9] bg-white/10" />
            <div className="p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-white/10 rounded-full" />
                <div className="h-4 w-14 bg-white/10 rounded-full" />
              </div>
              <div className="h-5 w-11/12 bg-white/15 rounded" />
              <div className="h-4 w-full bg-white/10 rounded" />
              <div className="h-4 w-3/4 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
