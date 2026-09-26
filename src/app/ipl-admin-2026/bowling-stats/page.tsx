import { redirect } from 'next/navigation';

export default function BowlingStatsRedirect() {
  redirect('/ipl-admin-2026/players?view=bowling');
}
