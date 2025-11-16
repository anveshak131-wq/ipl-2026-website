import Icon from './Icon';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: 'cricket' | 'team' | 'news' | 'target' | 'stats';
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export default function EmptyState({
  icon = 'cricket',
  title,
  description,
  actionLabel,
  actionHref,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`text-center py-16 animate-fade-in ${className}`}>
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 border-2 border-white/10 mb-6">
        <Icon name={icon} size={40} />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      
      <p className="text-gray-400 max-w-md mx-auto mb-8">
        {description}
      </p>
      
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-ipl-blue-light to-ipl-purple hover:from-ipl-blue-dark hover:to-ipl-purple text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {actionLabel}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      )}
    </div>
  );
}
