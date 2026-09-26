import { redirect } from 'next/navigation';

export default function BattingStatsRedirect() {
  redirect('/ipl-admin-2026/players?view=batting');
}
