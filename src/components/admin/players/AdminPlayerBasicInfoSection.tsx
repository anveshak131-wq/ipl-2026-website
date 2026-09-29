'use client';

import type { ReactNode } from 'react';
import { User, Award, Target, Shield, Users, Table2 } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import type { Team } from '@/types';
import { getRoleDisplay } from '@/lib/admin/playerAdminUtils';

export const NOT_SELECTED_SEASON_FILTER = '__not_selected_season__';

export interface PlayerBasicFormData {
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  allrounderType: 'Batting All-rounder' | 'Bowling All-rounder' | '';
  teamId: string;
  league: 'ipl' | 'wpl';
  isActiveInSquad: boolean;
  squadStatus?: 'active' | 'inactive' | 'retained' | 'released' | 'auction';
}

interface AdminPlayerBasicInfoSectionProps {
  formData: PlayerBasicFormData;
  teams: Team[];
  editingPlayerId?: string;
  onChange: (patch: Partial<PlayerBasicFormData>) => void;
  onAllrounderTypeChange: (value: string) => void;
  onTeamSelect: (value: string) => void;
}

function PreviewCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="oil-form-preview-cell">
      <span className="oil-form-preview-cell__label">{label}</span>
      <span className={`oil-form-preview-cell__value ${highlight ? 'oil-form-preview-cell__value--gold' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function FieldCard({
  accent,
  label,
  required,
  icon,
  children,
  hint,
}: {
  accent: 'gold' | 'teal' | 'cyan' | 'copper' | 'rose';
  label: string;
  required?: boolean;
  icon: ReactNode;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className={`oil-modal-field-card oil-modal-field-card--${accent} p-4`}>
      <label className="oil-form-label mb-2.5">
        {icon}
        <span>{label}</span>
        {required && <span className="text-[#ffaaa5]">*</span>}
      </label>
      {children}
      {hint && <p className="oil-form-hint mt-2">{hint}</p>}
    </div>
  );
}

export default function AdminPlayerBasicInfoSection({
  formData,
  teams,
  editingPlayerId,
  onChange,
  onAllrounderTypeChange,
  onTeamSelect,
}: AdminPlayerBasicInfoSectionProps) {
  const selectedTeam = teams.find((t) => String(t.id) === String(formData.teamId));
  const roleDisplay = formData.role
    ? getRoleDisplay({
        id: '',
        league: formData.league,
        name: formData.name,
        role: formData.role,
        allrounderType: formData.allrounderType || undefined,
        teamId: formData.teamId,
        age: 0,
        nationality: '',
        jerseyNumber: 0,
        isCaptain: false,
        bowlingStyle: '',
        battingStyle: '',
        stats: {
          matches: 0,
          runs: 0,
          wickets: 0,
          average: 0,
          strikeRate: 0,
          highest: 0,
          fours: 0,
          sixes: 0,
          fifties: 0,
          hundreds: 0,
          economy: 0,
          bestBowling: '-',
        },
      })
    : null;
  const teamLabel = formData.isActiveInSquad
    ? selectedTeam?.name || 'Select team'
    : 'Not selected for this season';

  return (
    <section className="oil-modal-section p-5 oil-rise" id="player-form-basic">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="oil-modal-icon !h-14 !w-14">
            <User className="h-7 w-7" />
          </div>
          <div>
            <div className="oil-hero-kicker mb-2">
              <Table2 className="h-3.5 w-3.5" />
              Squad identity
            </div>
            <h3 className="text-xl font-black tracking-tight text-white md:text-2xl">Basic Information</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-white/60">
              Enter the player&apos;s personal details and team assignment. The live register preview updates as you type.
            </p>
          </div>
        </div>
        <span className="oil-chip">Step 1 · Required fields</span>
      </div>

      {/* Live preview register table */}
      <div className="oil-form-preview-shell mb-6 overflow-hidden rounded-2xl">
        <div className="oil-form-preview-header px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#f2d39a]">
            <Table2 className="h-3.5 w-3.5" />
            Live squad register preview
          </div>
        </div>
        <div className="oil-table-scroll">
          <table className="oil-table oil-form-preview-table w-full">
            <thead>
              <tr>
                {['Player', 'Role', 'League', 'Team', 'Squad status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/45">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="oil-table-avatar !h-9 !w-9 text-sm"
                      style={{
                        background: selectedTeam
                          ? `linear-gradient(135deg, ${selectedTeam.colors.primary}, ${selectedTeam.colors.secondary})`
                          : undefined,
                      }}
                    >
                      {formData.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="font-semibold text-white">{formData.name || 'Unnamed player'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {roleDisplay ? (
                    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${roleDisplay.badgeClass}`}>
                      {roleDisplay.label}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="oil-table-stat-pill oil-table-stat-pill--cyan text-[11px]">
                    {formData.league?.toUpperCase() || 'IPL'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-white/80">{teamLabel}</td>
                <td className="px-4 py-3">
                  <span
                    className={`oil-table-stat-pill text-[11px] ${
                      formData.isActiveInSquad ? 'oil-table-stat-pill--teal' : 'oil-table-stat-pill--rose'
                    }`}
                  >
                    {formData.isActiveInSquad ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/5 md:grid-cols-4">
          <PreviewCell label="Display name" value={formData.name} highlight />
          <PreviewCell label="Cricket role" value={roleDisplay?.label || formData.role} />
          <PreviewCell label="Competition" value={formData.league === 'wpl' ? 'WPL' : 'IPL'} />
          <PreviewCell label="Franchise" value={selectedTeam?.shortName || '—'} highlight />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldCard accent="gold" label="Player name" required icon={<User className="h-4 w-4 text-[#f2d39a]" />}>
          <div className="oil-modal-input-wrap">
            <User className="oil-modal-input-icon text-white/40" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="oil-modal-input oil-modal-input--icon w-full"
              placeholder="Full name as on squad sheet"
              required
            />
          </div>
        </FieldCard>
        <FieldCard accent="purple" label="2027 Squad Status" icon={<Shield className="h-4 w-4 text-[#d9a8ff]" />}>
          <CustomSelect
            value={formData.squadStatus || (formData.isActiveInSquad ? 'retained' : 'released')}
            onChange={(newStatus) => {
              const status = newStatus as "active" | "inactive" | "retained" | "released" | "auction";
              const isActive = status === "retained" || status === "active";
              onChange({
                squadStatus: status,
                isActiveInSquad: isActive,
                ...(!isActive ? { teamId: "" } : {})
              });
            }}
            options={[
              { value: 'retained', label: 'Retained (Active 2027)' },
              { value: 'released', label: 'Released / Available' },
              { value: 'auction', label: 'Auction Pool' },
              { value: 'active', label: 'Active Squad' },
              { value: 'inactive', label: 'Inactive / Unavailable' },
            ]}
            placeholder="Select Squad Status"
            icon={<Shield className="w-5 h-5" />}
            iconColor="text-[#d9a8ff]"
          />
        </FieldCard>


        <FieldCard accent="teal" label="Role" required icon={<Award className="h-4 w-4 text-[#9cf2c8]" />}>
          <CustomSelect
            value={formData.role}
            onChange={(newRole) =>
              onChange({
                role: newRole as PlayerBasicFormData['role'],
                allrounderType: newRole === 'All-rounder' ? formData.allrounderType || '' : '',
              })
            }
            options={[
              { value: 'Batsman', label: 'Batsman' },
              { value: 'Bowler', label: 'Bowler' },
              { value: 'All-rounder', label: 'All-rounder' },
              { value: 'Wicket-keeper', label: 'Wicket-keeper' },
            ]}
            placeholder="Select role"
            icon={<Award className="w-5 h-5" />}
            iconColor="text-[#9cf2c8]"
            required
          />
        </FieldCard>

        {formData.role === 'All-rounder' && (
          <div className="md:col-span-2">
            <FieldCard
              accent="copper"
              label="All-rounder type"
              required
              icon={<Target className="h-4 w-4 text-[#f2d39a]" />}
            >
              <CustomSelect
                key={`allrounder-type-${editingPlayerId || 'new'}-${formData.allrounderType}`}
                value={formData.allrounderType || ''}
                onChange={onAllrounderTypeChange}
                options={[
                  { value: 'Batting All-rounder', label: 'Batting All-rounder' },
                  { value: 'Bowling All-rounder', label: 'Bowling All-rounder' },
                ]}
                placeholder="Select all-rounder type"
                icon={<Target className="w-5 h-5" />}
                iconColor="text-[#f2d39a]"
                required
              />
            </FieldCard>
          </div>
        )}

        <FieldCard accent="cyan" label="League" required icon={<Shield className="h-4 w-4 text-[#a8e9ef]" />}>
          <CustomSelect
            value={formData.league}
            onChange={(value) => onChange({ league: value as 'ipl' | 'wpl' })}
            options={[
              { value: 'ipl', label: 'IPL (Indian Premier League)' },
              { value: 'wpl', label: "WPL (Women's Premier League)" },
            ]}
            placeholder="Select league"
            icon={<Shield className="w-5 h-5" />}
            iconColor="text-[#a8e9ef]"
            required
          />
        </FieldCard>

        <FieldCard
          accent="gold"
          label="Team assignment"
          required={formData.isActiveInSquad}
          icon={<Users className="h-4 w-4 text-[#f2d39a]" />}
          hint={
            formData.isActiveInSquad
              ? 'Assign an active franchise for squad lists and scorecards.'
              : 'Player is in the not-selected pool for this season.'
          }
        >
          <CustomSelect
            value={formData.isActiveInSquad ? formData.teamId : NOT_SELECTED_SEASON_FILTER}
            onChange={onTeamSelect}
            options={[
              { value: NOT_SELECTED_SEASON_FILTER, label: 'Not Selected for This Season (admin only)' },
              ...teams
                .filter((team) => team.league === formData.league)
                .map((team) => ({ value: team.id, label: team.name })),
            ]}
            placeholder="Select a team"
            icon={<Users className="w-5 h-5" />}
            iconColor="text-[#f2d39a]"
            required={formData.isActiveInSquad}
            disabled={!formData.isActiveInSquad}
            searchable
          />
        </FieldCard>
      </div>
    </section>
  );
}
