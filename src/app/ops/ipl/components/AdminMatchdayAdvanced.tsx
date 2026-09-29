'use client';

import { useState } from 'react';
import { Calendar, MapPin, Plus, Save, Trash2, X } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  pitchType: string;
  floodlights: boolean;
  status: 'active' | 'maintenance' | 'inactive';
}

interface MatchCondition {
  id: string;
  venueId: string;
  matchId: string;
  pitchReport: string;
  outfieldCondition: string;
  tossImpact: string;
}

const initialVenues: Venue[] = [
  { id: '1', name: 'M. Chinnaswamy Stadium', city: 'Bengaluru', capacity: 38000, pitchType: 'Red Soil', floodlights: true, status: 'active' },
  { id: '2', name: 'M. A. Chidambaram Stadium', city: 'Chennai', capacity: 50000, pitchType: 'Black Soil', floodlights: true, status: 'active' },
];

const initialConditions: MatchCondition[] = [
  { id: '1', venueId: '1', matchId: 'match-001', pitchReport: 'Balanced pitch with good bounce for both batters and bowlers.', outfieldCondition: 'Excellent and well maintained', tossImpact: 'Record the tactical impact of the toss here.' },
];

export default function AdminMatchdayAdvanced() {
  const [venues, setVenues] = useState(initialVenues);
  const [conditions] = useState(initialConditions);
  const [activeView, setActiveView] = useState<'overview' | 'venues' | 'conditions'>('overview');
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);

  const updateVenue = (field: keyof Venue, value: string | number | boolean) => {
    setEditingVenue((current) => current ? { ...current, [field]: value } : current);
  };

  const saveVenue = () => {
    if (!editingVenue) return;
    setVenues((current) => current.some((venue) => venue.id === editingVenue.id)
      ? current.map((venue) => venue.id === editingVenue.id ? editingVenue : venue)
      : [...current, editingVenue]);
    setEditingVenue(null);
  };

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-blue-400">Match operations</p>
            <h1 className="text-3xl font-bold">Match Day Admin</h1>
            <p className="mt-2 text-gray-400">Manage venues, pitch reports, and match-day conditions.</p>
          </div>
          <button type="button" onClick={() => setEditingVenue({ id: `venue-${Date.now()}`, name: '', city: '', capacity: 0, pitchType: '', floodlights: true, status: 'active' })} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"><Plus className="h-4 w-4" /> Add venue</button>
        </div>

        <div className="mb-6 flex gap-2 border-b border-white/10 pb-2">
          {(['overview', 'venues', 'conditions'] as const).map((view) => <button key={view} type="button" onClick={() => setActiveView(view)} className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${activeView === view ? 'bg-blue-500/20 text-blue-300' : 'text-gray-400 hover:text-white'}`}>{view}</button>)}
        </div>

        {activeView === 'overview' && <div className="grid gap-4 md:grid-cols-3"><SummaryCard icon={<MapPin className="h-5 w-5" />} label="Venues" value={venues.length} /><SummaryCard icon={<Calendar className="h-5 w-5" />} label="Condition reports" value={conditions.length} /><SummaryCard icon={<Save className="h-5 w-5" />} label="Active venues" value={venues.filter((venue) => venue.status === 'active').length} /></div>}

        {activeView === 'venues' && <div className="grid gap-4 md:grid-cols-2">{venues.map((venue) => <section key={venue.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{venue.name || 'Unnamed venue'}</h2><p className="mt-1 text-sm text-gray-400">{venue.city || 'City not set'} · {venue.capacity.toLocaleString()} seats</p></div><button type="button" onClick={() => setEditingVenue(venue)} className="text-sm text-blue-300 hover:text-blue-200">Edit</button></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-300"><div><span className="text-gray-500">Pitch</span><br />{venue.pitchType || 'Not set'}</div><div><span className="text-gray-500">Status</span><br />{venue.status}</div></div></section>)}</div>}

        {activeView === 'conditions' && <div className="space-y-4">{conditions.map((condition) => <section key={condition.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-semibold">Match {condition.matchId}</h2><span className="text-sm text-gray-400">Venue {condition.venueId}</span></div><p className="mt-3 text-sm text-gray-300">{condition.pitchReport}</p><p className="mt-2 text-sm text-gray-400">Outfield: {condition.outfieldCondition}</p><p className="mt-2 text-sm text-gray-400">Toss notes: {condition.tossImpact}</p></section>)}</div>}
      </div>

      {editingVenue && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-lg rounded-xl border border-white/10 bg-gray-900 p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">Edit venue</h2><button type="button" onClick={() => setEditingVenue(null)} aria-label="Close"><X className="h-5 w-5" /></button></div><div className="grid gap-4"><Field label="Name" value={editingVenue.name} onChange={(value) => updateVenue('name', value)} /><Field label="City" value={editingVenue.city} onChange={(value) => updateVenue('city', value)} /><Field label="Pitch type" value={editingVenue.pitchType} onChange={(value) => updateVenue('pitchType', value)} /><Field label="Capacity" type="number" value={String(editingVenue.capacity)} onChange={(value) => updateVenue('capacity', Number(value) || 0)} /><label className="text-sm text-gray-300">Status<select value={editingVenue.status} onChange={(event) => updateVenue('status', event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-white"><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></label></div><div className="mt-6 flex justify-end gap-3">{venues.some((venue) => venue.id === editingVenue.id) && <button type="button" onClick={() => { setVenues((current) => current.filter((venue) => venue.id !== editingVenue.id)); setEditingVenue(null); }} className="mr-auto inline-flex items-center gap-2 text-red-300"><Trash2 className="h-4 w-4" /> Delete</button>}<button type="button" onClick={() => setEditingVenue(null)} className="rounded-lg px-4 py-2 text-gray-300 hover:bg-white/10">Cancel</button><button type="button" onClick={saveVenue} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"><Save className="h-4 w-4" /> Save</button></div></div></div>}
    </main>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center gap-2 text-blue-300">{icon}<span className="text-sm text-gray-400">{label}</span></div><p className="mt-3 text-3xl font-bold">{value}</p></div>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="text-sm text-gray-300">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-white" /></label>;
}
