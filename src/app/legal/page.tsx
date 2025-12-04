"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LegalPage() {
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [panels, setPanels] = useState<
    { id: string; title: string; body: string }[] | null
  >(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/legal?page=legal");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.content && typeof data.content === "string") {
          const raw = data.content as string;
          setCustomContent(raw);

          try {
            const maybeJson = JSON.parse(raw);
            if (Array.isArray(maybeJson)) {
              const parsed = maybeJson
                .map((item: any, index: number) => {
                  if (!item) return null;
                  const title =
                    typeof item.title === "string" && item.title.trim()
                      ? item.title
                      : `Panel ${index + 1}`;
                  const body =
                    typeof item.body === "string" ? item.body : "";
                  const id =
                    typeof item.id === "string" && item.id.trim()
                      ? item.id
                      : `legal-${index + 1}`;
                  if (!body.trim()) return null;
                  return { id, title, body };
                })
                .filter(
                  (
                    panel,
                  ): panel is { id: string; title: string; body: string } =>
                    panel !== null,
                );
              if (parsed.length > 0) {
                setPanels(parsed);
              }
            }
          } catch {
            // Treat as legacy single-string content
          }
        }
      } catch (e) {
        console.error("Failed to load legal content", e);
      }
    
    return undefined;
    return undefined;};
    load();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <header className="mb-6 md:mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-ipl-gold/80 uppercase mb-2">
              Legal &amp; Info
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Legal Information
            </h1>
            <p className="mt-3 text-sm md:text-base text-gray-400 max-w-2xl">
              Transparency, fair use of IPL references, and user trust are important here.
              This page explains how SportsUP18 presents legal notices and ownership
              information in a clear, human-friendly way.
            </p>
          </div>
          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 hover:bg-white/10 transition-colors"
          >
            <span>Back to Home</span>
          </Link>
        </header>

        {/* Legal navigation pills */}
        <nav className="mb-10 flex flex-wrap gap-3 text-xs md:text-sm">
          <Link
            href="/legal"
            className="px-4 py-2 rounded-full border border-ipl-gold/70 bg-ipl-gold/10 text-ipl-gold font-semibold tracking-wide shadow-sm shadow-yellow-900/40"
          >
            Legal Information
          </Link>
          <Link
            href="/privacy"
            className="px-4 py-2 rounded-full border border-white/15 bg-white/5 text-gray-200 hover:bg-white/10 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="px-4 py-2 rounded-full border border-white/15 bg-white/5 text-gray-200 hover:bg-white/10 transition-colors"
          >
            Terms of Service
          </Link>
        </nav>

        {panels && panels.length > 0 ? (
          <section className="space-y-6 mb-12">
            {panels.map((panel) => (
              <div
                key={panel.id}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-black/40"
              >
                <h2 className="text-lg font-semibold mb-3">{panel.title}</h2>
                <div className="space-y-3 text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {panel.body}
                </div>
              </div>
            ))}
          </section>
        ) : customContent ? (
          <section className="mb-12">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-black/40">
              <h2 className="text-lg font-semibold mb-3">Legal notice</h2>
              <div className="space-y-3 text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {customContent}
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-6 md:grid-cols-2 mb-10">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-black/40">
                <h2 className="text-lg font-semibold mb-3">Publisher / Operator</h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  SportsUp99 is an independent IPL 2026 experience platform created for
                  fans to explore match data, team information, and modern sports product
                  design. It is not an official product of the BCCI, IPL, or any
                  franchise.
                </p>
                <p className="mt-4 text-sm text-gray-400">
                  All team names, logos, and trademarks belong to their respective owners
                  and are used here strictly for illustrative and educational purposes.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-black/40">
                <h2 className="text-lg font-semibold mb-3">Contact</h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  For questions about this project, data handling, or to request removal of
                  content, please reach out via email. We aim to respond within 3–5
                  business days.
                </p>
                <div className="mt-4 text-sm text-gray-200">
                  <p className="font-medium">Project Contact</p>
                  <p className="text-gray-300">anvesh (project owner)</p>
                  <a
                    href="mailto:contact@example.com"
                    className="text-ipl-gold hover:text-ipl-gold/80 underline underline-offset-4"
                  >
                    contact@example.com
                  </a>
                </div>
              </div>
            </section>

            <section className="space-y-6 mb-12">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold mb-3">Disclaimer</h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  All match data, scores, analytics, and engagement components displayed on
                  this site are for demonstration and entertainment only. They must not be
                  used for betting or gambling of any kind. No guarantees are made regarding
                  the accuracy, completeness, or real-time nature of the information
                  presented.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold mb-3">Intellectual Property</h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  The UI, UX flows, and underlying code for this IPL 2026 platform are
                  original work by the project owner. Team brands, league marks, and
                  player likenesses, if shown, are used as fictional placeholders to
                  illustrate sports technology concepts.
                </p>
              </div>
            </section>
          </>
        )}

        {/* Contact highlight */}
        <section className="mt-4 mb-8">
          <div className="rounded-2xl border border-ipl-gold/40 bg-gradient-to-r from-ipl-gold/10 via-amber-500/10 to-sky-500/10 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/40">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-ipl-gold/80 mb-1">
                Contact &amp; support
              </p>
              <p className="text-sm md:text-base text-gray-200 max-w-xl">
                Have a legal or rights question about anything shown on SportsUP18? Reach out by
                email and we will review your request as quickly as possible.
              </p>
            </div>
            <a
              href="mailto:sportsup99.info@gmail.com"
              className="inline-flex items-center gap-2 rounded-full bg-ipl-gold text-slate-900 px-4 py-2 text-xs md:text-sm font-semibold shadow-md shadow-yellow-900/40 hover:bg-yellow-300 transition-colors"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
                @
              </span>
              <span className="whitespace-nowrap">sportsup99.info@gmail.com</span>
            </a>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-6 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} SportsUp99 IPL 2026 Experience Platform.
            All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-ipl-gold transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ipl-gold transition-colors">
              Terms of Service
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
