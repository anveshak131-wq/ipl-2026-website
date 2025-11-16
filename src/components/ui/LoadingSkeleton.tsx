interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'text' | 'image';
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({ 
  variant = 'card', 
  count = 1,
  className = '' 
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`bg-slate-800/30 rounded-xl p-6 animate-pulse ${className}`}>
            <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-700/50 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
          </div>
        );
      
      case 'list':
        return (
          <div className={`flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg animate-pulse ${className}`}>
            <div className="w-12 h-12 bg-slate-700/50 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className={`space-y-2 animate-pulse ${className}`}>
            <div className="h-4 bg-slate-700/50 rounded w-full"></div>
            <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700/50 rounded w-4/6"></div>
          </div>
        );
      
      case 'image':
        return (
          <div className={`bg-slate-700/50 rounded-lg animate-pulse ${className}`} style={{ aspectRatio: '16/9' }}></div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {skeletons.map((index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}
