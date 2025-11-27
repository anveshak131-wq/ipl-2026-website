"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TermsLanguage, termsTranslations } from "@/lib/terms-translations";

const REQUIRED_TERMS_VERSION = "1.1";

export default function TermsPage() {
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [panels, setPanels] = useState<
    { id: string; title: string; body: string }[] | null
  >(null);
  const [language, setLanguage] = useState<TermsLanguage>("en");
  const t = termsTranslations[language];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/legal?page=terms");
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
                      : `terms-${index + 1}`;
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
        console.error("Failed to load terms content", e);
      }
    };
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
              Terms of Service
            </h1>
            <p className="mt-3 text-sm md:text-base text-gray-400 max-w-2xl">
              Please read these terms carefully. By using this site, you agree to the
              conditions of use for the SportsUP18 IPL 2026 demo experience.
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
        <nav className="mb-10 flex flex-wrap gap-3 justify-between items-center text-xs md:text-sm">
          <div className="flex flex-wrap gap-3">
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
          </div>
          
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as TermsLanguage)}
            className="px-4 py-2 rounded-full border border-white/15 bg-white/5 text-gray-200 hover:bg-white/10 transition-colors text-xs md:text-sm cursor-pointer"
            aria-label="Select language"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="hi">हिन्दी</option>
            <option value="fr">Français</option>
            <option value="te">తెలుగు</option>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="ta">தமிழ்</option>
          </select>
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
              <h2 className="text-lg font-semibold mb-3">1. Nature of the service</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                SportsUp99 is a fan-built demo experience for exploring IPL-style product
                flows for the IPL 2026 season. It is not an official IPL or BCCI property.
                All content is provided on an "as-is" basis for experimentation, learning,
                and entertainment only.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">2. Acceptable use</h2>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>No harassment, hate speech, or abusive content in chat or usernames.</li>
                <li>No spam, automated scripts, or attempts to overload the service.</li>
                <li>No use of the platform for betting, gambling, or financial decisions.</li>
                <li>No attempts to reverse engineer, attack, or misuse the infrastructure.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">3. Accounts & moderation</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Admins may block or remove accounts that violate these terms or harm the
                experience for others. Blocking prevents chat participation; deletion may
                remove associated data where technically possible.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">4. No warranties</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                The service is provided without any guarantees of availability, accuracy,
                or fitness for a particular purpose. Features may change, break, or be
                reset at any time without notice as the project evolves.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">5. Limitation of liability</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                To the maximum extent permitted by applicable law, the project owner is
                not liable for any damages resulting from the use or inability to use this
                demo platform, including loss of data, opportunities, or any indirect or
                consequential losses.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">6. Changes to these terms</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                These terms may be updated as the project evolves. If you continue to use
                the platform after updates are published, you agree to the revised terms.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">7. Contact</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                For questions about these Terms of Service, please contact us by email:
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
                Terms &amp; support
              </p>
              <p className="text-sm md:text-base text-gray-200 max-w-xl">
                If you need clarification about these terms or want to report an issue
                related to acceptable use, please reach out by email.
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
            <Link href="/privacy" className="hover:text-ipl-gold transition-colors">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
