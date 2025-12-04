"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PrivacyPage() {
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [panels, setPanels] = useState<
    { id: string; title: string; body: string }[] | null
  >(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/legal?page=privacy");
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
                      : `privacy-${index + 1}`;
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
        console.error("Failed to load privacy content", e);
      }
    
    return undefined;
    return undefined;
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
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm md:text-base text-gray-400 max-w-2xl">
              This page explains what information is collected when you use the
              SportsUP18 IPL 2026 experience, how that information is used, and the
              choices you have. It is written to be human-readable first while still
              covering the key legal points.
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
            className="px-4 py-2 rounded-full border border-white/15 bg-white/5 text-gray-200 hover:bg-white/10 transition-colors"
          >
            Legal Information
          </Link>
          <Link
            href="/privacy"
            className="px-4 py-2 rounded-full border border-ipl-gold/70 bg-ipl-gold/10 text-ipl-gold font-semibold tracking-wide shadow-sm shadow-yellow-900/40"
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
          <section className="space-y-6 mb-10">
            {panels.map((panel) => (
              <div
                key={panel.id}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
              >
                <h2 className="text-lg font-semibold mb-3">{panel.title}</h2>
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {panel.body}
                </div>
              </div>
            ))}
          </section>
        ) : customContent ? (
          <section className="space-y-6 mb-10">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold mb-3">Privacy Policy</h2>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {customContent}
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-6 mb-10">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold mb-3">1. Overview</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                SportsUp99 is a demo IPL 2026 experience platform. We store only the
                minimum information required to support features like authentication, live
                chat, and engagement analytics. No personal data is sold or shared with
                third parties for advertising or profiling.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">2. Data we collect</h2>
              <p className="text-sm text-gray-300">When you use the platform, we may process:</p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>
                  <span className="font-medium">Account data</span> – email address, display
                  name, and a secure password hash when you create an account.
                </li>
                <li>
                  <span className="font-medium">Usage data</span> – basic technical
                  information such as browser type, approximate region, and timestamps of
                  logins or activity events.
                </li>
                <li>
                  <span className="font-medium">Engagement data</span> – chat messages,
                  match interactions, and heartbeat pings used purely to populate live
                  dashboards and moderation tools.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">3. How we use your data</h2>
              <p className="text-sm text-gray-300">We use this information to:</p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>Authenticate you into the platform and keep your session secure.</li>
                <li>Render live engagement features such as active users and chat.</li>
                <li>Moderate abuse, spam, or behavior that violates community rules.</li>
                <li>Improve the UX and reliability of the demo experience over time.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">4. Cookies & local storage</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                The platform uses tokens stored in local storage or cookies to keep you
                signed in. These tokens are only used for authentication and are not
                shared with third parties. You can clear them at any time by logging out
                or clearing your browser storage.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">5. Data retention</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Accounts, chat messages, and engagement events are retained only as long as
                needed to support the demo use case. Admins may periodically purge data as
                part of maintenance or when resetting the environment.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">6. Your choices</h2>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>You can delete your account by contacting the project owner.</li>
                <li>You can request that specific chat messages be removed or anonymized.</li>
                <li>You can opt out of the experience entirely by not signing up.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">7. Contact</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                If you have any questions about this Privacy Policy or want to exercise a
                data-related right, please contact us by email:
              </p>
              <p className="text-sm text-gray-200">
                Email:{" "}
                <a
                  href="mailto:sportsup99.info@gmail.com"
                  className="text-ipl-gold hover:text-ipl-gold/80 underline underline-offset-4 font-semibold"
                >
                  sportsup99.info@gmail.com
                </a>
              </p>
            </div>
          </section>
        )}

        {/* Contact highlight */}
        <section className="mt-4 mb-8">
          <div className="rounded-2xl border border-ipl-gold/40 bg-gradient-to-r from-ipl-gold/10 via-amber-500/10 to-sky-500/10 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/40">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-ipl-gold/80 mb-1">
                Privacy &amp; data questions
              </p>
              <p className="text-sm md:text-base text-gray-200 max-w-xl">
                Need to request data removal or ask how information is used on SportsUP18?
                Send us a short email and we will review your request as quickly as
                possible.
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
          <p>&copy; {new Date().getFullYear()} SportsUp99 IPL 2026 Experience Platform.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/legal" className="hover:text-ipl-gold transition-colors">
              Legal
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
