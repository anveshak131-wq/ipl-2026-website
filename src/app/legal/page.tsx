"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LegalPanel = { id: string; title: string; body: string };

const FALLBACK_LAST_UPDATED = "March 16, 2026";
const CONTACT_EMAIL = "sportsup99.info@gmail.com";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function parsePanels(raw: string, prefix: string): LegalPanel[] | null {
  try {
    const maybeJson = JSON.parse(raw);
    if (!Array.isArray(maybeJson)) return null;

    const parsed = maybeJson
      .map((item: any, index: number) => {
        if (!item) return null;
        const title =
          typeof item.title === "string" && item.title.trim()
            ? item.title
            : `Panel ${index + 1}`;
        const body = typeof item.body === "string" ? item.body : "";
        const id =
          typeof item.id === "string" && item.id.trim()
            ? item.id
            : `${prefix}-${index + 1}`;
        if (!body.trim()) return null;
        return { id, title, body };
      })
      .filter((panel): panel is LegalPanel => panel !== null);

    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export default function LegalPage() {
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [panels, setPanels] = useState<LegalPanel[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/legal?page=legal");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.content && typeof data.content === "string") {
          if (cancelled) return;
          const raw = data.content as string;
          setCustomContent(raw);
          setUpdatedAt(typeof data.updatedAt === "string" ? data.updatedAt : null);
          setPanels(parsePanels(raw, "legal"));
        }
      } catch (e) {
        console.error("Failed to load legal content", e);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
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
            <p className="mt-2 text-xs text-gray-500">
              Last updated:{" "}
              {updatedAt ? formatDate(updatedAt) : FALLBACK_LAST_UPDATED}
            </p>
            <p className="mt-3 text-sm md:text-base text-gray-400 max-w-2xl">
              This page contains legal notices, trademark attribution, and instructions
              for rights holders who want content corrected or removed from SportsUP18.
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
                  SportsUP18 is an independent, fan-made IPL &amp; WPL 2026 experience
                  platform for exploring match data, team information, and modern sports
                  product design. It is not an official product and is not affiliated
                  with or endorsed by the BCCI, IPL, WPL, or any franchise.
                </p>
                <p className="mt-4 text-sm text-gray-400">
                  This site may reference league/team names for identification. All
                  trademarks and copyrighted materials are the property of their
                  respective owners.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-black/40">
                <h2 className="text-lg font-semibold mb-3">Contact</h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  For questions about this site, data handling, or rights/takedown
                  requests, please email us. We aim to respond within 3–5 business days.
                </p>
                <div className="mt-4 text-sm text-gray-200">
                  <p className="font-medium">Project Contact</p>
                  <p className="text-gray-300">SportsUP18 (project owner)</p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-ipl-gold hover:text-ipl-gold/80 underline underline-offset-4"
                  >
                    {CONTACT_EMAIL}
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
                  used for betting or gambling of any kind. No guarantees are made about
                  accuracy, completeness, or real-time availability.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold mb-3">
                  Trademarks &amp; affiliation
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  IPL, WPL, BCCI, team names, team logos, and other brand features may be
                  trademarks of their respective owners. Any such marks are used only for
                  identification and informational purposes. SportsUP18 is not affiliated
                  with or endorsed by any rights holder.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold mb-3">Copyright &amp; takedown requests</h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  If you believe content on this site infringes your rights, please email{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-ipl-gold hover:text-ipl-gold/80 underline underline-offset-4 font-semibold"
                  >
                    {CONTACT_EMAIL}
                  </a>{" "}
                  with (1) your name and a way to contact you, (2) the URL(s) of the
                  content, (3) a description of the rights you believe are infringed, and
                  (4) the action you are requesting (remove, correct, attribute). We will
                  review and respond as quickly as possible.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold mb-3">Site content</h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  The UI/UX and underlying code are original work by the project owner.
                  User-generated content (for example, live chat) is posted by users and
                  may be moderated or removed to keep the community safe.
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
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-full bg-ipl-gold text-slate-900 px-4 py-2 text-xs md:text-sm font-semibold shadow-md shadow-yellow-900/40 hover:bg-yellow-300 transition-colors"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
                @
              </span>
              <span className="whitespace-nowrap">{CONTACT_EMAIL}</span>
            </a>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-6 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} SportsUP18 IPL &amp; WPL 2026 Experience Platform.
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
