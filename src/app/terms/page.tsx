"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Supported languages
type Language = "en" | "es" | "hi" | "fr";

const translations: Record<Language, any> = {
  en: {
    title: "Accept Terms & Conditions",
    subtitle: "Please review and accept our terms to continue",
    readFullTerms: "📖 Read Full Terms",
    takesMinutes: "Takes 2-3 minutes",
    byAccepting: "By accepting these terms:",
    readTerms: "I have read the terms and conditions",
    acceptTerms: "I agree to abide by community guidelines",
    understandLiability: "I understand liability limitations",
    decrypt: "🔒 Your data is encrypted",
    gdpr: "📋 GDPR compliant",
    timeToRead: "⏱️ Takes 2 min to read",
    acceptButton: "Accept Terms",
    declineButton: "Decline",
    confirmDecline: "You won't be able to use the platform without accepting terms. Continue?",
    acceptedOn: "✅ Accepted on",
    termsUpdated: "📋 Terms have been updated. Please review and re-accept.",
    declineReasonTitle: "Why are you declining?",
    declineReasonPlaceholder: "Tell us why...",
    sendAndExit: "Send & Exit",
    feedbackThank: "Thank you for your feedback. You will now exit.",
    step: "Step",
    of: "of",
    learnMore: "Learn More",
  },
  es: {
    title: "Aceptar Términos y Condiciones",
    subtitle: "Por favor, revise y acepte nuestros términos para continuar",
    readFullTerms: "📖 Leer Términos Completos",
    takesMinutes: "Tarda 2-3 minutos",
    byAccepting: "Al aceptar estos términos:",
    readTerms: "He leído los términos y condiciones",
    acceptTerms: "Acepto cumplir con las pautas de la comunidad",
    understandLiability: "Entiendo las limitaciones de responsabilidad",
    decrypt: "🔒 Tus datos están cifrados",
    gdpr: "📋 Cumple con GDPR",
    timeToRead: "⏱️ Tarda 2 min en leer",
    acceptButton: "Aceptar Términos",
    declineButton: "Rechazar",
    confirmDecline: "No podrá usar la plataforma sin aceptar los términos. ¿Continuar?",
    acceptedOn: "✅ Aceptado el",
    termsUpdated: "📋 Los términos han sido actualizados. Por favor, revise y vuelva a aceptar.",
    declineReasonTitle: "¿Por qué rechaza?",
    declineReasonPlaceholder: "Cuéntanos por qué...",
    sendAndExit: "Enviar y salir",
    feedbackThank: "Gracias por tu comentario. Ahora saldrás.",
    step: "Paso",
    of: "de",
    learnMore: "Más información",
  },
  hi: {
    title: "शर्तें और शर्तों को स्वीकार करें",
    subtitle: "कृपया हमारी शर्तों की समीक्षा करें और जारी रखने के लिए स्वीकार करें",
    readFullTerms: "📖 पूरी शर्तें पढ़ें",
    takesMinutes: "2-3 मिनट लगते हैं",
    byAccepting: "इन शर्तों को स्वीकार करके:",
    readTerms: "मैंने शर्तें और शर्तों को पढ़ लिया है",
    acceptTerms: "मैं सामुदायिक दिशानिर्देशों का पालन करने के लिए सहमत हूं",
    understandLiability: "मैं दायित्व सीमाओं को समझता हूं",
    decrypt: "🔒 आपका डेटा एन्क्रिप्ट है",
    gdpr: "📋 GDPR अनुपालन",
    timeToRead: "⏱️ पढ़ने में 2 मिनट लगते हैं",
    acceptButton: "शर्तें स्वीकार करें",
    declineButton: "अस्वीकार करें",
    confirmDecline: "शर्तों को स्वीकार किए बिना आप प्लेटफॉर्म का उपयोग नहीं कर सकते। जारी रखें?",
    acceptedOn: "✅ स्वीकृत",
    termsUpdated: "📋 शर्तों को अपडेट किया गया है। कृपया समीक्षा करें और फिर से स्वीकार करें।",
    declineReasonTitle: "आप क्यों अस्वीकार कर रहे हैं?",
    declineReasonPlaceholder: "हमें बताएं...",
    sendAndExit: "भेजें और बाहर निकलें",
    feedbackThank: "आपकी प्रतिक्रिया के लिए धन्यवाद। आप अब बाहर निकलेंगे।",
    step: "चरण",
    of: "का",
    learnMore: "अधिक जानें",
  },
  fr: {
    title: "Accepter les Conditions Générales",
    subtitle: "Veuillez examiner et accepter nos conditions pour continuer",
    readFullTerms: "📖 Lire les conditions complètes",
    takesMinutes: "Prend 2-3 minutes",
    byAccepting: "En acceptant ces conditions:",
    readTerms: "J'ai lu les conditions générales",
    acceptTerms: "J'accepte de respecter les directives de la communauté",
    understandLiability: "Je comprends les limitations de responsabilité",
    decrypt: "🔒 Vos données sont cryptées",
    gdpr: "📋 Conforme au RGPD",
    timeToRead: "⏱️ Prend 2 min à lire",
    acceptButton: "Accepter les conditions",
    declineButton: "Refuser",
    confirmDecline: "Vous ne pourrez pas utiliser la plateforme sans accepter les conditions. Continuer?",
    acceptedOn: "✅ Accepté le",
    termsUpdated: "📋 Les conditions ont été mises à jour. Veuillez examiner et réaccepter.",
    declineReasonTitle: "Pourquoi refusez-vous?",
    declineReasonPlaceholder: "Dites-nous pourquoi...",
    sendAndExit: "Envoyer et quitter",
    feedbackThank: "Merci pour vos commentaires. Vous allez maintenant quitter.",
    step: "Étape",
    of: "sur",
    learnMore: "En savoir plus",
  },
};

