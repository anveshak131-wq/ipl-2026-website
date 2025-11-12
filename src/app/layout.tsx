import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPL 2026 - Official Website",
  description: "Experience the excitement of IPL 2026 - The world's premier T20 cricket league. Get live scores, match schedules, team information, player stats, and latest news.",
  keywords: "IPL 2026, cricket, T20, Indian Premier League, live scores, teams, players, schedule",
  authors: [{ name: "IPL 2026" }],
  openGraph: {
    title: "IPL 2026 - Official Website",
    description: "Experience the excitement of IPL 2026 - The world's premier T20 cricket league",
    type: "website",
    locale: "en_US",
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
        {children}
      </body>
    </html>
  );
}
