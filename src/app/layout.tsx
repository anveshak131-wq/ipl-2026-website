import type { Metadata } from "next";
import "./globals.css";
import TermsGuard from "@/components/TermsGuard";
import { LeagueProvider } from "@/contexts/LeagueContext";
import { AdminLayoutWrapper } from "@/components/admin/AdminLayoutWrapper";
import MatchNotificationManager from "@/components/notifications/MatchNotificationManager";

export const metadata: Metadata = {
  title: "SportsUP18 - IPL 2026 Live Scores, Fixtures & Stats",
  description: "SportsUP18 brings IPL and WPL 2026 live scores, fixtures, points tables, squads, player stats, Orange Cap, Purple Cap, match reports, and cricket news into one match centre.",
  keywords: "SportsUP18, IPL 2026, WPL 2026, cricket live scores, fixtures, points table, Orange Cap, Purple Cap, Indian Premier League, Women's Premier League, teams, players, scorecards",
  authors: [{ name: "SportsUP18" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "SportsUP18 - IPL 2026 Match Centre",
    description: "Live scores, fixtures, points tables, squads, player stats, match reports, and cricket news for IPL and WPL 2026.",
    type: "website",
    locale: "en_US",
    images: ["/favicon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LeagueProvider>
          <AdminLayoutWrapper>
            <MatchNotificationManager />
            {children}
          </AdminLayoutWrapper>
        </LeagueProvider>
      </body>
    </html>
  );
}
