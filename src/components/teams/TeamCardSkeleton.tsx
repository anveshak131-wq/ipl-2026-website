interface TeamCardSkeletonProps {
  delay?: number;
}

export default function TeamCardSkeleton({ delay = 0 }: TeamCardSkeletonProps) {
  return (
    <div 
      className="animate-pulse rounded-2xl bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-sm border border-white/10 p-6 md:p-8 space-y-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Logo skeleton */}
      <div className="flex justify-center">
        <div className="w-28 h-28 rounded-2xl bg-white/10" />
      </div>

      {/* Team name skeleton */}
      <div className="text-center space-y-2">
        <div className="h-8 w-20 mx-auto bg-white/10 rounded" />
        <div className="h-4 w-40 mx-auto bg-white/10 rounded" />
      </div>

      {/* Colors skeleton */}
      <div className="flex justify-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-white/10" />
        <div className="w-12 h-12 rounded-full bg-white/10" />
      </div>

      {/* Description skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-3/4 mx-auto" />
      </div>

      {/* Player count skeleton */}
      <div className="flex justify-center">
        <div className="h-8 w-28 bg-white/10 rounded-full" />
      </div>

      {/* Button skeleton */}
      <div className="h-12 bg-white/10 rounded-xl" />
    </div>
  );
}
