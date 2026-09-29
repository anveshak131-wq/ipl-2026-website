import { redirect } from 'next/navigation';

export default function BattingStatsRedirect() {
  redirect('/ops/ipl/players?view=batting');
}
