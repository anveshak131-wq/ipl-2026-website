"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TermsLanguage, termsTranslations } from "@/lib/terms-translations";

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline?: () => void;
  needsReAcceptance?: boolean;
  lastAcceptanceDate?: string | null;
}

/**
 * Reusable Terms and Conditions Acceptance Modal
 * Can be used on any page (home page, splash screen, etc.)
 * 
 * Features:
 * - 7 language support (English, Spanish, Hindi, French, Telugu, Kannada, Tamil)
 * - 3 explicit checkboxes for consent
 * - Accept button disabled until all checked
 * - Decline confirmation
 * - Version tracking and re-acceptance
 * - Analytics integration
 * - Full accessibility support
 */
export default function TermsAcceptanceModal({
  isOpen,
  onAccept,
  onDecline,
  needsReAcceptance = false,
  lastAcceptanceDate = null,
}: TermsAcceptanceModalProps) {
  const [language, setLanguage] = useState<TermsLanguage>("en");
  const [showDeclineFeedback, setShowDeclineFeedback] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [checkedItems, setCheckedItems] = useState({
    readTerms: false,
    acceptTerms: false,
    understandLiability: false,
  });

  const t = termsTranslations[language];
  const REQUIRED_TERMS_VERSION = "1.1";

  const handleAcceptTerms = async () => {
    localStorage.setItem("terms_accepted", "true");
    localStorage.setItem("terms_accepted_date", new Date().toISOString());
    localStorage.setItem("terms_version", REQUIRED_TERMS_VERSION);
    
    // Analytics: Track acceptance
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "terms_accepted", {
        version: REQUIRED_TERMS_VERSION,
        timestamp: new Date().toISOString(),
        language: language,
      });
    }

    // Sync terms acceptance to backend
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        await fetch("/api/preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            termsAccepted: true,
            emailNotificationsEnabled: true, // Enable email notifications by default
          }),
        });
      }
    } catch (error) {
      console.error("Failed to sync terms acceptance:", error);
      // Don't block user acceptance if backend sync fails
    }

    setCheckedItems({
      readTerms: false,
      acceptTerms: false,
      understandLiability: false,
    });

    onAccept();
  };

  const handleDeclineClick = () => {
    if (window.confirm(t.confirmDecline)) {
      setShowDeclineFeedback(true);
    }
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

    // Submit feedback to backend
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
    
    if (onDecline) {
      onDecline();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0"
        >
          {/* Mobile: Full screen, Desktop: Centered dialog */}
          <div className="w-full md:max-w-md max-h-[95vh] overflow-y-auto md:max-h-none md:overflow-visible bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-none md:rounded-2xl border-0 md:border border-white/10 shadow-2xl md:overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 md:relative px-6 py-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/3">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500" />
              
              {/* Language selector */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as TermsLanguage)}
                  className="text-xs bg-slate-800/60 border border-white/10 text-gray-300 rounded px-2 py-1 hover:bg-slate-700"
                  aria-label="Language selection"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="hi">हिन्दी</option>
                  <option value="fr">Français</option>
                  <option value="te">తెలుగు</option>
                  <option value="kn">ಕನ್ನಡ</option>
                  <option value="ta">தமிழ்</option>
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
                  href="/terms"
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
      </>
    </AnimatePresence>
  );
}
