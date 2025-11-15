'use client';

import { useEffect, useState } from 'react';

interface Props {
  text: string;
  teamName?: string;
  className?: string;
  primaryColor?: string | { textOnLight?: string };
}

export default function SmartDescription({ text, teamName, className = '', primaryColor }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionSource, setSuggestionSource] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    // Fetch suggestion but don't block rendering
    let cancelled = false;
    async function fetchSuggestion() {
      if (!teamName) return;
      setLoadingSuggestion(true);
      try {
        const res = await fetch(`/api/enrichDescription?teamName=${encodeURIComponent(teamName)}`);
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        if (!cancelled && json.enhanced) {
          setSuggestion(json.enhanced);
          setSuggestionSource(json.source || 'unknown');
        }
      } catch (e) {
        // ignore
      } finally {
        if (!cancelled) setLoadingSuggestion(false);
      }
    }
    fetchSuggestion();
    return () => { cancelled = true; };
  }, [teamName]);

  // Smart truncation: show 3 lines collapsed
  return (
    <div className={className}>
      <div
        className="rounded-2xl p-6 bg-white/5 border border-white/10"
        style={{ color: typeof primaryColor === 'string' ? primaryColor : (primaryColor?.textOnLight || '#FFFFFF') }}
      >
        <div className={`prose text-lg leading-relaxed ${expanded ? '' : 'line-clamp-3'} break-words`}>
          {text}
        </div>

        <div className="mt-4 flex gap-3 items-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold"
          >
            {expanded ? 'Read Less' : 'Read More'}
          </button>

          {loadingSuggestion ? (
            <span className="text-sm text-gray-300">Loading suggestion…</span>
          ) : suggestion ? (
            <>
              <button
                onClick={() => setShowSuggestion(!showSuggestion)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-yellow-500 text-black text-sm font-semibold"
              >
                {showSuggestion ? 'Hide AI Suggestion' : 'Show AI Suggestion'}
              </button>
              <span className="text-xs text-gray-400">(AI-enhanced)</span>
            </>
          ) : null}
        </div>

        {showSuggestion && suggestion && (
          <div className="mt-4 rounded-lg p-4 bg-black/20 border border-white/5">
            <div className="text-sm text-gray-200 mb-2 font-semibold">AI suggestion ({suggestionSource})</div>
            <div className="text-sm text-gray-200 leading-relaxed">{suggestion}</div>
          </div>
        )}
      </div>
    </div>
  );
}
