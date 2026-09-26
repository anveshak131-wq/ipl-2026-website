'use client';

import { useState } from 'react';
import { Calendar, MapPin, Plus, Trash2 } from 'lucide-react';

interface Venue { id: string; name: string; city: string; capacity: number; pitchType: string; status: 'active' | 'maintenance' | 'inactive'; }

const initialVenues: Venue[] = [
  { id: '1', name: 'M. Chinnaswamy Stadium', city: 'Bengaluru', capacity: 38000, pitchType: 'Red Soil', status: 'active' },
  { id: '2', name: 'M. A. Chidambaram Stadium', city: 'Chennai', capacity: 50000, pitchType: 'Black Soil', status: 'active' },
];

export default function WPLMatchDayAdmin() {
  const [venues, setVenues] = useState(initialVenues);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Venue>({ id: '', name: '', city: '', capacity: 0, pitchType: '', status: 'active' });

  const addVenue = () => {
    if (!draft.name.trim()) return;
    setVenues((current) => [...current, { ...draft, id: `venue-${Date.now()}` }]);
    setDraft({ id: '', name: '', city: '', capacity: 0, pitchType: '', status: 'active' });
    setShowForm(false);
  };

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div><p className="mb-2 text-sm uppercase tracking-[0.2em] text-pink-400">Match operations</p><h1 className="text-3xl font-bold">WPL Match Day Admin</h1><p className="mt-2 text-gray-400">Manage venues and match-day conditions.</p></div>
          <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 font-medium hover:bg-pink-500"><Plus className="h-4 w-4" /> Add venue</button>
        </div>
        <div className="mb-6 grid gap-4 md:grid-cols-3"><Summary icon={<MapPin className="h-5 w-5" />} label="Venues" value={venues.length} /><Summary icon={<Calendar className="h-5 w-5" />} label="Active venues" value={venues.filter((venue) => venue.status === 'active').length} /><Summary icon={<MapPin className="h-5 w-5" />} label="Capacity" value={venues.reduce((total, venue) => total + venue.capacity, 0)} /></div>
        <div className="grid gap-4 md:grid-cols-2">{venues.map((venue) => <section key={venue.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">{venue.name}</h2><p className="mt-1 text-sm text-gray-400">{venue.city} · {venue.capacity.toLocaleString()} seats</p></div><button type="button" onClick={() => setVenues((current) => current.filter((item) => item.id !== venue.id))} aria-label={`Delete ${venue.name}`} className="text-red-300 hover:text-red-200"><Trash2 className="h-4 w-4" /></button></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-300"><div><span className="text-gray-500">Pitch</span><br />{venue.pitchType}</div><div><span className="text-gray-500">Status</span><br />{venue.status}</div></div></section>)}</div>
      </div>
      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-lg rounded-xl border border-white/10 bg-gray-900 p-6"><h2 className="mb-5 text-xl font-semibold">Add venue</h2><div className="grid gap-4">{(['name', 'city', 'pitchType'] as const).map((field) => <label key={field} className="text-sm text-gray-300">{field === 'pitchType' ? 'Pitch type' : field[0].toUpperCase() + field.slice(1)}<input value={draft[field]} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-white" /></label>)}<label className="text-sm text-gray-300">Capacity<input type="number" value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: Number(event.target.value) || 0 })} className="mt-1 w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-white" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-gray-300 hover:bg-white/10">Cancel</button><button type="button" onClick={addVenue} className="rounded-lg bg-pink-600 px-4 py-2 font-medium hover:bg-pink-500">Save venue</button></div></div></div>}
    </main>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center gap-2 text-pink-300">{icon}<span className="text-sm text-gray-400">{label}</span></div><p className="mt-3 text-3xl font-bold">{value.toLocaleString()}</p></div>; }