const REQUIRED_TERMS_VERSION = "1.1"; // Update when terms change

export default function TermsPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [customContent, setCustomContent] = useState<string | null>(null);
  const [panels, setPanels] = useState<
    { id: string; title: string; body: string }[] | null
  >(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [hasSeenTerms, setHasSeenTerms] = useState(false);
  const [lastAcceptanceDate, setLastAcceptanceDate] = useState<string | null>(null);
  const [needsReAcceptance, setNeedsReAcceptance] = useState(false);
  const [showDeclineFeedback, setShowDeclineFeedback] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [checkedItems, setCheckedItems] = useState({
    readTerms: false,
    acceptTerms: false,
    understandLiability: false,
  });
  const t = translations[language];

  useEffect(() => {
    // Check if user has already accepted terms
    const storedAcceptance = localStorage.getItem("terms_accepted");
    const acceptanceDate = localStorage.getItem("terms_accepted_date");
    const acceptedVersion = localStorage.getItem("terms_version");
    
    setLastAcceptanceDate(acceptanceDate);

    if (storedAcceptance === "true" && acceptanceDate) {
      setTermsAccepted(true);
      setHasSeenTerms(true);
      
      // Check if terms version has been updated (need re-acceptance)
      if (acceptedVersion !== REQUIRED_TERMS_VERSION) {
        setNeedsReAcceptance(true);
        setShowAcceptanceModal(true);
        // Reset checkboxes for re-acceptance
        setCheckedItems({
          readTerms: false,
          acceptTerms: false,
          understandLiability: false,
        });
      }
    } else {
      setShowAcceptanceModal(true);
    }
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem("terms_accepted", "true");
    localStorage.setItem("terms_accepted_date", new Date().toISOString());
    localStorage.setItem("terms_version", REQUIRED_TERMS_VERSION);
    setTermsAccepted(true);
    setShowAcceptanceModal(false);
    setNeedsReAcceptance(false);
    setCheckedItems({
      readTerms: false,
      acceptTerms: false,
      understandLiability: false,
    });
    
    // Analytics: Track acceptance
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "terms_accepted", {
        version: REQUIRED_TERMS_VERSION,
        timestamp: new Date().toISOString(),
        language: language,
      });
    }
    
    // Redirect to intended route or home page after acceptance
    const redirectPath = sessionStorage.getItem("terms_redirect_after") || "/";
    sessionStorage.removeItem("terms_redirect_after");
    
    setTimeout(() => {
      router.push(redirectPath);
    }, 500); // Small delay for animation
  };

  const handleDeclineClick = () => {
    if (
      window.confirm(t.confirmDecline)
    ) {
      setShowDeclineFeedback(true);
    }
  };

  const handleDeclineTerms = () => {
    setShowAcceptanceModal(false);
  };

  const handleSubmitDeclineFeedback = async () => {
    // Track decline feedback
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "terms_declined", {
        reason: declineReason,
        version: REQUIRED_TERMS_VERSION,
        timestamp: new Date().toISOString(),
        language: language,
      });
    }

    // Submit feedback to backend (placeholder)
    try {
      await fetch("/api/legal/decline-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: declineReason,
          version: REQUIRED_TERMS_VERSION,
          language: language,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.log("Feedback submitted locally");
    }

    alert(t.feedbackThank);
    setShowDeclineFeedback(false);
    setDeclineReason("");
    // Exit the site or redirect
    window.location.href = "about:blank";
  };

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
      {/* Acceptance Status Banner */}
      {termsAccepted && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-emerald-500/20 px-6 py-3 text-center"
        >
          <p className="text-sm text-emerald-300 flex items-center justify-center gap-2">
            <span className="text-lg">✅</span>
            Terms accepted on {new Date(localStorage.getItem("terms_accepted_date") || "").toLocaleDateString()}
          </p>
        </motion.div>
      )}

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

      {/* Terms Acceptance Modal */}
      <AnimatePresence>
        {showAcceptanceModal && !showDeclineFeedback && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleDeclineTerms}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0"
            >
              {/* Mobile: Full screen, Desktop: Centered dialog */}
              <div className="w-full md:max-w-md max-h-[95vh] overflow-y-auto md:max-h-none md:overflow-visible bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-none md:rounded-2xl border-0 md:border border-white/10 shadow-2xl md:overflow-hidden">
                {/* Header with animated gradient line */}
                <div className="sticky top-0 z-10 md:relative px-6 py-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/3">
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500" />
                  
                  {/* Language selector */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="text-xs bg-slate-800/60 border border-white/10 text-gray-300 rounded px-2 py-1 hover:bg-slate-700"
                      aria-label="Language selection"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="hi">हिन्दी</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>

                  <div className="flex items-start gap-4">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-500/15 text-lg"
                    >
                      ⚖️
                    </motion.div>

                    <div className="flex-1">
                      <motion.h2
                        key={`title-${language}`}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="text-lg font-semibold text-white leading-tight"
                      >
                        {needsReAcceptance ? "📋 " : ""}{t.title}
                      </motion.h2>
                      <motion.p
                        key={`subtitle-${language}`}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                        className="mt-1 text-sm text-gray-300"
                      >
                        {needsReAcceptance ? t.termsUpdated : t.subtitle}
                      </motion.p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeclineTerms}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                      aria-label="Close dialog"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <span className="flex-1 h-1 bg-ipl-gold rounded-full"></span>
                      <span className="flex-1 h-1 bg-slate-700 rounded-full"></span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t.step} 1 {t.of} 2: {t.learnMore}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="px-6 py-6 space-y-5"
                >
                  {/* Terms Update Warning */}
                  {needsReAcceptance && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-200">
                      {t.termsUpdated}
                    </div>
                  )}

                  {/* Read Full Terms Link */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5 hover:border-ipl-gold/30 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-ipl-gold uppercase tracking-wide">
                        {t.readFullTerms}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{t.takesMinutes}</p>
                    </div>
                    <a
                      href="#terms-content"
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById("terms-content");
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="inline-flex items-center gap-2 text-ipl-gold hover:text-yellow-300 text-xs font-semibold transition-colors"
                      aria-label={t.learnMore}
                    >
                      {t.learnMore}
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>

                  {/* Trust Signals */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1 bg-slate-900/30 px-3 py-1.5 rounded-full border border-white/5">
                      {t.decrypt}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 bg-slate-900/30 px-3 py-1.5 rounded-full border border-white/5">
                      {t.gdpr}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 bg-slate-900/30 px-3 py-1.5 rounded-full border border-white/5">
                      {t.timeToRead}
                    </span>
                  </div>

                  {/* Explicit Consent Checkboxes */}
                  <div className="space-y-3 bg-slate-900/30 rounded-lg p-4 border border-white/5">
                    <p className="text-sm font-semibold text-white">
                      {t.byAccepting}
                    </p>
                    
                    <div className="space-y-2.5">
                      <label className="flex items-start gap-3 cursor-pointer group hover:bg-slate-800/30 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={checkedItems.readTerms}
                          onChange={(e) =>
                            setCheckedItems({
                              ...checkedItems,
                              readTerms: e.target.checked,
                            })
                          }
                          className="mt-1 w-4 h-4 rounded border-white/20 accent-ipl-gold cursor-pointer"
                          aria-label={t.readTerms}
                        />
                        <span className="text-sm text-gray-300 flex-1">{t.readTerms}</span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer group hover:bg-slate-800/30 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={checkedItems.acceptTerms}
                          onChange={(e) =>
                            setCheckedItems({
                              ...checkedItems,
                              acceptTerms: e.target.checked,
                            })
                          }
                          className="mt-1 w-4 h-4 rounded border-white/20 accent-ipl-gold cursor-pointer"
                          aria-label={t.acceptTerms}
                        />
                        <span className="text-sm text-gray-300 flex-1">{t.acceptTerms}</span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer group hover:bg-slate-800/30 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={checkedItems.understandLiability}
                          onChange={(e) =>
                            setCheckedItems({
                              ...checkedItems,
                              understandLiability: e.target.checked,
                            })
                          }
                          className="mt-1 w-4 h-4 rounded border-white/20 accent-ipl-gold cursor-pointer"
                          aria-label={t.understandLiability}
                        />
                        <span className="text-sm text-gray-300 flex-1">{t.understandLiability}</span>
                      </label>
                    </div>
                  </div>

                  {/* Last Acceptance Date */}
                  {lastAcceptanceDate && !needsReAcceptance && (
                    <p className="text-xs text-gray-500">
                      {t.acceptedOn}{" "}
                      <span className="text-gray-400 font-semibold">
                        {new Date(lastAcceptanceDate).toLocaleDateString(language)}
                      </span>
                    </p>
                  )}
                </motion.div>

                {/* Footer */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="sticky bottom-0 md:relative border-t border-white/10 bg-gradient-to-r from-white/2 to-white/1 px-6 py-4 flex gap-3"
                >
                  <button
                    onClick={handleDeclineClick}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm font-medium text-gray-200 hover:bg-slate-700/80 transition-colors"
                    aria-label={t.declineButton}
                  >
                    {t.declineButton}
                  </button>
                  <button
                    onClick={handleAcceptTerms}
                    disabled={
                      !checkedItems.readTerms ||
                      !checkedItems.acceptTerms ||
                      !checkedItems.understandLiability
                    }
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 hover:from-yellow-400 hover:to-amber-400 transition-all shadow-lg shadow-yellow-900/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-600 disabled:shadow-none"
                    aria-label={t.acceptButton}
                  >
                    {t.acceptButton}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}

        {/* Decline Feedback Modal */}
        {showDeclineFeedback && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full md:max-w-md bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="px-6 py-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/3">
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500" />
                  
                  <motion.h3
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="text-lg font-semibold text-white"
                  >
                    {t.declineReasonTitle}
                  </motion.h3>
                </div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="px-6 py-6"
                >
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder={t.declineReasonPlaceholder}
                    className="w-full h-24 bg-slate-800/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-ipl-gold/50 resize-none"
                    aria-label={t.declineReasonTitle}
                  />
                </motion.div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="border-t border-white/10 bg-gradient-to-r from-white/2 to-white/1 px-6 py-4 flex gap-3"
                >
                  <button
                    onClick={() => {
                      setShowDeclineFeedback(false);
                      setDeclineReason("");
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 bg-slate-800/60 text-sm font-medium text-gray-200 hover:bg-slate-700/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitDeclineFeedback}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500 transition-all shadow-lg shadow-red-900/40"
                  >
                    {t.sendAndExit}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
