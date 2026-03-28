import { redirect } from 'next/navigation';

export default function WPLLiveScorePage() {
  // The WPL "Live Score" tool is maintained as the CSV-table scorer.
  redirect('/wpl-admin-2026/live-score-csv');
}

