'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type LegalPageKey = 'legal' | 'privacy' | 'terms';

interface LegalPanel {
  id: string;
  title: string;
  body: string;
}

interface LegalContentState {
  legal: string;
  privacy: string;
  terms: string;
}

// Default templates used when there is no custom content in KV.
// These mirror the public fallback content but can be tuned over time.
const defaultTemplates: LegalContentState = {
  legal:
    'SportsUp99 is an independent IPL 2026 experience platform created for fans to explore match data, team information, and modern sports product design. It is not an official product of the BCCI, IPL, or any franchise. All team names, logos, and trademarks belong to their respective owners and are used here strictly for illustrative and educational purposes.',
  privacy:
    'SportsUp99 is a demo IPL 2026 experience platform. We store only the minimum information required to support features such as authentication, live chat, and engagement analytics. No personal data is sold or shared with third parties for advertising or profiling.',
  terms:
    'SportsUp99 is a fan-built demo experience for exploring IPL-style product flows, not an official IPL or BCCI property. All content is provided on an "as-is" basis for experimentation, learning, and entertainment only.',
};

export default function AdminLegalPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<LegalPageKey | null>(null);
  const [activeTab, setActiveTab] = useState<LegalPageKey>('legal');
  const [content, setContent] = useState<LegalContentState>(defaultTemplates);
  const [panels, setPanels] = useState<Record<LegalPageKey, LegalPanel[]>>({
    legal: [
      {
        id: 'legal-default-1',
        title: 'Legal notice',
        body: defaultTemplates.legal,
      },
    ],
    privacy: [
      {
        id: 'privacy-default-1',
        title: 'Privacy Policy',
        body: defaultTemplates.privacy,
      },
    ],
    terms: [
      {
        id: 'terms-default-1',
        title: 'Terms of Service',
        body: defaultTemplates.terms,
      },
    ],
  });

  // Auth check (same style as other admin pages)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      if (!token) {
        router.push('/ipl-admin-2026');
        return;
      }
      try {
        const res = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('auth_token');
          router.push('/ipl-admin-2026');
          return;
        }
        const role = data.user?.role;
        if (role !== 'admin' && role !== 'super_admin') {
          alert('Access denied. Admin privileges required.');
          router.push('/');
          return;
        }
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/ipl-admin-2026');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Load existing legal content from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadContentFor = async (key: LegalPageKey) => {
      try {
        const res = await fetch(`/api/legal?page=${key}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.content && typeof data.content === 'string') {
          const raw = data.content as string;
          setContent((prev) => ({ ...prev, [key]: raw }));

          let parsedPanels: LegalPanel[] | null = null;
          try {
            const maybeJson = JSON.parse(raw);
            if (Array.isArray(maybeJson)) {
              parsedPanels = maybeJson
                .map((item: any, index: number) => {
                  if (!item) return null;
                  const title =
                    typeof item.title === 'string' && item.title.trim()
                      ? item.title
                      : `Panel ${index + 1}`;
                  const body = typeof item.body === 'string' ? item.body : '';
                  const id =
                    typeof item.id === 'string' && item.id.trim()
                      ? item.id
                      : `${key}-${index + 1}`;
                  if (!body.trim()) return null;
                  return { id, title, body };
                })
                .filter((panel): panel is LegalPanel => panel !== null);
            }
          } catch {
          }

          if (!parsedPanels || parsedPanels.length === 0) {
            if (raw.trim().length > 0) {
              parsedPanels = [
                {
                  id: `${key}-1`,
                  title:
                    key === 'legal'
                      ? 'Legal notice'
                      : key === 'privacy'
                      ? 'Privacy Policy'
                      : 'Terms of Service',
                  body: raw,
                },
              ];
            }
          }

          if (parsedPanels && parsedPanels.length > 0) {
            setPanels((prev) => ({
              ...prev,
              [key]: parsedPanels as LegalPanel[],
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load legal page', key, err);
      }
    
    return undefined;
    return undefined;
    return undefined;
    return undefined;
    return undefined;};

    loadContentFor('legal');
    loadContentFor('privacy');
    loadContentFor('terms');
  }, [isAuthenticated]);

  const handleSave = async (key: LegalPageKey) => {
    try {
      setSavingKey(key);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      if (!token) {
        alert('Missing admin token. Please log in again.');
        router.push('/ipl-admin-2026');
        return;
      }
      const payloadContent =
        content[key] === '' ? '' : JSON.stringify(panels[key] || []);
      const res = await fetch(`/api/legal?page=${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: payloadContent }),
      });
      if (!res.ok) {
        alert('Failed to save content');
        return;
      }
      setContent((prev) => ({ ...prev, [key]: payloadContent }));
      alert('Content saved successfully.');
    } catch (err) {
      console.error('Failed to save legal content', err);
      alert('Error saving content');
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetToDefault = (key: LegalPageKey) => {
    // Restore the recommended template for this page in the editor;
    // admin still needs to click Save to persist it to KV.
    setContent((prev) => ({
      ...prev,
      [key]: defaultTemplates[key],
    }));
    setPanels((prev) => ({
      ...prev,
      [key]: [
        {
          id: `${key}-default-1`,
          title:
            key === 'legal'
              ? 'Legal notice'
              : key === 'privacy'
              ? 'Privacy Policy'
              : 'Terms of Service',
          body: defaultTemplates[key],
        },
      ],
    }));
  };

  const handleClearCustom = (key: LegalPageKey) => {
    // Clear custom content so the public page falls back to the built-in default.
    // An empty string means the public page will ignore KV and render its own sections.
    const confirmed = window.confirm(
      'Clear this page content and use the default public layout instead? You can always add new content later.',
    );
    if (!confirmed) return;
    setContent((prev) => ({
      ...prev,
      [key]: '',
    }));
    setPanels((prev) => ({
      ...prev,
      [key]: [],
    }));
  };

  const handleAddPanel = (key: LegalPageKey) => {
    setPanels((prev) => {
      const existing = prev[key] || [];
      const nextIndex = existing.length + 1;
      const title =
        key === 'legal'
          ? `Legal panel ${nextIndex}`
          : key === 'privacy'
          ? `Privacy panel ${nextIndex}`
          : `Terms panel ${nextIndex}`;
      return {
        ...prev,
        [key]: [
          ...existing,
          {
            id: `${key}-${Date.now()}-${nextIndex}`,
            title,
            body: '',
          },
        ],
      };
    });
  };

  const handleUpdatePanel = (
    key: LegalPageKey,
    panelId: string,
    field: 'title' | 'body',
    value: string,
  ) => {
    setPanels((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((panel) =>
        panel.id === panelId ? { ...panel, [field]: value } : panel,
      ),
    }));
  };

  const handleRemovePanel = (key: LegalPageKey, panelId: string) => {
    setPanels((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((panel) => panel.id !== panelId),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-ipl-gold" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs: { key: LegalPageKey; label: string; description: string }[] = [
    {
      key: 'legal',
      label: 'Legal',
      description: 'Imprint / legal notice and ownership details for the SportsUp99 IPL 2026 experience platform.',
    },
    {
      key: 'privacy',
      label: 'Privacy Policy',
      description: 'Explain how SportsUp99 handles user data and analytics for the IPL 2026 experience.',
    },
    {
      key: 'terms',
      label: 'Terms of Service',
      description: 'Rules for using the SportsUp99 IPL 2026 demo platform.',
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-900">
      <main className="flex-grow">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <header className="mb-8">
            <p className="text-xs font-semibold tracking-[0.25em] text-ipl-gold/80 uppercase mb-2">
              Legal Pages
            </p>
            <h1 className="text-3xl font-bold text-white mb-2">Manage Legal Content</h1>
            <p className="text-sm text-gray-400 max-w-2xl">
              Edit the text shown on the public Legal, Privacy Policy, and Terms of Service pages.
              Changes are applied immediately after you save.
            </p>
          </header>

          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeTab === tab.key
                    ? 'bg-ipl-gold text-black border-ipl-gold'
                    : 'bg-slate-800/60 text-gray-200 border-white/10 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Editor card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/40">
            {tabs
              .filter((tab) => tab.key === activeTab)
              .map((tab) => (
                <div key={tab.key} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">{tab.label}</h2>
                    <p className="text-sm text-gray-400">{tab.description}</p>
                  </div>
                  <div className="space-y-4">
                    {panels[tab.key] && panels[tab.key].length > 0 ? (
                      panels[tab.key].map((panel, index) => (
                        <div
                          key={panel.id}
                          className="rounded-xl border border-white/15 bg-slate-950/60 p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em]">
                                Panel {index + 1}
                              </p>
                              <p className="text-xs text-gray-500">
                                This card will appear as a separate block on the public page.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePanel(tab.key, panel.id)}
                              className="text-xs px-2 py-1 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors"
                            >
                              Delete panel
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={panel.title}
                                onChange={(e) =>
                                  handleUpdatePanel(tab.key, panel.id, 'title', e.target.value)
                                }
                                className="w-full rounded-lg bg-slate-950/80 border border-white/10 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ipl-gold/70 focus:border-transparent"
                                placeholder="Panel title..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1">
                                Body
                              </label>
                              <textarea
                                rows={5}
                                value={panel.body}
                                onChange={(e) =>
                                  handleUpdatePanel(tab.key, panel.id, 'body', e.target.value)
                                }
                                className="w-full rounded-lg bg-slate-950/80 border border-white/10 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ipl-gold/70 focus:border-transparent resize-vertical"
                                placeholder="Write the content for this panel..."
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        No custom panels yet. Add one below to override the default public content for this page.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAddPanel(tab.key)}
                      className="inline-flex items-center px-3 py-2 rounded-lg border border-dashed border-ipl-gold/60 text-xs font-semibold text-ipl-gold hover:bg-ipl-gold/10 transition-colors"
                    >
                      + Add panel
                    </button>
                    <p className="mt-1 text-xs text-gray-500">
                      Panels are rendered in the order shown above. Each panel becomes one card on the end-user page.
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2 border-t border-white/10 mt-4">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleResetToDefault(tab.key)}
                        className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-gray-200 hover:bg-white/10 transition-colors"
                      >
                        Reset to default template
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearCustom(tab.key)}
                        className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors"
                      >
                        Clear custom content
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSave(tab.key)}
                      disabled={savingKey === tab.key}
                      className="inline-flex items-center px-4 py-2.5 rounded-xl bg-ipl-gold text-black text-sm font-semibold shadow-md shadow-yellow-900/40 hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {savingKey === tab.key ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
