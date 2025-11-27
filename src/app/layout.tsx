import type { Metadata } from "next";
import "./globals.css";
import TermsGuard from "@/components/TermsGuard";

export const metadata: Metadata = {
  title: "SportsUP18 - Official Website",
  description: "SportsUP18 is your IPL 2026 experience platform. Get live scores, match schedules, team information, player stats, and latest news.",
  keywords: "SportsUP18, IPL 2026, cricket, T20, Indian Premier League, live scores, teams, players, schedule",
  authors: [{ name: "SportsUP18" }],
  icons: {
    icon: "/logos/sportsup18_logo_round.svg",
    shortcut: "/logos/sportsup18_logo_round.svg",
    apple: "/logos/sportsup18_logo_round.svg",
  },
  openGraph: {
    title: "SportsUP18 - Official Website",
    description: "SportsUP18 is your IPL 2026 experience platform.",
    type: "website",
    locale: "en_US",
    images: ["/logos/sportsup18_logo_round.svg"],
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
        <TermsGuard>
          {children}
        </TermsGuard>
      </body>
    </html>
  );
}
