"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LegalPanel = { id: string; title: string; body: string };

const FALLBACK_LAST_UPDATED = "March 16, 2026";

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

export default function PrivacyPage() {
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [panels, setPanels] = useState<LegalPanel[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/legal?page=privacy");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.content && typeof data.content === "string") {
          if (cancelled) return;
          const raw = data.content as string;
          setCustomContent(raw);
          setUpdatedAt(typeof data.updatedAt === "string" ? data.updatedAt : null);
          setPanels(parsePanels(raw, "privacy"));
        }
      } catch (e) {
        console.error("Failed to load privacy content", e);
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
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs text-gray-500">
              Last updated:{" "}
              {updatedAt ? formatDate(updatedAt) : FALLBACK_LAST_UPDATED}
            </p>
            <p className="mt-3 text-sm md:text-base text-gray-400 max-w-2xl">
              This page explains what information is collected when you use SportsUP18
              (IPL &amp; WPL 2026), how it is used, and the choices you have. It is
              written to be human-readable first while still covering key legal points.
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
              <h2 className="text-lg font-semibold mb-3">1. Summary</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                SportsUP18 is a fan-made IPL &amp; WPL 2026 experience platform. We
                collect and process a small amount of information to operate the service
                (accounts, live chat, notifications, and basic security). We do not sell
                personal information.
              </p>
              <ul className="mt-4 list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>
                  We use your email and display name to create and secure an account.
                </li>
                <li>
                  We store chat messages and interactions to power live features and
                  moderation.
                </li>
                <li>
                  We use cookies/localStorage for sign-in and preferences.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">2. Information we collect</h2>
              <p className="text-sm text-gray-300">
                Depending on how you use SportsUP18, we may process:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>
                  <span className="font-medium">Account data</span> – email address,
                  display name, and a salted password hash.
                </li>
                <li>
                  <span className="font-medium">Preferences</span> – league selection,
                  notification settings, and other in-app preferences you choose.
                </li>
                <li>
                  <span className="font-medium">User content</span> – chat messages and
                  related metadata (timestamps, match ID, moderation flags).
                </li>
                <li>
                  <span className="font-medium">Device &amp; log data</span> – IP address
                  (typically via hosting/CDN logs), browser type, and timestamps of
                  requests or sign-ins.
                </li>
                <li>
                  <span className="font-medium">Email data</span> – if you opt in to match
                  reminders/notifications, we process your email address and delivery
                  events (e.g., sent timestamps).
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">3. How we use information</h2>
              <p className="text-sm text-gray-300">We use information to:</p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>Provide the service (accounts, live scores, chat, and features).</li>
                <li>Authenticate users, prevent abuse, and keep the service secure.</li>
                <li>Moderate content and enforce our Terms of Service.</li>
                <li>Send notifications you enable (e.g., match reminders).</li>
                <li>Debug, improve, and measure performance and reliability.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">4. How we share information</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                We may share information with:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>
                  <span className="font-medium">Service providers</span> – hosting/CDN and
                  storage providers (for example, Cloudflare Pages and KV) and email
                  delivery providers (for example, Resend, SendGrid, Mailgun, or Elastic
                  Email) when sending notifications.
                </li>
                <li>
                  <span className="font-medium">Security providers</span> – anti-abuse
                  services such as Cloudflare Turnstile (if enabled).
                </li>
                <li>
                  <span className="font-medium">Legal &amp; safety</span> – when required
                  by law, to protect users, or to protect the integrity of the service.
                </li>
              </ul>
              <p className="text-sm text-gray-400 leading-relaxed">
                We do not share personal information for third-party advertising.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">5. Cookies &amp; local storage</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                SportsUP18 uses cookies and/or localStorage to keep you signed in and to
                remember preferences (for example, league selection and terms acceptance).
                You can clear these at any time by logging out or clearing your browser
                data.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">6. Data retention</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                We retain data for as long as needed to operate the service, then delete
                or aggregate it. Typical retention periods include:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>
                  <span className="font-medium">Accounts</span> – stored while the account
                  is active (and may expire after extended inactivity).
                </li>
                <li>
                  <span className="font-medium">Auth tokens</span> – typically up to 30 days.
                </li>
                <li>
                  <span className="font-medium">Chat messages</span> – typically up to 7 days
                  (and capped per match).
                </li>
                <li>
                  <span className="font-medium">Email logs/unsubscribe tokens</span> – typically
                  up to 30 days.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">7. Your choices &amp; rights</h2>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>
                  <span className="font-medium">Email notifications</span> – you can opt in or
                  out via settings (if available) or by contacting us.
                </li>
                <li>
                  <span className="font-medium">Access/deletion</span> – you can request
                  access to or deletion of your account data, and request removal of specific
                  chat messages where technically feasible.
                </li>
                <li>
                  <span className="font-medium">Browser controls</span> – you can clear cookies
                  and localStorage at any time.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">8. Security</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                We use reasonable safeguards designed to protect information, including
                TLS in transit and salted password hashing. No method of transmission or
                storage is 100% secure, so we cannot guarantee absolute security.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">9. Contact</h2>
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
          <p>&copy; {new Date().getFullYear()} SportsUP18 IPL &amp; WPL 2026 Experience Platform.</p>
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
