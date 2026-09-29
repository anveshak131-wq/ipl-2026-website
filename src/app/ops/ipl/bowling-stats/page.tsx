import { redirect } from 'next/navigation';

export default function BowlingStatsRedirect() {
  redirect('/ops/ipl/players?view=bowling');
}
