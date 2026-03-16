"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const REQUIRED_TERMS_VERSION = "1.1";
const FALLBACK_LAST_UPDATED = "March 16, 2026";
const CONTACT_EMAIL = "sportsup99.info@gmail.com";

type LegalPanel = { id: string; title: string; body: string };

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

export default function TermsPage() {
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [panels, setPanels] = useState<LegalPanel[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/legal?page=terms");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.content && typeof data.content === "string") {
          if (cancelled) return;
          const raw = data.content as string;
          setCustomContent(raw);
          setUpdatedAt(typeof data.updatedAt === "string" ? data.updatedAt : null);
          setPanels(parsePanels(raw, "terms"));
        }
      } catch (e) {
        console.error("Failed to load terms content", e);
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
              Terms of Service
            </h1>
            <p className="mt-2 text-xs text-gray-500">
              Version {REQUIRED_TERMS_VERSION} • Last updated:{" "}
              {updatedAt ? formatDate(updatedAt) : FALLBACK_LAST_UPDATED}
            </p>
            <p className="mt-3 text-sm md:text-base text-gray-400 max-w-2xl">
              Please read these terms carefully. By using SportsUP18 (IPL &amp; WPL 2026),
              you agree to the conditions below.
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
            className="px-4 py-2 rounded-full border border-white/15 bg-white/5 text-gray-200 hover:bg-white/10 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="px-4 py-2 rounded-full border border-ipl-gold/70 bg-ipl-gold/10 text-ipl-gold font-semibold tracking-wide shadow-sm shadow-yellow-900/40"
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
              <h2 className="text-lg font-semibold mb-3">Terms of Service</h2>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {customContent}
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-6 mb-10">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold mb-3">1. Acceptance &amp; updates</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                By accessing or using SportsUP18, you agree to these Terms of Service and
                our{" "}
                <Link
                  href="/privacy"
                  className="text-ipl-gold hover:text-ipl-gold/80 underline underline-offset-4 font-semibold"
                >
                  Privacy Policy
                </Link>
                . If you do not agree, do not use the service. We may update these terms
                from time to time; continued use after updates means you accept the new
                terms.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">2. Nature of the service</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                SportsUP18 is an independent, fan-made IPL &amp; WPL 2026 experience
                platform. It is not affiliated with or endorsed by the BCCI, IPL, WPL, or
                any franchise. Features may change, break, or be reset as the project
                evolves.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Content is provided for information, learning, and entertainment only and
                must not be used for betting, gambling, or financial decisions.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">3. Accounts &amp; eligibility</h2>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>
                  You are responsible for the activity on your account and for keeping
                  your credentials secure.
                </li>
                <li>
                  You agree to provide accurate information when creating an account.
                </li>
                <li>
                  The service is not intended for children under 13 (or the age of digital
                  consent where you live).
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">4. User content &amp; moderation</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                SportsUP18 may include user-generated content (for example, live chat).
                You are solely responsible for what you post. We may remove content or
                restrict accounts at any time to keep the community safe or to enforce
                these terms.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">5. Acceptable use</h2>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>No harassment, hate speech, or abusive content in chat or usernames.</li>
                <li>No spam, automated scripts, or attempts to overload the service.</li>
                <li>No use of the platform for betting, gambling, or financial decisions.</li>
                <li>
                  No attempts to reverse engineer, attack, exploit vulnerabilities, or
                  misuse the infrastructure.
                </li>
                <li>
                  No posting of content that is unlawful, infringes rights, or violates
                  others' privacy.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">6. Notifications &amp; emails</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                If you opt in, we may send service emails such as match reminders. You can
                opt out of non-essential emails via settings (if available) or by contacting
                us.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">
                7. Intellectual property &amp; trademarks
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                The SportsUP18 site, UI/UX, and code are owned by the project owner.
                Third-party trademarks (including league/team names and logos) belong to
                their respective owners and may be used only for identification.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">8. Disclaimers</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                The service is provided on an &quot;as is&quot; and &quot;as available&quot;
                basis without warranties of any kind. We do not guarantee availability,
                accuracy, or fitness for a particular purpose.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">9. Limitation of liability</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                To the maximum extent permitted by applicable law, the project owner is
                not liable for any indirect, incidental, special, consequential, or
                punitive damages, or any loss of data or profits arising from your use of
                the service.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">10. Termination</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                We may suspend or terminate access to the service at any time if we believe
                you have violated these terms or if it is necessary to protect users or the
                service.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">11. Contact</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                For questions about these Terms of Service, please contact us by email:
              </p>
              <p className="text-sm text-gray-200">
                Email:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-ipl-gold hover:text-ipl-gold/80 underline underline-offset-4 font-semibold"
                >
                  {CONTACT_EMAIL}
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
                Terms &amp; support
              </p>
              <p className="text-sm md:text-base text-gray-200 max-w-xl">
                If you need clarification about these terms or want to report an issue
                related to acceptable use, please reach out by email.
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
          <p>&copy; {new Date().getFullYear()} SportsUP18 IPL &amp; WPL 2026 Experience Platform.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/legal" className="hover:text-ipl-gold transition-colors">
              Legal
            </Link>
            <Link href="/privacy" className="hover:text-ipl-gold transition-colors">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
