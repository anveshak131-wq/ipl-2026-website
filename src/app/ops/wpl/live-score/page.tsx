import { redirect } from 'next/navigation';

export default function WPLLiveScorePage() {
  // The WPL "Live Score" tool is maintained as the CSV-table scorer.
  redirect('/ops/wpl/live-score-csv');
}

