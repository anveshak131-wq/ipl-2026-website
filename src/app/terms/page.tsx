"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TermsPage() {
  const [customContent, setCustomContent] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/legal?page=terms");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.content && typeof data.content === "string") {
          setCustomContent(data.content);
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
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-ipl-gold/80 uppercase mb-2">
              Terms of Service
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Terms for using the IPL 2026 experience platform
            </h1>
            <p className="mt-3 text-sm md:text-base text-gray-400 max-w-2xl">
              Please read these terms carefully. By using this site, you agree to these
              conditions of use for this demo IPL 2026 platform.
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
                This platform is a fan-built demo experience for exploring IPL-style
                product flows, not an official IPL or BCCI property. All content is
                provided on an "as-is" basis for experimentation, learning, and
                entertainment only.
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
                For questions about these Terms of Service, please contact the project
                owner at:
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
            <Link href="/privacy" className="hover:text-ipl-gold transition-colors">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
