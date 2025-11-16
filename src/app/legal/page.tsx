"use client";

import Link from "next/link";

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-ipl-gold/80 uppercase mb-2">
              Legal
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              IPL 2026 Platform Legal Information
            </h1>
            <p className="mt-3 text-sm md:text-base text-gray-400 max-w-2xl">
              Transparency, compliance, and user trust are core to how we operate. This
              page outlines the legal details and contact information for the IPL 2026
              experience platform.
            </p>
          </div>
          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 hover:bg-white/10 transition-colors"
          >
            <span>Back to Home</span>
          </Link>
        </header>

        <section className="grid gap-6 md:grid-cols-2 mb-10">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-black/40">
            <h2 className="text-lg font-semibold mb-3">Publisher / Operator</h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              This IPL 2026 experience platform is a fan-focused project created for
              showcasing product design, engineering, and live sports UX patterns.
              It is not an official product of the BCCI, IPL, or any franchise.
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

        <footer className="border-t border-white/10 pt-6 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} IPL 2026 Experience Project. All rights
            reserved.
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
