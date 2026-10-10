import LineupConsoleClient from "./LineupConsoleClient";

// Server-side static param generation for Cloudflare Pages (output: "export")
export function generateStaticParams() {
  const params: { matchId: string }[] = [];

  // 20 League Matches
  for (let i = 1; i <= 20; i++) {
    params.push({ matchId: "wpl-2027-m" + String(i).padStart(2, "0") });
  }

  // Playoff Matches
  params.push({ matchId: "wpl-2027-m21" });
  params.push({ matchId: "wpl-2027-m22" });
  params.push({ matchId: "wpl-m01" });

  return params;
}

export default function Page({ params }: { params: { matchId: string } }) {
  return <LineupConsoleClient matchId={params.matchId} />;
}
