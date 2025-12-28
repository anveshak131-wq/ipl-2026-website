'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Trophy, 
  Users, 
  Target, 
  Zap, 
  Shield, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Info,
  FileCheck,
  Gavel,
  Award
} from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';

export default function IPLRulesPage() {
  const { currentLeague } = useLeague();
  const isWPL = currentLeague === 'wpl';
  
  const [activeTab, setActiveTab] = useState<'2025' | '2026' | 'reference'>('2025');

  const rules2025 = [
    {
      icon: Users,
      title: 'Player Retention & Auction',
      items: [
        'Retain up to 6 players (5 capped + 1 uncapped)',
        'Right to Match (RTM) option reintroduced',
        'Salary cap increased to ₹120 crore',
        'Uncapped player rule reinstated'
      ]
    },
    {
      icon: Zap,
      title: 'In-Game Regulations',
      items: [
        'Saliva ban lifted (bowlers can shine ball)',
        'Two-ball rule for evening matches (11th over)',
        'DRS expanded for wides (height & off-side)',
        'Impact Player rule continues',
        'Powerplay: First 6 overs (2 fielders outside)',
        'Strategic timeouts: 2 per innings (2.5 min each)'
      ]
    },
    {
      icon: Clock,
      title: 'Over-Rate & Discipline',
      items: [
        'No immediate match bans for slow over-rates',
        'Financial penalties + demerit points system',
        'Demerit points carry forward for 36 months',
        '4 demerit points can lead to match ban'
      ]
    },
    {
      icon: Shield,
      title: 'Equipment & Safety',
      items: [
        'Bat dimensions enforcement (4cm edge, 6.7cm depth)',
        'In-game bat inspection system',
        'Two-ball rule for dew management'
      ]
    }
  ];

  const rules2026 = [
    {
      icon: Calendar,
      title: 'Tournament Structure',
      items: [
        '84 matches (increased from 74)',
        '10 teams competing',
        'March 26 - May 31, 2026',
        'Double round-robin + playoffs format'
      ]
    },
    {
      icon: FileCheck,
      title: 'Auction & Registration',
      items: [
        'Mini-auction (December 13-15, 2025)',
        'Mandatory registration for foreign players',
        'Two-year ban for unjustified withdrawals',
        'Salary cap: ₹120 crore (continued)'
      ]
    },
    {
      icon: Users,
      title: 'Retention Rules',
      items: [
        'No limit on retentions (within squad size & cap)',
        'Squad size limit: 25 players',
        'Retention deadline: November 15, 2025',
        'More flexibility in team building'
      ]
    },
    {
      icon: Award,
      title: 'Special Features',
      items: [
        'All 2025 in-game rules continue',
        'Golden badge for defending champions',
        'Suspension points: 36-month carry forward',
        'Future expansion: 94 matches by 2028'
      ]
    }
  ];

  const referenceTopics = [
    {
      title: 'Match Format',
      description: 'T20 format, 20 overs per innings, 120 balls maximum'
    },
    {
      title: 'Powerplay Rules',
      description: 'First 6 overs: 2 fielders outside 30-yard circle'
    },
    {
      title: 'DRS System',
      description: '2 reviews per innings, includes wides (height & off-side)'
    },
    {
      title: 'Scoring Rules',
      description: 'Complete guide to runs, extras, and dismissals'
    },
    {
      title: 'Points System',
      description: 'Win: 2 points, Loss: 0 points, Tie: 1 point each'
    },
    {
      title: 'Super Over',
      description: 'Unlimited Super Overs until winner determined'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const bgStyle = isWPL 
    ? { background: 'linear-gradient(to bottom, #1a0b2e, #16213e, #0f3460)' }
    : { background: '#0B0F13' };

  const headerGradient = isWPL
    ? 'linear-gradient(to right, #E91E63, #9C27B0, #673AB7)'
    : 'linear-gradient(to right, white, #93C5FD, #67E8F9)';

  return (
    <div className="min-h-screen flex flex-col" style={bgStyle}>
      <AuroraBackground />
      <Navbar />
      
      <main className="flex-1 relative z-20 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Gavel className="w-10 h-10" style={{ color: isWPL ? '#E91E63' : '#60A5FA' }} />
              <h1 
                className="text-5xl md:text-6xl font-bold"
                style={{
                  background: headerGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                IPL Rules & Regulations
              </h1>
            </div>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Complete guide to all rules, regulations, and changes for IPL 2025 and 2026 seasons
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            {[
              { id: '2025' as const, label: 'IPL 2025 Rules', icon: Calendar },
              { id: '2026' as const, label: 'IPL 2026 Rules', icon: Calendar },
              { id: 'reference' as const, label: 'Quick Reference', icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-3 rounded-xl font-bold transition-all
                    flex items-center gap-2
                    ${activeTab === tab.id
                      ? isWPL
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg scale-105'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                      : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {activeTab === '2025' && (
              <div className="space-y-8">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid md:grid-cols-2 gap-6"
                >
                  {rules2025.map((rule, index) => {
                    const Icon = rule.icon;
                    return (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-3 rounded-xl ${isWPL ? 'bg-pink-600/20' : 'bg-blue-600/20'}`}>
                            <Icon className={`w-6 h-6 ${isWPL ? 'text-pink-400' : 'text-blue-400'}`} />
                          </div>
                          <h3 className="text-xl font-bold text-white">{rule.title}</h3>
                        </div>
                        <ul className="space-y-2">
                          {rule.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-300">
                              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    );
                  })}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl p-6 border border-blue-500/30"
                >
                  <div className="flex items-start gap-4">
                    <Info className="w-6 h-6 text-blue-400 mt-1" />
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">Key Changes in 2025</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        IPL 2025 introduced several major rule changes including the lifting of the saliva ban, 
                        introduction of the two-ball rule for evening matches, expansion of DRS to include wides, 
                        and the reintroduction of the RTM option. The salary cap was also increased to ₹120 crore.
                      </p>
                      <Link
                        href="/docs/IPL_2025_RULES_AND_REGULATIONS.md"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold text-sm"
                      >
                        Read Full Documentation
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === '2026' && (
              <div className="space-y-8">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid md:grid-cols-2 gap-6"
                >
                  {rules2026.map((rule, index) => {
                    const Icon = rule.icon;
                    return (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-3 rounded-xl ${isWPL ? 'bg-pink-600/20' : 'bg-blue-600/20'}`}>
                            <Icon className={`w-6 h-6 ${isWPL ? 'text-pink-400' : 'text-blue-400'}`} />
                          </div>
                          <h3 className="text-xl font-bold text-white">{rule.title}</h3>
                        </div>
                        <ul className="space-y-2">
                          {rule.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-300">
                              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    );
                  })}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30"
                >
                  <div className="flex items-start gap-4">
                    <Info className="w-6 h-6 text-purple-400 mt-1" />
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">What's New in 2026</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        IPL 2026 will feature 84 matches (up from 74), with a mini-auction system and more flexible 
                        retention rules. All in-game regulations from 2025 continue, ensuring consistency. The tournament 
                        is scheduled from March 26 to May 31, 2026.
                      </p>
                      <Link
                        href="/docs/IPL_2026_RULES_AND_REGULATIONS.md"
                        className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold text-sm"
                      >
                        Read Full Documentation
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'reference' && (
              <div className="space-y-8">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {referenceTopics.map((topic, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all hover:scale-105"
                    >
                      <h3 className="text-lg font-bold text-white mb-2">{topic.title}</h3>
                      <p className="text-gray-300 text-sm">{topic.description}</p>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid md:grid-cols-3 gap-6"
                >
                  <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl p-6 border border-green-500/30">
                    <Target className="w-8 h-8 text-green-400 mb-3" />
                    <h4 className="text-lg font-bold text-white mb-2">Match Format</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• 20 overs per innings</li>
                      <li>• 120 balls maximum</li>
                      <li>• 10 wickets maximum</li>
                      <li>• ~3.5 hours duration</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl p-6 border border-blue-500/30">
                    <Zap className="w-8 h-8 text-blue-400 mb-3" />
                    <h4 className="text-lg font-bold text-white mb-2">Powerplay</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• First 6 overs</li>
                      <li>• 2 fielders outside circle</li>
                      <li>• Aggressive batting phase</li>
                      <li>• Strategic advantage</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30">
                    <Shield className="w-8 h-8 text-purple-400 mb-3" />
                    <h4 className="text-lg font-bold text-white mb-2">DRS System</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• 2 reviews per innings</li>
                      <li>• Wides reviewable (2025+)</li>
                      <li>• LBW, caught, run out</li>
                      <li>• Enhanced accuracy</li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-2xl p-6 border border-amber-500/30"
                >
                  <div className="flex items-start gap-4">
                    <FileText className="w-6 h-6 text-amber-400 mt-1" />
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">Complete Rules Reference</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        For detailed scoring rules, dismissal types, extras, and all technical aspects of IPL cricket, 
                        refer to our complete rules reference guide.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href="/docs/IPL_COMPLETE_RULES_REFERENCE.md"
                          className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold text-sm"
                        >
                          Quick Reference Guide
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          href="/docs/IPL_CRICKET_SCORING_RULES.md"
                          className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold text-sm"
                        >
                          Scoring Rules
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Documentation Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Complete Documentation</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/rules/ipl-2025"
                className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-6 border border-blue-500/30 hover:border-blue-400 transition-all hover:scale-105"
              >
                <FileText className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="text-lg font-bold text-white mb-2">IPL 2025 Rules</h4>
                <p className="text-sm text-gray-300 mb-4">
                  Complete guide to all rules and regulations for the 2025 season
                </p>
                <span className="text-blue-400 group-hover:text-blue-300 font-semibold text-sm inline-flex items-center gap-2">
                  Read More <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link
                href="/rules/ipl-2026"
                className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30 hover:border-purple-400 transition-all hover:scale-105"
              >
                <FileText className="w-8 h-8 text-purple-400 mb-3" />
                <h4 className="text-lg font-bold text-white mb-2">IPL 2026 Rules</h4>
                <p className="text-sm text-gray-300 mb-4">
                  Complete guide to all rules and regulations for the 2026 season
                </p>
                <span className="text-purple-400 group-hover:text-purple-300 font-semibold text-sm inline-flex items-center gap-2">
                  Read More <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link
                href="/rules/quick-reference"
                className="group bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-xl p-6 border border-amber-500/30 hover:border-amber-400 transition-all hover:scale-105"
              >
                <BookOpen className="w-8 h-8 text-amber-400 mb-3" />
                <h4 className="text-lg font-bold text-white mb-2">Quick Reference</h4>
                <p className="text-sm text-gray-300 mb-4">
                  Quick lookup guide for match format, scoring, and common rules
                </p>
                <span className="text-amber-400 group-hover:text-amber-300 font-semibold text-sm inline-flex items-center gap-2">
                  Read More <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-12"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {[
                {
                  q: 'How many overs are there in an IPL match?',
                  a: 'Each team gets 20 overs per innings, making it a total of 40 overs in a match (T20 format).'
                },
                {
                  q: 'What is the Impact Player rule?',
                  a: 'Teams can substitute one player during a match. The Impact Player must be named in the squad before the match and can be used strategically based on match situation.'
                },
                {
                  q: 'Can teams use DRS for wide balls?',
                  a: 'Yes, from IPL 2025 onwards, teams can use DRS to challenge height and off-side wide calls. Leg-side wides remain at the umpire\'s discretion.'
                },
                {
                  q: 'What is the two-ball rule?',
                  a: 'In evening matches, a fresh ball can be introduced from the 11th over of the second innings to counteract dew effects, subject to umpires\' assessment.'
                },
                {
                  q: 'What is the salary cap for IPL teams?',
                  a: 'The salary cap is ₹120 crore per franchise for both IPL 2025 and 2026 seasons.'
                },
                {
                  q: 'How many players can a team retain?',
                  a: 'In 2025, teams can retain up to 6 players. In 2026, there is no limit on retentions, but teams must stay within the squad size of 25 players and salary cap.'
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50"
                >
                  <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Info className={`w-5 h-5 ${isWPL ? 'text-pink-400' : 'text-blue-400'}`} />
                    {faq.q}
                  </h4>
                  <p className="text-gray-300 text-sm ml-7">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

