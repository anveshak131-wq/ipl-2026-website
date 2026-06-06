'use client';

import { motion } from 'framer-motion';
import { BarChart3, Target, TrendingUp, Trophy, Zap } from 'lucide-react';

interface StatsHeroSectionProps {
  totalPlayers: number;
  totalTeams: number;
  totalRuns: number;
  totalWickets: number;
}

export default function StatsHeroSection({
  totalPlayers,
  totalTeams,
  totalRuns,
  totalWickets,
}: StatsHeroSectionProps) {
  const stats = [
    { icon: Trophy, label: 'Registered players', value: totalPlayers, color: 'from-amber-300 to-orange-500' },
    { icon: Target, label: 'IPL franchises', value: totalTeams, color: 'from-fuchsia-400 to-violet-500' },
    { icon: TrendingUp, label: 'Runs recorded', value: totalRuns.toLocaleString(), color: 'from-sky-300 to-cyan-500' },
    { icon: Zap, label: 'Wickets taken', value: totalWickets.toLocaleString(), color: 'from-emerald-300 to-lime-500' },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,18,0.28)_0%,rgba(8,10,18,0.78)_82%)]" />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-28 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0 42px, rgba(252, 211, 77, 0.28) 43px 45px, transparent 46px 88px)',
        }}
        animate={{ backgroundPositionX: ['0px', '88px'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
      <div className="absolute left-0 top-16 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent" />
      <div className="absolute bottom-20 left-1/2 h-40 w-[min(90vw,720px)] -translate-x-1/2 rounded-[50%] border border-emerald-300/10" />

      <div className="relative z-10 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-6 inline-flex items-center gap-2 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2"
          >
            <BarChart3 className="h-4 w-4 text-amber-200" />
            <span className="text-sm font-semibold uppercase text-amber-100 tracking-[0]">IPL 2026 stats desk</span>
          </motion.div>

          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl"
              >
                IPL 2026 Stats Centre
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.22 }}
                className="mt-5 max-w-3xl text-base leading-7 text-slate-200 md:text-lg"
              >
                Follow the Orange Cap, Purple Cap, strike rate, economy rate, points table and
                team form from every published IPL scorecard.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.34 }}
                className="mt-6 grid max-w-2xl grid-cols-1 gap-3 text-sm text-slate-200 sm:grid-cols-3"
              >
                {['Batting leaders', 'Bowling leaders', 'Team standings'].map((item) => (
                  <div key={item} className="rounded-md border border-white/10 bg-black/25 px-3 py-2">
                    {item}
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.26 }}
              className="hidden rounded-lg border border-white/[0.15] bg-black/40 p-4 shadow-2xl backdrop-blur-xl lg:block"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400 tracking-[0]">Match data</span>
                <span className="rounded-md bg-emerald-400/[0.12] px-2 py-1 text-xs font-semibold text-emerald-200">
                  Live view
                </span>
              </div>
              <div className="space-y-3">
                {[
                  ['Orange Cap race', totalRuns.toLocaleString(), 'runs tracked'],
                  ['Purple Cap race', totalWickets.toLocaleString(), 'wickets tracked'],
                  ['Franchise view', totalTeams.toString(), 'teams compared'],
                ].map(([label, value, helper], index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.45 + index * 0.08 }}
                    className="rounded-md border border-white/10 bg-white/[0.06] p-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-white">{label}</span>
                      <span className="text-lg font-black text-amber-200">{value}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{helper}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.45 + index * 0.07,
                  type: 'spring',
                  stiffness: 120,
                  damping: 18,
                }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-lg border border-white/[0.15] bg-black/[0.35] p-4 backdrop-blur-xl transition-colors duration-300 hover:border-white/30 md:p-5"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color}`} />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
                  animate={{ x: ['-120%', '120%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5, ease: 'linear' }}
                />
                <div className="relative z-10">
                  <div className={`mb-4 inline-flex rounded-md bg-gradient-to-br ${stat.color} p-2.5 shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-2xl font-black text-white md:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-300 md:text-sm">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
