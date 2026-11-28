'use client';

import React, { useState, useMemo } from 'react';
import type { Player } from '@/types';
import {
  X,
  Shield,
  Plane,
  DollarSign,
  Users,
  Check,
  AlertTriangle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import {
  IPL_2027_TEAMS,
  IPL2027TeamMeta,
  computeFranchiseRosterHealth,
  isPlayerOverseas,
  parseFeeInCrores,
  resolveIpl2027Team,
} from '@/lib/admin/ipl2027Teams';
import PlayerMonogramAvatar from '@/components/admin/players/PlayerMonogramAvatar';

interface SignReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlayer?: Player | null; // If signing a specific unassigned player
  targetTeamId?: string | null; // If signing into a specific team from health meter
  allPlayers: Player[];
  onConfirmSign: (player: Player, targetTeam: IPL2027TeamMeta, fee: string, status: string) => Promise<void>;
}

export default function SignReplacementModal({
  isOpen,
  onClose,
  targetPlayer,
  targetTeamId,
  allPlayers,
  onConfirmSign,
}: SignReplacementModalProps) {
  // If no target player, user selects from pool
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(targetPlayer || null);
  // If targetTeamId provided, default to it
  const [selectedTeamMeta, setSelectedTeamMeta] = useState<IPL2027TeamMeta | null>(() => {
    if (targetTeamId && targetTeamId !== 'all' && targetTeamId !== 'pool') {
      return resolveIpl2027Team(targetTeamId) || null;
    }
    return null;
  });

  const [contractStatus, setContractStatus] = useState<string>('Injury Replacement');
  const [customFee, setCustomFee] = useState<string>('₹0.50 Cr');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when props change
  React.useEffect(() => {
    if (targetPlayer) {
      setSelectedPlayer(targetPlayer);
      setCustomFee(targetPlayer.transferFee || '₹0.50 Cr');
    }
    if (targetTeamId && targetTeamId !== 'all' && targetTeamId !== 'pool') {
      const meta = resolveIpl2027Team(targetTeamId);
      if (meta) setSelectedTeamMeta(meta);
    }
    setErrorMsg(null);
  }, [targetPlayer, targetTeamId, isOpen]);

  // Unassigned / Standby (RAPP) players list
  const availablePoolPlayers = useMemo(() => {
    return allPlayers.filter((p) => {
      const isPool =
        p.teamId === 'pool' ||
        p.teamId === 'STANDBY_2027' ||
        (p.team || '').toLowerCase().includes('standby') ||
        (p.team || '').toLowerCase().includes('auction pool') ||
        (p.team || '').toLowerCase().includes('unassigned') ||
        (p.squadStatus || '').toLowerCase().includes('release');
      return isPool;
    });
  }, [allPlayers]);

  if (!isOpen) return null;

  // Selected player overseas check
  const playerIsOverseas = selectedPlayer ? isPlayerOverseas(selectedPlayer.nationality) : false;

  // Handler for confirm
  const handleExecuteSign = async () => {
    if (!selectedPlayer) {
      setErrorMsg('Please select a player to sign.');
      return;
    }
    if (!selectedTeamMeta) {
      setErrorMsg('Please select a destination franchise.');
      return;
    }

    // Check health & limits
    const health = computeFranchiseRosterHealth(selectedTeamMeta, allPlayers);
    if (health) {
      if (health.squadCount >= health.squadMax) {
        setErrorMsg(`${selectedTeamMeta.name} already has a full 25-man squad. You must release a player first.`);
        return;
      }
      if (playerIsOverseas && health.overseasCount >= health.overseasMax) {
        setErrorMsg(`${selectedTeamMeta.name} already has the maximum permitted 8 overseas players under BCCI rules.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmSign(selectedPlayer, selectedTeamMeta, customFee, contractStatus);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to complete signing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <UserCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">
                Sign RAPP Standby Player to Franchise
              </h3>
              <p className="text-xs text-white/50">
                Execute in-season injury replacement or post-auction squad intake under BCCI regulations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Step: Player Selection (if not preselected) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white/70">
              1. Standby Player to Sign (RAPP Pool)
            </label>

            {targetPlayer ? (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-slate-900/60">
                <PlayerMonogramAvatar
                  name={targetPlayer.name}
                  teamShortName="POOL"
                  team="Standby"
                  jerseyNumber={targetPlayer.jerseyNumber}
                  size="md"
                />
                <div className="flex-1">
                  <div className="text-sm font-black text-white">{targetPlayer.name}</div>
                  <div className="text-xs text-white/60 flex items-center gap-2 mt-0.5">
                    <span>{targetPlayer.role || 'Player'}</span>
                    <span>·</span>
                    <span>{targetPlayer.nationality || 'India'}</span>
                    {playerIsOverseas && (
                      <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                        ✈️ Overseas
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <select
                value={selectedPlayer?.id || ''}
                onChange={(e) => {
                  const p = availablePoolPlayers.find((x) => String(x.id) === e.target.value);
                  setSelectedPlayer(p || null);
                  if (p) setCustomFee(p.transferFee || '₹0.50 Cr');
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-[#f2d39a]"
              >
                <option value="">-- Select Player from Standby Pool ({availablePoolPlayers.length} available) --</option>
                {availablePoolPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role || 'All-Rounder'}, {p.nationality || 'India'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Step: Franchise Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white/70">
              2. Destination Franchise (BCCI Cap Checks)
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1">
              {IPL_2027_TEAMS.map((team) => {
                const health = computeFranchiseRosterHealth(team, allPlayers);
                const isSelected = selectedTeamMeta?.id === team.id;
                const isFull = health ? health.squadCount >= health.squadMax : false;
                const isOverseasBlocked = playerIsOverseas && health ? health.overseasCount >= health.overseasMax : false;
                const isDisabled = isFull || isOverseasBlocked;

                return (
                  <button
                    key={team.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSelectedTeamMeta(team)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-900/40 border-white/5'
                        : isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/40'
                        : 'border-white/10 bg-slate-900/70 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-black" style={{ color: team.primaryColor || '#f2d39a' }}>
                        {team.shortName}
                      </div>
                      <div className="text-[11px] font-bold text-white truncate mt-0.5">
                        {team.name.split(' ')[0]}
                      </div>
                    </div>

                    <div className="mt-2 text-[9px] space-y-0.5">
                      <div className={isFull ? 'text-red-400 font-bold' : 'text-white/60'}>
                        {health ? `${health.squadCount}/25 Squad` : 'Squad Open'}
                      </div>
                      <div className={isOverseasBlocked ? 'text-red-400 font-bold' : 'text-sky-300'}>
                        ✈️ {health ? `${health.overseasCount}/8 OS` : 'OS Open'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Step: Contract & Valuation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                Contract Mechanism
              </label>
              <select
                value={contractStatus}
                onChange={(e) => setContractStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-[#f2d39a]"
              >
                <option value="Injury Replacement">Injury Replacement (BCCI RAPP)</option>
                <option value="Retained">Direct Contract / Retained</option>
                <option value="Mid-Season Loan">Mid-Season Loan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                Agreed Valuation / Fee
              </label>
              <input
                type="text"
                value={customFee}
                onChange={(e) => setCustomFee(e.target.value)}
                placeholder="e.g. ₹0.50 Cr or ₹1.00 Cr"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-[#f2d39a]"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedPlayer || !selectedTeamMeta || isSubmitting}
            onClick={handleExecuteSign}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50"
          >
            {isSubmitting ? (
              <span>Executing Signing...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm Signing to {selectedTeamMeta?.shortName || 'Franchise'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
