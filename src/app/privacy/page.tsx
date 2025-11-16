"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PrivacyPage() {
  const [customContent, setCustomContent] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/legal?page=privacy");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.content && typeof data.content === "string") {
          setCustomContent(data.content);
        }
      } catch (e) {
        console.error("Failed to load privacy content", e);
      }
    };
    load();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-ipl-gold/80 uppercase mb-2">
              Privacy Policy
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              How we handle data on the IPL 2026 platform
            </h1>
            <p className="mt-3 text-sm md:text-base text-gray-400 max-w-2xl">
              This page explains what information is collected when you use the
              platform, how it is used, and the choices you have. It is written to be
              human-readable first, while still covering the key legal points.
            </p>
          </div>
          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 hover:bg-white/10 transition-colors"
          >
            <span>Back to Home</span>
          </Link>
        </header>

        {customContent ? (
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
                This IPL 2026 experience is a demo platform. It stores only the minimum
                information required to support features like authentication, live chat,
                and engagement analytics. No data is sold or shared with third parties for
                advertising or profiling.
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
                data-related right, please contact the project owner:
              </p>
              <p className="text-sm text-gray-200">
                Email:{" "}
                <a
                  href="mailto:contact@example.com"
                  className="text-ipl-gold hover:text-ipl-gold/80 underline underline-offset-4"
                >
                  contact@example.com
                </a>
              </p>
            </div>
          </section>
        )}

        <footer className="border-t border-white/10 pt-6 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} IPL 2026 Experience Project.</p>
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
