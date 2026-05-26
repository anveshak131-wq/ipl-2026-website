'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLeague } from '@/contexts/LeagueContext';
import { motion } from 'framer-motion';
import { Calendar, Clock, Zap, CheckCircle2, Users, TrendingUp, CheckSquare, Square, BarChart3, Calendar as CalendarIcon, MapPin, Grid3x3, Copy, ExternalLink } from 'lucide-react';
import AuroraBackground from '@/components/ui/AuroraBackground';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import RCBLottie from '@/components/ui/RCBLottie';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import { PageTransition, StaggeredList, SkeletonLoader, LoadingSpinner } from '@/components/admin/animations';
import { EmptyStateIllustration, AnimatedStatusIcon, StatusBadge } from '@/components/admin/icons';
import { ToastContainer, useToast } from '@/components/admin/Toast';
import BulkOperationsToolbar from '@/components/admin/BulkOperationsToolbar';
import BulkEditModal from '@/components/admin/BulkEditModal';
import BatchDeleteModal from '@/components/admin/BatchDeleteModal';
import InteractiveChart, { ChartDataPoint } from '@/components/admin/InteractiveChart';
import { 
    generateMatchNumber,
    recalculateMatchNumbers,
    getMatchNumberDisplay
} from '@/lib/matchNumberUtils';
import { PlayoffType } from '@/types';
import { BulkEditValues } from '@/types/components';
import { getPlayoffMatchDetails, getPlayoffTypes } from '@/lib/playoffUtils';
import { getIplSeasonTeamIds } from '@/lib/iplPointsTable';
import { 
    exportToCSV, 
    exportToJSON, 
    exportToExcel, 
    exportToICal,
    exportToGoogleCalendar,
    exportToOutlookCalendar,
    generateICalFeedUrl,
    copyICalFeedUrl,
    CalendarEvent,
    prepareExportData, 
    formatDateForExport 
} from '@/lib/admin/exportUtils';
import { Match, Team } from '@/types';
import { api } from '@/lib/data';
import PointsSystemDisplay from '@/components/admin/matches/PointsSystemDisplay';
import ModernMatchCard from '@/components/admin/matches/ModernMatchCard';
import PlayoffOverview from '@/components/admin/matches/PlayoffOverview';
import { Search, Upload, Download, AlertTriangle, CheckCircle, X as XIcon, FileText } from 'lucide-react';

const IconTable = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const IconTimeline = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconFilter = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);

const IconPlus = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const IconEdit = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const IconTrash = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const IconX = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Official IPL Venues
const IPL_VENUES = [
    'Wankhede Stadium, Mumbai',
    'M. A. Chidambaram Stadium, Chennai',
    'M. Chinnaswamy Stadium, Bengaluru',
    'Eden Gardens, Kolkata',
    'Arun Jaitley Stadium, Delhi',
    'Sawai Mansingh Stadium, Jaipur',
    'Narendra Modi Stadium, Ahmedabad',
    'Rajiv Gandhi International Stadium, Hyderabad',
    'Punjab Cricket Association Stadium, Mohali',
    'Himachal Pradesh Cricket Association Stadium, Dharamsala',
    'Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium, Visakhapatnam',
    'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow',
    'Maharashtra Cricket Association Stadium, Pune',
    'Maharaja Yadavindra Singh International Cricket Stadium, Mullanpur',
    'Barsapara Cricket Stadium, Guwahati',
    'Holkar Cricket Stadium, Indore',
    'JSCA International Stadium Complex, Ranchi',
    'Green Park, Kanpur',
    'Barabati Stadium, Cuttack',
    'ACA Stadium, Barsapara'
];

// Official WPL Venues (2026 Season)
const WPL_VENUES = [
    'Dr. DY Patil Sports Academy, Navi Mumbai',
    'BCA Stadium, Kotambi (Vadodara)'
];

// Official WPL Match Times (2026 Season)
// Times are stored in IST (Indian Standard Time)
// Paris time reference:
// 11:00 AM Paris = 3:30 PM IST (15:30)
// 3:00 PM Paris = 7:30 PM IST (19:30)
const WPL_TIMES = [
    { paris: '11:00', ist: '15:30', display: '3:30 PM IST (11:00 AM Paris)' },
    { paris: '15:00', ist: '19:30', display: '7:30 PM IST (3:00 PM Paris)' }
];

export default function AdminMatches() {
    const router = useRouter();
    const { currentLeague } = useLeague();
    const { toasts, success: showSuccess, error: showError, closeToast } = useToast();
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'timeline' | 'analytics'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formStep, setFormStep] = useState(1);
    const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
    const [venueSearchQuery, setVenueSearchQuery] = useState('');
    const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    const [filters, setFilters] = useState({
        status: 'all',
        dateFrom: '',
        dateTo: '',
        team: 'all',
        venue: 'all'
    });

    const [formData, setFormData] = useState({
        date: '',
        time: '',
        venue: '',
        team1Id: '',
        team2Id: '',
        status: 'upcoming' as 'upcoming' | 'live' | 'completed' | 'cancelled',
        league: 'ipl' as 'ipl' | 'wpl', // Will be set from currentLeague when adding
        playoffType: null as PlayoffType,
        statusNote: '',
        reducedOversTo: '',
        dlsApplied: false
    });

    const [showPlayoffForm, setShowPlayoffForm] = useState(false);
    const [selectedPlayoffType, setSelectedPlayoffType] = useState<PlayoffType>(null);

    // CSV Upload state
    type CsvRow = {
        rowNum: number;
        date: string;
        time: string;
        team1Raw: string;
        team2Raw: string;
        venue: string;
        status: string;
        team1Id: string | null;
        team2Id: string | null;
        errors: string[];
        valid: boolean;
    };
    const [showCsvUpload, setShowCsvUpload] = useState(false);
    const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
    const [csvFileName, setCsvFileName] = useState('');
    const [csvImporting, setCsvImporting] = useState(false);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const csvInputRef = useRef<HTMLInputElement>(null);

    // Season selector — declared before the effects that reference them
    const [selectedSeason, setSelectedSeason] = useState<number>(new Date().getFullYear());
    const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);

    // Generate available seasons when league changes; restore last-used season from localStorage
    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const startYear = currentLeague === 'wpl' ? 2023 : 2008;
        const seasons: number[] = [];
        for (let y = startYear; y <= currentYear; y++) seasons.push(y);
        setAvailableSeasons(seasons);
        // Restore persisted season for this league, fall back to current year
        const stored = parseInt(localStorage.getItem(`adminMatchesSeason_${currentLeague}`) ?? '');
        setSelectedSeason((stored >= startYear && stored <= currentYear) ? stored : currentYear);
    }, [currentLeague]);

    // Persist selected season so page refresh remembers it
    useEffect(() => {
        localStorage.setItem(`adminMatchesSeason_${currentLeague}`, String(selectedSeason));
    }, [selectedSeason, currentLeague]);

    // Update formData.league and reset venue/time when league changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            league: currentLeague,
            venue: currentLeague === 'wpl' ? '' : prev.venue, // Reset venue when switching to WPL
            time: currentLeague === 'wpl' ? '' : prev.time // Reset time when switching to WPL
        }));
    }, [currentLeague]);

    // Fetch data on mount (auth handled by layout)
    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Clear selection when filters change
    useEffect(() => {
        setSelectedMatches(new Set());
    }, [filters]);

    // Use ref to store current matches to avoid dependency issues
    const matchesRef = useRef<Match[]>([]);
    useEffect(() => {
        matchesRef.current = matches;
    }, [matches]);

    // Automatic status update based on match time
    useEffect(() => {
        const updateMatchStatuses = async () => {
            const currentMatches = matchesRef.current;
            const now = new Date();
            const updates: { matchId: string; newStatus: 'upcoming' | 'live' }[] = [];

            currentMatches.forEach(match => {
                // Skip if match is already completed or cancelled (manual status)
                if (match.status === 'completed' || match.status === 'cancelled') {
                    return;
                }

                try {
                    const [hours, minutes] = match.time.split(':').map(Number);
                    const matchDate = new Date(match.date);
                    matchDate.setHours(hours, minutes || 0, 0, 0);
                    
                    // Calculate 30 minutes before match
                    const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
                    
                    // If current time is 30 minutes before match or later, and match hasn't started yet (within 4 hours)
                    const fourHoursAfter = new Date(matchDate.getTime() + 4 * 60 * 60 * 1000);
                    
                    if (now >= thirtyMinutesBefore && now <= fourHoursAfter) {
                        // Should be live
                        if (match.status !== 'live') {
                            updates.push({ matchId: match.id, newStatus: 'live' });
                        }
                    } else if (now < thirtyMinutesBefore) {
                        // Should be upcoming
                        if (match.status !== 'upcoming') {
                            updates.push({ matchId: match.id, newStatus: 'upcoming' });
                        }
                    }
                } catch (error) {
                    console.error(`Error processing match ${match.id}:`, error);
                }
            });

            // Apply updates
            if (updates.length > 0) {
                try {
                    const updatePromises = updates.map(({ matchId, newStatus }) => {
                        const match = currentMatches.find(m => m.id === matchId);
                        if (!match) return Promise.resolve();
                        
                        return api.updateMatch(matchId, {
                            date: match.date,
                            time: match.time,
                            venue: match.venue,
                            team1Id: match.team1.id,
                            team2Id: match.team2.id,
                            status: newStatus,
                            league: match.league
                        });
                    });

                    await Promise.all(updatePromises);
                    
                    // Refresh matches
                    const updatedMatches = await api.getMatches(currentLeague, { includeAll: true });
                    setMatches(updatedMatches);
                } catch (error) {
                    console.error('Failed to update match statuses:', error);
                }
            }
        };

        // Run immediately
        updateMatchStatuses();

        // Then run every minute
        const interval = setInterval(updateMatchStatuses, 60 * 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount, then check every minute

    // ─── CSV helpers ────────────────────────────────────────────────────────────

    /** Convert 12-hour time (e.g. "7:30PM", "3:30 PM") to 24-hour "HH:MM" */
    const to24h = (raw: string): string | null => {
        const m = raw.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!m) return null;
        let h = parseInt(m[1], 10);
        const min = m[2];
        const period = m[3].toUpperCase();
        if (period === 'AM' && h === 12) h = 0;
        if (period === 'PM' && h !== 12) h += 12;
        return `${String(h).padStart(2, '0')}:${min}`;
    };

    const monthMap: Record<string, string> = {
        jan: '01', january: '01',
        feb: '02', february: '02',
        mar: '03', march: '03',
        apr: '04', april: '04',
        may: '05',
        jun: '06', june: '06',
        jul: '07', july: '07',
        aug: '08', august: '08',
        sep: '09', sept: '09', september: '09',
        oct: '10', october: '10',
        nov: '11', november: '11',
        dec: '12', december: '12',
    };

    const normalizeImportedDate = (raw: string): string => {
        const value = raw.trim().replace(/\s+/g, ' ');
        if (!value) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

        // IPL fixture-table PDFs often use "28-MAR-26" / "28-MAR-2026"
        const dashMonth = value.match(/^(\d{1,2})-([A-Za-z]{3,9})-(\d{2,4})$/);
        if (dashMonth) {
            const [, dd, monthRaw, yearRaw] = dashMonth;
            const mm = monthMap[monthRaw.toLowerCase()];
            if (mm) {
                const yyyy = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
                return `${yyyy}-${mm}-${dd.padStart(2, '0')}`;
            }
        }

        const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (slash) {
            const [, dd, mm, yyyy] = slash;
            return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }

        const shortSlash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
        if (shortSlash) {
            const [, dd, mm, yy] = shortSlash;
            return `20${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }

        const textual = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
        if (textual) {
            const [, dd, monthRaw, yyyy] = textual;
            const mm = monthMap[monthRaw.toLowerCase()];
            if (mm) return `${yyyy}-${mm}-${dd.padStart(2, '0')}`;
        }

        const textualNoYear = value.match(/^(\d{1,2})\s+([A-Za-z]+)$/);
        if (textualNoYear) {
            const [, dd, monthRaw] = textualNoYear;
            const mm = monthMap[monthRaw.toLowerCase()];
            if (mm) return `${selectedSeason}-${mm}-${dd.padStart(2, '0')}`;
        }

        const textualMonthFirst = value.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/);
        if (textualMonthFirst) {
            const [, monthRaw, dd, yyyy] = textualMonthFirst;
            const mm = monthMap[monthRaw.toLowerCase()];
            if (mm) return `${yyyy}-${mm}-${dd.padStart(2, '0')}`;
        }

        const textualMonthFirstNoYear = value.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
        if (textualMonthFirstNoYear) {
            const [, monthRaw, dd] = textualMonthFirstNoYear;
            const mm = monthMap[monthRaw.toLowerCase()];
            if (mm) return `${selectedSeason}-${mm}-${dd.padStart(2, '0')}`;
        }

        return value;
    };

    const loadPdfJs = async (): Promise<any> => {
        if (typeof window === 'undefined') return null;
        const existing = (window as any).pdfjsLib;
        if (existing) return existing;

        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load PDF parser'));
            document.head.appendChild(script);
        });

        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error('PDF parser unavailable');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        return pdfjsLib;
    };

    const extractPdfFixtureCsv = async (file: File): Promise<string> => {
        const pdfjsLib = await loadPdfJs();
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let rows: string[] = [];
        const fallbackLines: string[] = [];
        const rawLines: string[] = [];
        const rawItems: Array<{ x: number; y: number; text: string }> = [];
        const defaultColumnStops = [93.2, 211.7, 270.4, 340.1];
        const getColumnIndex = (x: number, stops: number[]) => {
            for (let i = 0; i < stops.length; i += 1) {
                if (x < stops[i]) return i;
            }
            return stops.length;
        };
        const timePattern = /\d{1,2}(?::\d{2})?\s*(?:AM|PM)$/i;
        let dynamicStops: number[] | null = null;
        let dynamicColumns = 5;

        for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
            const page = await pdf.getPage(pageNo);
            const content = await page.getTextContent();
            const items = (content.items || []) as Array<{ str?: string; transform?: number[] }>;
            const groups = new Map<string, Array<{ x: number; text: string }>>();

            items.forEach((item) => {
                const text = String(item.str || '').trim();
                if (!text) return;
                const x = item.transform?.[4] ?? 0;
                const y = item.transform?.[5] ?? 0;
                const key = (Math.round(y / 3) * 3).toString();
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push({ x, text });
                rawItems.push({ x, y, text });
            });

            const headerRow = Array.from(groups.values())
                .map((group) => group
                    .slice()
                    .sort((a, b) => a.x - b.x))
                .find((group) => {
                    const joined = group.map(item => item.text).join(' ').toLowerCase();
                    return joined.includes('match') &&
                        joined.includes('date') &&
                        joined.includes('day') &&
                        (joined.includes('time') || joined.includes('start')) &&
                        joined.includes('home') &&
                        joined.includes('away') &&
                        joined.includes('venue');
                });

            if (headerRow) {
                const anchors: Array<{ label: string; x: number }> = [];
                const pushAnchor = (label: string, x: number | null) => {
                    if (x !== null && Number.isFinite(x)) anchors.push({ label, x });
                };
                const sortedHeader = headerRow.slice().sort((a, b) => a.x - b.x);
                let matchX: number | null = null;
                let dateX: number | null = null;
                let dayX: number | null = null;
                let timeX: number | null = null;
                let homeX: number | null = null;
                let awayX: number | null = null;
                let venueX: number | null = null;

                sortedHeader.forEach((item) => {
                    const lower = item.text.toLowerCase();
                    if (lower === 'match' || lower === 'no' || lower === 'no.' || lower === 'match no' || lower === 'match no.') {
                        matchX = matchX === null ? item.x : Math.min(matchX, item.x);
                        return;
                    }
                    if (lower === 'date') { dateX ??= item.x; return; }
                    if (lower === 'day') { dayX ??= item.x; return; }
                    if (lower === 'time' || lower === 'start') { timeX ??= item.x; return; }
                    if (lower === 'home') { homeX ??= item.x; return; }
                    if (lower === 'away') { awayX ??= item.x; return; }
                    if (lower === 'venue') { venueX ??= item.x; }
                });

                pushAnchor('match', matchX);
                pushAnchor('date', dateX);
                pushAnchor('day', dayX);
                pushAnchor('time', timeX);
                pushAnchor('home', homeX);
                pushAnchor('away', awayX);
                pushAnchor('venue', venueX);

                const sortedAnchors = anchors.sort((a, b) => a.x - b.x);
                if (sortedAnchors.length >= 5) {
                    dynamicColumns = sortedAnchors.length;
                    dynamicStops = sortedAnchors.slice(1).map((anchor, index) => {
                        const prev = sortedAnchors[index].x;
                        return (prev + anchor.x) / 2;
                    });
                }
            }

            const stops = dynamicStops ?? defaultColumnStops;
            const columnCount = dynamicStops ? dynamicColumns : 5;

            const pageRows = Array.from(groups.entries())
                .sort((a, b) => Number(b[0]) - Number(a[0]))
                .map(([, group]) => {
                    const columns = Array.from({ length: columnCount }, () => '');
                    group
                        .sort((a, b) => a.x - b.x)
                        .forEach((entry) => {
                            const idx = getColumnIndex(entry.x, stops);
                            columns[idx] = `${columns[idx]} ${entry.text}`.trim();
                        });
                    return columns.map(col => col.replace(/\s+/g, ' ').trim());
                })
                .filter((cols) => cols.some(Boolean));

            rawLines.push(
                ...Array.from(groups.entries())
                    .sort((a, b) => Number(b[0]) - Number(a[0]))
                    .map(([, group]) => group
                        .sort((a, b) => a.x - b.x)
                        .map((entry) => entry.text)
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim())
                    .filter(Boolean)
            );

            fallbackLines.push(
                ...pageRows.map(cols => cols.join(' ').replace(/\s+/g, ' ').trim()).filter(Boolean)
            );

            pageRows.forEach((cols) => {
                const joined = cols.join(' ').trim();
                if (!joined) return;
                if (/^sheet\d*$/i.test(cols[0]) || /^page\s+\d+/i.test(joined) || /ipl 20\d{2} schedule/i.test(joined)) return;
                if (/^match\b/i.test(joined) && /stadium|venue/i.test(joined)) return;
                if (!cols[0] || !/\d+|qualifier|eliminator|final/i.test(cols[0])) return;

                if (cols.length >= 7) {
                    const match = cols[0].replace(/\s+/g, ' ').trim();
                    const dateCell = normalizeImportedDate(cols[1].replace(/\s+/g, ' ').replace(/,\s*/g, ' ').trim());
                    const timeCell = cols[3].replace(/\s+/g, ' ').trim().toUpperCase();
                    const home = cols[4].replace(/\s+/g, ' ').trim();
                    const away = cols[5].replace(/\s+/g, ' ').trim();
                    const venueCell = cols[6].replace(/\s+/g, ' ').replace(/,\s*/g, ' ').trim();
                    const teamCell = `${home} vs ${away}`.trim();

                    rows.push([match, teamCell, timeCell, dateCell, venueCell].join(','));
                    return;
                }

                const match = cols[0].replace(/\s+/g, ' ').trim();
                const teamCell = cols[1].replace(/\s+/g, ' ').trim();
                const timeCell = cols[2].replace(/\s+/g, ' ').trim().toUpperCase();
                const dateCell = normalizeImportedDate(cols[3].replace(/\s+/g, ' ').replace(/,\s*/g, ' ').trim());
                const venueCell = cols[4].replace(/\s+/g, ' ').replace(/,\s*/g, ' ').trim();

                rows.push([match, teamCell, timeCell, dateCell, venueCell].join(','));
            });
        }

        const columnarRows = (() => {
            if (!rawItems.length) return [];

            const cleanedItems = rawItems.filter((item) => {
                const text = item.text.replace(/\s+/g, ' ').trim();
                if (!text) return false;
                if (/^match$/i.test(text) || /^no$/i.test(text) || /^date$/i.test(text) || /^day$/i.test(text)) return false;
                if (/^time$/i.test(text) || /^home$/i.test(text) || /^away$/i.test(text) || /^venue$/i.test(text)) return false;
                if (/^ipl 20\d{2} schedule$/i.test(text)) return false;
                if (/^iplt20\.com$/i.test(text)) return false;
                if (/^please note that this schedule/i.test(text)) return false;
                if (/^title sponsor|premier partners|official|strategic|timeout|umpire partner/i.test(text)) return false;
                return true;
            });

            if (!cleanedItems.length) return [];

            const sortedByX = cleanedItems.slice().sort((a, b) => a.x - b.x);
            const clusters: Array<{ x: number; items: Array<{ x: number; y: number; text: string }> }> = [];
            const xThreshold = 14;

            sortedByX.forEach((item) => {
                const last = clusters[clusters.length - 1];
                if (!last || Math.abs(item.x - last.x) > xThreshold) {
                    clusters.push({ x: item.x, items: [item] });
                } else {
                    last.items.push(item);
                    last.x = (last.x + item.x) / 2;
                }
            });

            const columns = clusters
                .map((cluster) => {
                    const itemsByY = cluster.items.slice().sort((a, b) => b.y - a.y);
                    const lines: string[] = [];
                    let buffer = '';
                    let lastY: number | null = null;
                    itemsByY.forEach((item) => {
                        if (lastY !== null && Math.abs(item.y - lastY) > 2.5) {
                            if (buffer) lines.push(buffer.trim());
                            buffer = item.text;
                        } else {
                            buffer = buffer ? `${buffer} ${item.text}` : item.text;
                        }
                        lastY = item.y;
                    });
                    if (buffer) lines.push(buffer.trim());
                    return {
                        x: cluster.x,
                        lines: lines.map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean),
                    };
                })
                .filter(col => col.lines.length >= 5);

            if (!columns.length) return [];

            const dayPattern = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/i;
            const datePattern = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
            const matchPattern = /^\d{1,2}$/;
            const teamTokens = [
                'indians', 'kings', 'royals', 'super kings', 'super giants',
                'titans', 'sunrisers', 'capitals', 'knight riders', 'challengers',
            ];

            const scoreColumn = (col: { lines: string[] }, predicate: (line: string) => boolean) =>
                col.lines.reduce((acc, line) => acc + (predicate(line) ? 1 : 0), 0);

            const pickBest = (predicate: (line: string) => boolean) => {
                let bestIndex = -1;
                let bestScore = 0;
                columns.forEach((col, index) => {
                    const score = scoreColumn(col, predicate);
                    if (score > bestScore) {
                        bestScore = score;
                        bestIndex = index;
                    }
                });
                if (bestScore === 0) return -1;
                const minAccept = Math.max(3, Math.ceil(columns[0]?.lines.length ? columns[0].lines.length * 0.25 : 5));
                return bestScore >= minAccept ? bestIndex : -1;
            };

            const dateIndex = pickBest((line) => datePattern.test(line));
            const timeIndex = pickBest((line) => timePattern.test(line));
            const dayIndex = pickBest((line) => dayPattern.test(line));
            const matchIndex = pickBest((line) => matchPattern.test(line));

            const remaining = columns.map((col, index) => ({ col, index }))
                .filter(({ index }) => ![dateIndex, timeIndex, dayIndex, matchIndex].includes(index));

            const teamScores = remaining.map(({ col, index }) => ({
                index,
                score: scoreColumn(col, (line) =>
                    teamTokens.some(token => line.toLowerCase().includes(token))
                ),
                x: col.x,
                lines: col.lines,
            })).sort((a, b) => b.score - a.score);

            if (teamScores.length < 2 || teamScores[0].score < 8 || teamScores[1].score < 8) {
                return [];
            }

            const [teamA, teamB] = teamScores.slice(0, 2).sort((a, b) => a.x - b.x);
            const venueCandidate = remaining
                .filter(({ index }) => index !== teamA.index && index !== teamB.index)
                .map(({ col, index }) => ({ index, lines: col.lines }))
                .sort((a, b) => b.lines.length - a.lines.length)[0];

            if (!venueCandidate || dateIndex === -1 || timeIndex === -1) return [];

            const dateLines = columns[dateIndex].lines;
            const timeLines = columns[timeIndex].lines;
            const matchLines = matchIndex === -1 ? [] : columns[matchIndex].lines;
            const homeLines = teamA.lines;
            const awayLines = teamB.lines;
            const venueLines = venueCandidate.lines;

            const rowCount = Math.min(
                dateLines.length,
                timeLines.length,
                homeLines.length,
                awayLines.length,
                venueLines.length,
                matchLines.length ? matchLines.length : Number.MAX_SAFE_INTEGER
            );

            if (rowCount < 10) return [];

            const parsed: string[] = [];
            for (let i = 0; i < rowCount; i += 1) {
                const match = matchLines[i] ?? `${i + 1}`;
                const dateCell = normalizeImportedDate(dateLines[i]);
                const timeRaw = timeLines[i].toUpperCase().replace(/\s+/g, '');
                const timeCell = to24h(timeRaw) ?? timeRaw;
                const teamCell = `${homeLines[i]} vs ${awayLines[i]}`.replace(/\s+/g, ' ').trim();
                const venueCell = venueLines[i].replace(/,\s*/g, ' ').trim();
                parsed.push([match, teamCell, timeCell, dateCell, venueCell].join(','));
            }

            return parsed;
        })();

        const legacyRows = (() => {
            const cleaned = rawLines
                .map((line) => line.replace(/\s+/g, ' ').trim())
                .filter((line) =>
                    line &&
                    !/^sheet\d*$/i.test(line) &&
                    !/^page\s+\d+/i.test(line) &&
                    !/ipl 20\d{2} schedule/i.test(line) &&
                    !/^date\b/i.test(line) &&
                    !/^venue\b/i.test(line) &&
                    !/^match\b/i.test(line) &&
                    !/^time\b/i.test(line)
                );

            const logicalLines: string[] = [];
            let buffer = '';

            cleaned.forEach((line) => {
                if (!buffer) {
                    buffer = line;
                } else if (/^\d{1,2}$/.test(buffer) && /^[A-Za-z]+\b/.test(line)) {
                    buffer = `${buffer} ${line}`;
                } else if (/^\d{1,2}\s+[A-Za-z]+$/i.test(buffer) && /^\d{4}\b/.test(line)) {
                    buffer = `${buffer} ${line}`;
                } else if (/^[A-Za-z]+$/i.test(buffer) && /^\d{1,2}\s+[A-Za-z]+\b/i.test(line)) {
                    buffer = line;
                } else if (!timePattern.test(buffer)) {
                    buffer = `${buffer} ${line}`.replace(/\s+/g, ' ').trim();
                } else {
                    logicalLines.push(buffer);
                    buffer = line;
                }

                if (timePattern.test(buffer)) {
                    logicalLines.push(buffer);
                    buffer = '';
                }
            });

            if (buffer && timePattern.test(buffer)) {
                logicalLines.push(buffer);
            }

            return logicalLines.flatMap((line, index) => {
                const match = line.match(/^(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)\s+(.+?)\s+(.+?\bvs\b.+?)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM))$/i);
                if (!match) return [];

                const [, rawDate, venue, teamsCell, rawTime] = match;
                return [`${index + 1},${teamsCell},${rawTime.toUpperCase().replace(/\s+/g, '')},${normalizeImportedDate(rawDate)},${venue}`];
            });
        })();

        const textFlowRows = (() => {
            const cleaned = rawLines
                .map((line) => line.replace(/\s+/g, ' ').trim())
                .filter((line) =>
                    line &&
                    !/^pdfmyurl\.com$/i.test(line) &&
                    !/^\* accuracy of content/i.test(line) &&
                    !/^copyright by /i.test(line) &&
                    !/^ipl 20\d{2} schedule$/i.test(line) &&
                    !/^date and time$/i.test(line) &&
                    !/^match details and series$/i.test(line)
                );

            const parsedRows: string[] = [];
            const dayPattern = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i;

            for (let i = 0; i < cleaned.length; i += 1) {
                if (!dayPattern.test(cleaned[i])) continue;

                let rawDate = cleaned[i].replace(dayPattern, '').trim();
                if (/^[A-Za-z]+$/i.test(rawDate) && /^\d{1,2}$/.test(cleaned[i + 1] ?? '')) {
                    rawDate = `${rawDate} ${cleaned[i + 1]}`;
                    i += 1;
                }

                const timeLine = cleaned[i + 1] ?? '';
                const matchLine = cleaned[i + 2] ?? '';
                const teamsLine = cleaned[i + 3] ?? '';
                if (!/\d{1,2}:\d{2}\s*local/i.test(timeLine) || !/ipl\s*-/i.test(matchLine) || !/\bvs\b/i.test(teamsLine)) {
                    continue;
                }

                const rawTime = timeLine.match(/(\d{1,2}:\d{2})\s*local/i)?.[1] ?? '';
                const matchLabel = matchLine.replace(/\s+/g, ' ').trim().replace(/\s*IPL\s*-\s*$/i, '');
                let venueIndex = i + 4;
                while (/^\(.*\)$/.test(cleaned[venueIndex] ?? '')) {
                    venueIndex += 1;
                }

                const venueLine = cleaned[venueIndex] ?? '';
                if (!venueLine) continue;

                parsedRows.push([
                    matchLabel || `${parsedRows.length + 1}`,
                    teamsLine,
                    rawTime,
                    normalizeImportedDate(`${rawDate} ${selectedSeason}`),
                    venueLine,
                ].join(','));

                i = venueIndex;
            }

            return parsedRows;
        })();

        if (columnarRows.length >= 10) {
            rows = columnarRows;
        } else {
            const bestParsedRows = [rows, legacyRows, textFlowRows]
                .sort((a, b) => b.length - a.length)[0];
            if (bestParsedRows.length >= 10) {
                rows = bestParsedRows;
            }
        }

        if (!rows.length) {
            const fallbackRows = fallbackLines.flatMap((line, index) => {
                const compact = line.replace(/\s+/g, ' ').trim();
                if (!compact || /^sheet\d*$/i.test(compact) || /^page\s+\d+/i.test(compact) || /ipl 20\d{2} schedule/i.test(compact)) {
                    return [];
                }

                const match = compact.match(/^(\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)\s+(.+?)\s+(.+?\bvs\b.+?)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM))$/i);
                if (!match) return [];

                const [, rawDate, venue, teamsCell, rawTime] = match;
                return [`${index + 1},${teamsCell},${rawTime.toUpperCase().replace(/\s+/g, '')},${normalizeImportedDate(rawDate)},${venue}`];
            });

            rows.push(...fallbackRows);
        }

        const header = 'Match,Team,Time (IST),Date,Stadium/City';
        return [header, ...rows].join('\n');
    };

    const downloadCsvTemplate = () => {
        const header = 'Match No,Match Day,Date,Day,Start,Home,Away,Venue';
        const rows = [
            `1,1,${selectedSeason}-03-22,Sat,7:30PM,Mumbai Indians,Chennai Super Kings,Mumbai`,
            `2,2,${selectedSeason}-03-23,Sun,3:30PM,Royal Challengers Bengaluru,Kolkata Knight Riders,Bengaluru`,
            `3,2,${selectedSeason}-03-23,Sun,7:30PM,Sunrisers Hyderabad,Delhi Capitals,Hyderabad`,
        ];
        const blob = new Blob([`${header}\n${rows.join('\n')}\n`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentLeague.toUpperCase()}_${selectedSeason}_schedule_template.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const parseCsv = (text: string): CsvRow[] => {
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (!lines.length) return [];

        // Quoted-aware column splitter
        const splitLine = (line: string): string[] => {
            const cols: string[] = [];
            let cur = '';
            let inQ = false;
            for (const ch of line) {
                if (ch === '"') { inQ = !inQ; }
                else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
                else { cur += ch; }
            }
            cols.push(cur.trim());
            return cols;
        };

        const firstCols = splitLine(lines[0]).map(c => c.toLowerCase());
        const hasHeader = firstCols.some(c => ['date','match no','start','home','away'].includes(c));
        const dataLines = hasHeader ? lines.slice(1) : lines;

        // Detect IPL-style format: Match No, Match Day, Date, Day, Start, Home, Away, Venue (8 cols)
        // OR cricinfo/2024 style: Match Number, Round Number, Date, Location, Home Team, Away Team, Result (7 cols)
        // vs simple format: date, time, team1, team2, venue, status (6 cols)
        const isCricinfo2024Format = hasHeader &&
            (firstCols.includes('match number') || firstCols.includes('round number') ||
             (firstCols.includes('location') && firstCols.includes('home team')));
        const isPdfFixtureFormat = hasHeader &&
            firstCols.includes('team') &&
            (firstCols.includes('time (ist)') || firstCols.includes('time')) &&
            firstCols.includes('date') &&
            (firstCols.includes('stadium/city') || firstCols.includes('stadium') || firstCols.includes('city'));
        const isIplFormat = isCricinfo2024Format ? false : (hasHeader
            ? firstCols.includes('match no') || firstCols.includes('start')
            : splitLine(dataLines[0] ?? '').length >= 7);

        // Normalise common city-name variants so CSV spellings match DB spellings
        const normaliseName = (s: string) =>
            s.toLowerCase()
             .replace(/bengaluru/g, 'bangalore')   // RCB
             .replace(/bombay/g, 'mumbai')
             .replace(/madras/g, 'chennai')
             .replace(/calcutta/g, 'kolkata')
             .replace(/chennai\s+supers\s+kings/g, 'chennai super kings')
             .replace(/delhi daredevils/g, 'delhi capitals')
             .replace(/kings xi punjab/g, 'punjab kings')
             .replace(/kings eleven punjab/g, 'punjab kings')
             .replace(/\s+/g, ' ')
             .trim();

        const findTeam = (raw: string) => {
            // Historical franchise renames — map old names to current names
            const HISTORICAL_ALIASES: Record<string, string> = {
                'kings xi punjab':     'Punjab Kings',
                'kings eleven punjab': 'Punjab Kings',
                'delhi daredevils':    'Delhi Capitals',
            };
            const resolved = HISTORICAL_ALIASES[raw.trim().toLowerCase()] ?? raw;
            const norm = normaliseName(resolved);
            if (!norm || norm === 'tbd') return null;
            return teams.find(t => {
                const tName = normaliseName(t.name ?? '');
                const tShort = (t.shortName ?? '').toLowerCase();
                const tAliases = ((t.aliases ?? []) as string[]).map(alias => normaliseName(alias));
                return tShort === norm ||
                    tName === norm ||
                    tAliases.includes(norm) ||
                    tName.includes(norm) ||
                    norm.includes(tName) ||
                    norm.includes(tShort) ||
                    tAliases.some(alias => alias.includes(norm) || norm.includes(alias));
            }) ?? null;
        };

        const splitFixtureTeams = (raw: string): [string, string] => {
            const value = raw.trim();
            const parts = value.split(/\s+(?:vs|v)\s+/i);
            if (parts.length >= 2) {
                return [parts[0]?.trim() ?? '', parts.slice(1).join(' vs ').trim()];
            }
            return ['', ''];
        };

        return dataLines
            .map((line, i): CsvRow | null => {
                const cols = splitLine(line);

                let rawDate = '', rawTime = '', rawTeam1 = '', rawTeam2 = '', rawVenue = '', rawStatus = '';

                if (isCricinfo2024Format) {
                    // Match Number(0), Round Number(1), Date+Time(2), Location(3), Home Team(4), Away Team(5), Result(6)
                    // Date format: DD/MM/YYYY HH:MM  →  YYYY-MM-DD + HH:MM
                    const rawDT = cols[2]?.trim() ?? '';
                    const dtMatch = rawDT.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2})/);
                    if (dtMatch) {
                        const [, dd, mm, yyyy, hhmm] = dtMatch;
                        rawDate = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
                        rawTime = hhmm;
                    } else {
                        rawDate = rawDT;
                        rawTime = '';
                    }
                    rawVenue  = cols[3]?.trim() ?? '';
                    rawTeam1  = cols[4]?.trim() ?? '';
                    rawTeam2  = cols[5]?.trim() ?? '';
                    rawStatus = '';
                } else if (isPdfFixtureFormat) {
                    // Match(0), Team(1), Time(IST)(2), Date(3), Stadium/City(4)
                    rawDate = normalizeImportedDate(cols[3]?.trim() ?? '');
                    rawTime = cols[2]?.trim() ?? '';
                    rawVenue = cols[4]?.trim() ?? '';
                    [rawTeam1, rawTeam2] = splitFixtureTeams(cols[1] ?? '');
                    rawStatus = '';
                    const converted = to24h(rawTime);
                    rawTime = converted ?? rawTime;
                } else if (isIplFormat) {
                    // Match No(0), Match Day(1), Date(2), Day(3), Start(4), Home(5), Away(6), Venue(7)
                    rawDate   = cols[2]?.trim() ?? '';
                    const rawStart = cols[4]?.trim() ?? '';
                    rawTeam1  = cols[5]?.trim() ?? '';
                    rawTeam2  = cols[6]?.trim() ?? '';
                    rawVenue  = cols[7]?.trim() ?? '';
                    rawStatus = '';
                    // Convert 12h → 24h
                    const converted = to24h(rawStart);
                    rawTime = converted ?? rawStart;
                } else {
                    // Simple 6-col format
                    [rawDate='', rawTime='', rawTeam1='', rawTeam2='', rawVenue='', rawStatus=''] = cols;
                }

                if (!rawDate && !rawTime && !rawTeam1 && !rawTeam2 && !rawVenue && !rawStatus) {
                    return null;
                }

                // Skip rows where both teams are TBD (playoff placeholders)
                const isTbd = rawTeam1.toUpperCase() === 'TBD' && rawTeam2.toUpperCase() === 'TBD';
                if (isTbd) return null; // silently skip

                const errs: string[] = [];

                // Date
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!rawDate) errs.push('Date missing');
                else if (!dateRegex.test(rawDate)) errs.push(`Date must be YYYY-MM-DD (got: ${rawDate})`);

                // Time
                const timeRegex = /^\d{1,2}:\d{2}$/;
                if (!rawTime) errs.push('Time missing');
                else if (!timeRegex.test(rawTime)) errs.push(`Time must be HH:MM or 7:30PM (got: ${rawTime})`);

                // Teams
                const t1 = findTeam(rawTeam1);
                const t2 = findTeam(rawTeam2);
                if (!rawTeam1) errs.push('Home team missing');
                else if (!t1) errs.push(`Home team not found: "${rawTeam1}"`);
                if (!rawTeam2) errs.push('Away team missing');
                else if (!t2) errs.push(`Away team not found: "${rawTeam2}"`);
                if (t1 && t2 && t1.id === t2.id) errs.push('Home and Away are the same team');
                if (!rawVenue) errs.push('Venue missing');

                const validStatuses = ['upcoming','live','completed','cancelled'];
                const status = rawStatus.toLowerCase().trim() || 'upcoming';
                if (rawStatus && !validStatuses.includes(status)) errs.push(`Invalid status: "${rawStatus}"`);

                return {
                    rowNum: i + (hasHeader ? 2 : 1),
                    date: rawDate,
                    time: rawTime,
                    team1Raw: rawTeam1,
                    team2Raw: rawTeam2,
                    venue: rawVenue,
                    status,
                    team1Id: t1?.id ?? null,
                    team2Id: t2?.id ?? null,
                    errors: errs,
                    valid: errs.length === 0,
                };
            })
            .filter((r): r is CsvRow => r !== null);
    };

    const handleCsvFile = async (file: File) => {
        setCsvFileName(file.name);
        try {
            if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
                const csvText = await extractPdfFixtureCsv(file);
                setCsvRows(parseCsv(csvText));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setCsvRows(parseCsv(text));
            };
            reader.readAsText(file);
        } catch (err: any) {
            showError(err?.message || 'Failed to parse uploaded file');
            setCsvRows([]);
            setCsvFileName('');
        }
    };

    const handleCsvImport = async () => {
        const valid = csvRows.filter(r => r.valid);
        if (!valid.length) return;
        setCsvImporting(true);
        try {
            // Send all valid rows in ONE request → single atomic KV write (no race condition)
            const payload = valid.map(row => ({
                date: row.date,
                time: row.time,
                venue: row.venue,
                team1Id: row.team1Id!,
                team2Id: row.team2Id!,
                status: row.status as 'upcoming' | 'live' | 'completed' | 'cancelled',
                league: currentLeague,
                playoffType: null as null,
            }));
            const result = await api.bulkCreateMatches(payload);
            const newMatches = result.created as Match[];
            const allMatches = recalculateMatchNumbers([...matches, ...newMatches]);
            setMatches(allMatches);
            const skipped = csvRows.length - valid.length;
            showSuccess(
                `Imported ${result.count} match${result.count !== 1 ? 'es' : ''}` +
                (skipped ? ` · ${skipped} row${skipped !== 1 ? 's' : ''} skipped (validation errors)` : '') +
                ` — season ${selectedSeason}`
            );
            setShowCsvUpload(false);
            setCsvRows([]);
            setCsvFileName('');
            if (valid.length > 0) {
                const year = parseInt(valid[0].date.split('-')[0]);
                if (!isNaN(year)) setSelectedSeason(year);
            }
        } catch (err: any) {
            showError(err?.message || 'Import failed unexpectedly');
        } finally {
            setCsvImporting(false);
        }
    };
    // ────────────────────────────────────────────────────────────────────────────

    // ─── PDF Export ─────────────────────────────────────────────────────────────
    const handleDownloadPdf = async () => {
        if (!seasonMatches.length) { showError('No matches to export for this season'); return; }
        setPdfGenerating(true);
        try {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable'),
            ]);

            const isWpl = currentLeague === 'wpl';
            const league = currentLeague.toUpperCase();

            // ── Colour palette  (Midnight Navy — dark bg, bright IPL gold/red accents)
            const BG: [number,number,number]       = [7,   9,  20];   // near-black navy
            const BGHDR: [number,number,number]    = [11,  15, 35];   // deep indigo header band
            const BGROW1: [number,number,number]   = [15,  20, 42];   // lighter navy row
            const BGROW2: [number,number,number]   = [9,   13, 28];   // darker navy row
            const BGHDRROW: [number,number,number] = [18,  24, 52];   // column header row
            const ACC: [number,number,number]      = isWpl ? [167,80,250] : [252,191,20];   // vivid gold / violet
            const ACC2: [number,number,number]     = isWpl ? [244,90,172] : [240,60,60];    // red / pink
            const WHITE: [number,number,number]    = [238,244,255];   // soft blue-white
            const GRAY4: [number,number,number]    = [148,162,210];   // blue-tinted muted
            const GRAY6: [number,number,number]    = [72,  85,130];   // dimmer muted
            const DONE: [number,number,number]     = [52, 220,150];   // bright emerald
            const UP: [number,number,number]       = [100,170,255];   // bright sky blue
            const LIVE_C: [number,number,number]   = [255, 75, 75];   // vivid red live
            const CANC: [number,number,number]     = [90, 100,130];   // grey cancelled

            // ── Team brand colours (brightened for dark-bg legibility)
            const TEAM_CLR: Record<string,[number,number,number]> = {
                'MI':   [80,140,220], 'CSK':  [252,210,50],  'RCB':  [240,90,90],
                'KKR':  [180,130,255],'SRH':  [255,145,60],  'RR':   [240,110,200],
                'GT':   [80,195,215], 'PBKS': [230,90,90],   'DC':   [80,175,255],
                'LSG':  [175,240,90], 'MI-W': [80,140,220],  'RCB-W':[240,90,90],
                'DC-W': [80,175,255], 'GG':   [255,185,60],  'UPW':  [80,215,155],
            };
            const teamClr = (sn: string): [number,number,number] => TEAM_CLR[sn] ?? [200,200,220];
            const statusClr = (s: string): [number,number,number] =>
                s === 'completed' ? DONE : s === 'live' ? LIVE_C : s === 'cancelled' ? CANC : UP;

            // ── Fake horizontal gradient (N thin rects)
            const gradRect = (d: any, x: number, y: number, w: number, h: number,
                              c1: [number,number,number], c2: [number,number,number], n = 28) => {
                const sh = h / n;
                for (let i = 0; i < n; i++) {
                    const t = i / (n - 1);
                    d.setFillColor(
                        Math.round(c1[0] + (c2[0]-c1[0])*t),
                        Math.round(c1[1] + (c2[1]-c1[1])*t),
                        Math.round(c1[2] + (c2[2]-c1[2])*t),
                    );
                    d.rect(x, y + i*sh, w, sh + 0.3, 'F');
                }
            };

            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const W = doc.internal.pageSize.getWidth();   // 297
            const H = doc.internal.pageSize.getHeight();  // 210
            const HDR_H = 33;
            const FTR_H = 11;

            const totalM = seasonMatches.length;
            const doneM  = seasonMatches.filter(m => m.status === 'completed').length;
            const upM    = seasonMatches.filter(m => m.status === 'upcoming').length;
            const liveM  = seasonMatches.filter(m => m.status === 'live').length;

            // ── Chrome: draws header + footer on the current page.
            // NOTE: does NOT repaint the full-page bg — willDrawPage already
            // did that before cells were drawn; redrawing here would wipe the table.
            const drawChrome = (pageNum: number, totalPages: number) => {
                // Re-paint header band opaquely (covers any table bleed-in)
                doc.setFillColor(...BGHDR);
                doc.rect(0, 0, W, HDR_H, 'F');

                // Gradient accent bar (top 5mm)
                gradRect(doc, 0, 0, W, 5, ACC, ACC2);

                // Left vertical accent stripe
                doc.setFillColor(...ACC);
                doc.rect(0, 0, 4, HDR_H, 'F');

                // Decorative diagonal slash lines (right header flair)
                doc.setDrawColor(ACC[0], ACC[1], ACC[2]);
                doc.setLineWidth(0.18);
                for (let i = 0; i < 7; i++) {
                    const sx = W - 65 + i * 10;
                    doc.line(sx, 0, sx + HDR_H * 0.8, HDR_H);
                }

                // League name in accent colour
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(24);
                doc.setTextColor(...ACC);
                doc.text(league, 11, 18);
                const lgW = doc.getTextWidth(league);

                // Year in white
                doc.setFontSize(24);
                doc.setTextColor(...WHITE);
                doc.text(String(selectedSeason), 11 + lgW + 3, 18);

                // Subtitle
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...GRAY4);
                doc.text('SEASON SCHEDULE', 11, 24);
                doc.text(`${doneM} of ${totalM} matches completed`, 11, 29.5);

                // Stats badges top-right
                const badges: Array<{label: string; val: number; clr: [number,number,number]}> = [
                    { label: 'TOTAL',    val: totalM, clr: WHITE  },
                    { label: 'DONE',     val: doneM,  clr: DONE   },
                    { label: 'UPCOMING', val: upM,    clr: UP     },
                    ...(liveM > 0 ? [{ label: 'LIVE', val: liveM, clr: LIVE_C }] : []),
                ];
                let bx = W - 8;
                for (let i = badges.length - 1; i >= 0; i--) {
                    const b = badges[i];
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'bold');
                    const lbl = `${b.label}  ${b.val}`;
                    const bw = doc.getTextWidth(lbl) + 8;
                    bx -= bw;
                    // Dark tinted badge fill
                    doc.setFillColor(Math.round(b.clr[0]*0.12), Math.round(b.clr[1]*0.12), Math.round(b.clr[2]*0.12));
                    doc.roundedRect(bx, 13, bw, 8.5, 2, 2, 'F');
                    doc.setDrawColor(...b.clr);
                    doc.setLineWidth(0.3);
                    doc.roundedRect(bx, 13, bw, 8.5, 2, 2, 'S');
                    doc.setTextColor(...b.clr);
                    doc.text(lbl, bx + 4, 18.8);
                    bx -= 3;
                }

                // Thin separator under header
                doc.setDrawColor(...ACC);
                doc.setLineWidth(0.3);
                doc.line(4, HDR_H, W, HDR_H);

                // Footer bar
                doc.setFillColor(8, 11, 24);
                doc.rect(0, H - FTR_H, W, FTR_H, 'F');
                doc.setDrawColor(...ACC);
                doc.setLineWidth(0.4);
                doc.line(0, H - FTR_H, W, H - FTR_H);

                // Footer accent left pip
                doc.setFillColor(...ACC);
                doc.rect(0, H - FTR_H, 4, FTR_H, 'F');

                const genDate = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
                doc.setFontSize(6.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...GRAY6);
                doc.text(`${league} ${selectedSeason}  ·  Generated ${genDate}  ·  sportsup99`, 9, H - 3.5);

                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...GRAY4);
                doc.text(`${pageNum}  /  ${totalPages}`, W - 18, H - 3.5);
            };

            // ── Table data
            const rows = [...seasonMatches]
                .sort((a, b) => a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||''))
                .map((match) => {
                    const dt = new Date(match.date + 'T00:00:00');
                    const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()] ?? '';
                    const dateFmt = dt.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
                    const t1 = match.team1.shortName || match.team1.name || '?';
                    const t2 = match.team2.shortName || match.team2.name || '?';
                    const venue = (match.venue || '—') + (match.playoffType ? `  [${match.playoffType.replace(/-/g,' ')}]` : '');
                    return [
                        String(getMatchNumberDisplay(match, matches)),
                        `${day}  ${dateFmt}`,
                        formatTimeIST(match.time),
                        t1,
                        t2,
                        venue,
                        (match.status || 'upcoming'),
                    ];
                });

            // willDrawPage: draw dark bg before any cells are placed
            autoTable(doc, {
                startY: HDR_H + 3,
                margin: { top: HDR_H + 3, left: 6, right: 6, bottom: FTR_H + 3 },
                head: [['No.', 'Date', 'Time (IST)', 'Home Team', 'Away Team', 'Venue / Type', 'Status']],
                body: rows,
                theme: 'plain',
                styles: {
                    font: 'helvetica',
                    fontSize: 7.5,
                    cellPadding: { top: 3, bottom: 3, left: 4, right: 3 },
                    textColor: [222, 230, 255],   // bright blue-white body text
                    lineWidth: 0,
                    overflow: 'linebreak',         // wrap text instead of truncating
                    minCellHeight: 9,
                },
                headStyles: {
                    fillColor: BGHDRROW,
                    textColor: ACC,
                    fontStyle: 'bold',
                    fontSize: 7.5,
                    minCellHeight: 9,
                },
                columnStyles: {
                    0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },  // No.
                    1: { cellWidth: 44 },                                        // Date
                    2: { cellWidth: 26, halign: 'center' },                     // Time
                    3: { cellWidth: 36, halign: 'right',  fontStyle: 'bold' },  // Home
                    4: { cellWidth: 36, halign: 'left',   fontStyle: 'bold' },  // Away
                    5: { cellWidth: 'auto' },                                    // Venue (fills rest)
                    6: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },  // Status
                },
                didParseCell: (data: any) => {
                    if (data.section !== 'body') return;
                    data.cell.styles.fillColor = data.row.index % 2 === 0 ? BGROW2 : BGROW1;
                    const col = data.column.index;
                    const raw = String(data.cell.raw);
                    if (col === 3 || col === 4) data.cell.styles.textColor = teamClr(raw);
                    if (col === 6) data.cell.styles.textColor = statusClr(raw.toLowerCase());
                    if (col === 0) data.cell.styles.textColor = [...ACC] as [number,number,number];
                },
                willDrawPage: () => {
                    // Lay dark background so cells don't render on white
                    doc.setFillColor(...BG);
                    doc.rect(0, 0, W, H, 'F');
                },
            });

            // Post-process: stamp chrome on all pages now that total is known
            const totalPages = (doc.internal as any).pages.length - 1;
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);
                drawChrome(p, totalPages);
            }

            doc.save(`${league}_${selectedSeason}_Match_Schedule.pdf`);
            showSuccess(`PDF saved — ${league} ${selectedSeason} (${totalM} matches)`);
        } catch (err: any) {
            console.error('PDF generation failed:', err);
            showError('PDF generation failed');
        } finally {
            setPdfGenerating(false);
        }
    };
    // ────────────────────────────────────────────────────────────────────────────

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [matchesData, teamsData] = await Promise.all([
                api.getMatches(currentLeague, { includeAll: true }),
                api.getTeams(currentLeague)
            ]);
            // Recalculate match numbers based on date/time ordering
            const matchesWithNumbers = recalculateMatchNumbers(matchesData);
            setMatches(matchesWithNumbers);
            setTeams(teamsData);

            // Auto-select the most recent season that actually has matches,
            // so a page refresh never lands on an empty season view.
            if (matchesWithNumbers.length > 0) {
                const yearsWithMatches = Array.from(
                    new Set(matchesWithNumbers.map(m => {
                        try { return new Date(m.date + 'T00:00:00').getFullYear(); } catch { return null; }
                    }).filter(Boolean) as number[])
                ).sort((a, b) => b - a); // newest first

                setSelectedSeason(prev => {
                    if (yearsWithMatches.includes(prev)) return prev; // current choice is valid
                    return yearsWithMatches[0]; // jump to most recent year that has matches
                });
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setError('Failed to load matches');
        } finally {
            setIsLoading(false);
        }
    };

    // Refetch data when league changes
    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLeague]);

    const venues = useMemo(() => {
      const uniqueVenues = Array.from(new Set(matches.map(m => m.venue)));
      return uniqueVenues;
    }, [matches]);

    // Season-scoped matches (before other filters)
    const seasonMatches = useMemo(() => {
        return matches.filter(m => {
            try { return new Date(m.date + 'T00:00:00').getFullYear() === selectedSeason; }
            catch { return true; }
        });
    }, [matches, selectedSeason]);

    const filteredMatches = useMemo(() => {
        return seasonMatches.filter(match => {
            if (filters.status !== 'all' && match.status !== filters.status) return false;
            if (filters.dateFrom && match.date < filters.dateFrom) return false;
            if (filters.dateTo && match.date > filters.dateTo) return false;
            if (filters.team !== 'all' && match.team1.id !== filters.team && match.team2.id !== filters.team) return false;
            if (filters.venue !== 'all' && match.venue !== filters.venue) return false;
            
            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const team1Name = match.team1.shortName?.toLowerCase() || match.team1.name?.toLowerCase() || '';
                const team2Name = match.team2.shortName?.toLowerCase() || match.team2.name?.toLowerCase() || '';
                const venue = match.venue.toLowerCase();
                const matchNumber = getMatchNumberDisplay(match, matches).toLowerCase();
                
                if (!team1Name.includes(query) && 
                    !team2Name.includes(query) && 
                    !venue.includes(query) && 
                    !matchNumber.includes(query)) {
                    return false;
                }
            }
            
            return true;
        });
    }, [seasonMatches, filters, searchQuery]);

    const matchesByDate = useMemo(() => {
        const grouped: { [key: string]: Match[] } = {};
        filteredMatches.forEach(match => {
            if (!grouped[match.date]) {
                grouped[match.date] = [];
            }
            grouped[match.date].push(match);
        });
        return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredMatches]);

    const statusCounts = useMemo(() => {
        const total = seasonMatches.length;
        const upcoming = seasonMatches.filter(m => m.status === 'upcoming').length;
        const live = seasonMatches.filter(m => m.status === 'live').length;
        const completed = seasonMatches.filter(m => m.status === 'completed').length;

        return { total, upcoming, live, completed };
    }, [seasonMatches]);

    // Chart data computations
    const matchesByStatusChart = useMemo<ChartDataPoint[]>(() => {
        return [
            { label: 'Scheduled', value: statusCounts.upcoming, color: '#2F6FED' },
            { label: 'Live', value: statusCounts.live, color: '#EF4444' },
            { label: 'Completed', value: statusCounts.completed, color: '#10B981' }
        ];
    }, [statusCounts]);

    const matchesByMonthChart = useMemo<ChartDataPoint[]>(() => {
        const monthCounts: { [key: string]: number } = {};
        matches.forEach(match => {
            const date = new Date(match.date);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        });
        return Object.entries(monthCounts)
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([label, value]) => ({ label, value }));
    }, [matches]);

    const matchesByVenueChart = useMemo<ChartDataPoint[]>(() => {
        const venueCounts: { [key: string]: number } = {};
        matches.forEach(match => {
            venueCounts[match.venue] = (venueCounts[match.venue] || 0) + 1;
        });
        return Object.entries(venueCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([label, value]) => ({ label, value }));
    }, [matches]);

    const matchesByTeamChart = useMemo<ChartDataPoint[]>(() => {
        const teamCounts: { [key: string]: number } = {};
        matches.forEach(match => {
            teamCounts[match.team1.shortName] = (teamCounts[match.team1.shortName] || 0) + 1;
            teamCounts[match.team2.shortName] = (teamCounts[match.team2.shortName] || 0) + 1;
        });
        return Object.entries(teamCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ label, value }));
    }, [matches]);

    // Statistics dashboard data
    const statisticsData = useMemo(() => {
        const totalMatches = matches.length;
        const matchesPerTeam = teams.map(team => {
            const count = matches.filter(m => m.team1.id === team.id || m.team2.id === team.id).length;
            return { team: team.shortName, count };
        }).sort((a, b) => b.count - a.count);

        const dates = matches.map(m => new Date(m.date));
        const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
        const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
        const daysDiff = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
        const avgMatchesPerDay = totalMatches / daysDiff;

        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingThisWeek = matches.filter(m => {
            const matchDate = new Date(m.date);
            return matchDate >= now && matchDate <= weekFromNow && m.status === 'upcoming';
        }).length;

        const completedPercentage = totalMatches > 0 ? (statusCounts.completed / totalMatches) * 100 : 0;

        return {
            totalMatches,
            matchesPerTeam,
            avgMatchesPerDay: avgMatchesPerDay.toFixed(1),
            upcomingThisWeek,
            completedPercentage: completedPercentage.toFixed(1)
        };
    }, [matches, teams, statusCounts]);

    // Team match matrix data
    const teamMatchMatrix = useMemo(() => {
        const matrix: { [key: string]: { [key: string]: number } } = {};
        teams.forEach(team1 => {
            matrix[team1.id] = {};
            teams.forEach(team2 => {
                if (team1.id !== team2.id) {
                    const count = matches.filter(m => 
                        (m.team1.id === team1.id && m.team2.id === team2.id) ||
                        (m.team1.id === team2.id && m.team2.id === team1.id)
                    ).length;
                    matrix[team1.id][team2.id] = count;
                }
            });
        });
        return matrix;
    }, [matches, teams]);

    const playoffTeamOptions = useMemo(() => {
        const leagueTeams = teams.filter((team) => team.league === currentLeague && !team.id.startsWith('tbd-'));

        if (currentLeague !== 'ipl') {
            return leagueTeams;
        }

        const activeIplTeamIds = new Set(getIplSeasonTeamIds(selectedSeason));
        return leagueTeams.filter((team) => activeIplTeamIds.has(team.id));
    }, [teams, currentLeague, selectedSeason]);

    const resetForm = () => {
        setFormData({
            date: '',
            time: '',
            venue: '',
            team1Id: '',
            team2Id: '',
            status: 'upcoming',
            league: 'ipl',
            playoffType: null,
            statusNote: '',
            reducedOversTo: '',
            dlsApplied: false
        });
        setEditingId(null);
        setShowForm(false);
        setShowPlayoffForm(false);
        setSelectedPlayoffType(null);
        setFormStep(1);
        setError(null);
    };

    // Bulk selection handlers
    const toggleSelectMatch = (matchId: string) => {
        setSelectedMatches(prev => {
            const next = new Set(prev);
            if (next.has(matchId)) {
                next.delete(matchId);
            } else {
                next.add(matchId);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedMatches.size === filteredMatches.length) {
            setSelectedMatches(new Set());
        } else {
            setSelectedMatches(new Set(filteredMatches.map(m => m.id)));
        }
    };

    const clearSelection = () => {
        setSelectedMatches(new Set());
    };

    // Bulk operations handlers
    const handleBulkStatusUpdate = async (status: 'upcoming' | 'live' | 'completed') => {
        if (selectedMatches.size === 0) return;
        try {
            setIsSubmitting(true);
            const ids = Array.from(selectedMatches);
            await api.bulkUpdateMatchStatus(ids, status);
            setMatches(prev => prev.map(m => selectedMatches.has(m.id) ? { ...m, status } : m));
            showSuccess(`${ids.length} match${ids.length !== 1 ? 'es' : ''} marked as ${status}`);
            clearSelection();
        } catch (error) {
            console.error('Failed to update match statuses:', error);
            showError('Failed to update match statuses');
        } finally {
            setIsSubmitting(false);
        }
    };

    /** Mark every match in the currently selected season as completed */
    const handleMarkSeasonCompleted = async () => {
        const toMark = seasonMatches.filter(m => m.status !== 'completed');
        if (!toMark.length) {
            showSuccess(`All ${selectedSeason} matches are already marked as completed`);
            return;
        }
        if (!confirm(`Mark all ${toMark.length} remaining matches in ${selectedSeason} as completed? This cannot be undone easily.`)) return;
        try {
            setIsSubmitting(true);
            const ids = toMark.map(m => m.id);
            await api.bulkUpdateMatchStatus(ids, 'completed');
            setMatches(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'completed' } : m));
            showSuccess(`${ids.length} match${ids.length !== 1 ? 'es' : ''} in ${selectedSeason} marked as completed`);
        } catch (err: any) {
            showError(err?.message || 'Failed to mark season as completed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedMatches.size === 0) return;

        // Separate mock matches and real matches
        const realMatches = Array.from(selectedMatches).filter(matchId => {
            const match = matches.find(m => m.id === matchId);
            return match && !(match as any)._isMock;
        });

        const mockMatches = Array.from(selectedMatches).filter(matchId => {
            const match = matches.find(m => m.id === matchId);
            return match && (match as any)._isMock;
        });

        // If only mock matches are selected, just remove them from local state
        if (realMatches.length === 0 && mockMatches.length > 0) {
            setMatches(prev => prev.filter(m => !selectedMatches.has(m.id)));
            setSelectedMatches(new Set());
            setShowBulkDeleteModal(false);
            showSuccess(`${mockMatches.length} sample match(es) removed from view`);
            return;
        }

        // If both types are selected, confirm deletion
        const totalCount = selectedMatches.size;
        const mockCount = mockMatches.length;
        const realCount = realMatches.length;
        
        let confirmMessage = `Are you sure you want to delete ${totalCount} match(es)?`;
        if (mockCount > 0 && realCount > 0) {
            confirmMessage = `Are you sure you want to delete ${realCount} real match(es) and remove ${mockCount} sample match(es)?`;
        }
        
        if (!confirm(confirmMessage)) return;

        if (realMatches.length === 0) {
            showError('No real matches selected for deletion.');
            setSelectedMatches(new Set());
            setShowBulkDeleteModal(false);
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            setShowBulkDeleteModal(false);

            // Delete real matches from backend in one atomic request.
            let bulkDeleteResult: { deleted: number; requested: number; notFound?: string[] } | null = null;
            if (realMatches.length > 0) {
                bulkDeleteResult = await api.bulkDeleteMatches(realMatches);
            }
            
            // Remove both real and mock matches from local state
            setMatches(prev => prev.filter(m => !selectedMatches.has(m.id)));
            setSelectedMatches(new Set());
            
            // Refresh matches from API and recalculate match numbers
            try {
                const updatedMatches = await api.getMatches(currentLeague, { includeAll: true });
                const matchesWithNumbers = recalculateMatchNumbers(updatedMatches);
                setMatches(matchesWithNumbers);
            } catch (refreshError) {
                console.warn('Failed to refresh matches after bulk deletion:', refreshError);
            }
            
            // Show success message
            let successMessage = '';
            const deletedReal = bulkDeleteResult?.deleted ?? realMatches.length;
            const notFoundCount = bulkDeleteResult?.notFound?.length ?? 0;

            if (deletedReal > 0 && mockMatches.length > 0) {
                successMessage = `${deletedReal} real match(es) deleted and ${mockMatches.length} sample match(es) removed`;
            } else if (deletedReal > 0) {
                successMessage = `${deletedReal} match(es) deleted successfully`;
            } else if (mockMatches.length > 0) {
                successMessage = `${mockMatches.length} sample match(es) removed`;
            } else {
                successMessage = 'No matches were deleted';
            }

            if (notFoundCount > 0) {
                successMessage += ` (${notFoundCount} already removed)`;
            }

            showSuccess(successMessage);
        } catch (error: any) {
            console.error('Failed to delete matches:', error);
            let errorMessage = error?.message || 'Failed to delete matches';
            if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                errorMessage = 'Some matches were not found. They may have already been deleted.';
            }
            showError(errorMessage);
            
            // Refresh matches to get current state
            try {
                const updatedMatches = await api.getMatches(currentLeague, { includeAll: true });
                setMatches(updatedMatches);
            } catch (refreshError) {
                console.error('Failed to refresh matches after error:', refreshError);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkExport = (format: 'csv' | 'json' | 'excel' | 'ical') => {
        if (selectedMatches.size === 0) return;

        const selectedMatchesData = matches.filter(m => selectedMatches.has(m.id));
        
        if (format === 'ical') {
            const calendarEvents: CalendarEvent[] = selectedMatchesData.map(match => {
                const [hours, minutes] = match.time.split(':');
                const startDate = new Date(match.date);
                startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                const endDate = new Date(startDate);
                endDate.setHours(endDate.getHours() + 3); // 3 hour match duration

                return {
                    title: `${match.team1.shortName} vs ${match.team2.shortName}`,
                    description: `IPL 2026 Match\\nVenue: ${match.venue}\\nStatus: ${match.status}`,
                    location: match.venue,
                    startDate,
                    endDate,
                };
            });

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `ipl_matches_${timestamp}.ics`;
            exportToICal(calendarEvents, filename);
            showSuccess(`Exported ${selectedMatches.size} match(es) to iCal file`);
            return;
        }
        
        const headers = ['Date', 'Time', 'Team 1', 'Team 2', 'Venue', 'Status'];
        const rows = selectedMatchesData.map(match => [
            formatDateForExport(match.date),
            match.time,
            match.team1.shortName,
            match.team2.shortName,
            match.venue,
            match.status
        ]);

        const exportData = { headers, rows, title: 'Matches Export' };

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `matches_${timestamp}.${format === 'json' ? 'json' : format === 'excel' ? 'xlsx' : 'csv'}`;

        if (format === 'json') {
            exportToJSON(selectedMatchesData, filename);
        } else if (format === 'excel') {
            exportToExcel(exportData, filename);
        } else {
            exportToCSV(exportData, filename);
        }

        showSuccess(`Exported ${selectedMatches.size} match(es) to ${format.toUpperCase()}`);
    };

    // Calendar export handlers
    const handleExportToGoogleCalendar = (match: Match) => {
        const [hours, minutes] = match.time.split(':');
        const startDate = new Date(match.date);
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 3);

        exportToGoogleCalendar({
            title: `${match.team1.shortName} vs ${match.team2.shortName}`,
            description: `IPL 2026 Match\nVenue: ${match.venue}\nStatus: ${match.status}`,
            location: match.venue,
            startDate,
            endDate,
        });
    };

    const handleExportToOutlookCalendar = (match: Match) => {
        const [hours, minutes] = match.time.split(':');
        const startDate = new Date(match.date);
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 3);

        exportToOutlookCalendar({
            title: `${match.team1.shortName} vs ${match.team2.shortName}`,
            description: `IPL 2026 Match\nVenue: ${match.venue}\nStatus: ${match.status}`,
            location: match.venue,
            startDate,
            endDate,
        });
    };

    const handleCopyICalFeedUrl = async () => {
        try {
            await copyICalFeedUrl({
                team: filters.team !== 'all' ? filters.team : undefined,
                status: filters.status !== 'all' ? filters.status : undefined,
            });
            showSuccess('iCal feed URL copied to clipboard!');
        } catch (error) {
            showError('Failed to copy URL to clipboard');
        }
    };

    const iCalFeedUrl = generateICalFeedUrl({
        team: filters.team !== 'all' ? filters.team : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
    });

    const handleBulkEdit = async (values: BulkEditValues) => {
        if (selectedMatches.size === 0) return;

        try {
            setIsSubmitting(true);
            const updatePromises = Array.from(selectedMatches).map(matchId => {
                const match = matches.find(m => m.id === matchId);
                if (!match) return Promise.resolve();

                const updateData: any = {
                    date: match.date,
                    time: match.time,
                    venue: match.venue,
                    team1Id: match.team1.id,
                    team2Id: match.team2.id,
                    status: match.status
                };

                if (values.status) updateData.status = values.status;
                if (values.venue) updateData.venue = values.venue;
                if (values.dateShift && !isNaN(Number(values.dateShift))) {
                    const currentDate = new Date(match.date);
                    currentDate.setDate(currentDate.getDate() + Number(values.dateShift));
                    updateData.date = currentDate.toISOString().split('T')[0];
                }

                return api.updateMatch(matchId, updateData);
            });

            await Promise.all(updatePromises);
            
            // Refresh matches
            const updatedMatches = await api.getMatches(currentLeague, { includeAll: true });
            setMatches(updatedMatches);

            showSuccess(`${selectedMatches.size} match(es) updated successfully`);
            clearSelection();
            setShowBulkEditModal(false);
        } catch (error) {
            console.error('Failed to update matches:', error);
            showError('Failed to update matches');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (match: Match) => {
        setFormData({
            date: match.date,
            time: match.time,
            venue: match.venue,
            team1Id: match.team1.id,
            team2Id: match.team2.id,
            status: match.status,
            league: match.league,
            playoffType: match.playoffType || null,
            statusNote: match.statusNote || '',
            reducedOversTo: match.reducedOversTo ? String(match.reducedOversTo) : '',
            dlsApplied: Boolean(match.dlsApplied)
        });
        setEditingId(match.id);
        setShowForm(true);
        setFormStep(1);
        setError(null);
    };

    const handleDelete = async (matchId: string) => {
        // Check if it's a mock match
        const match = matches.find(m => m.id === matchId);
        if (match && (match as any)._isMock) {
            // Remove from local state only
            const updatedMatches = matches.filter(m => m.id !== matchId);
            const matchesWithNumbers = recalculateMatchNumbers(updatedMatches);
            setMatches(matchesWithNumbers);
            matchesRef.current = matchesWithNumbers;
            showSuccess('Sample match removed');
            return;
        }

        if (!confirm('Are you sure you want to delete this match?')) return;

        try {
            setIsSubmitting(true);
            setError(null);
            await api.deleteMatch(matchId);

            // Always refresh from backend after delete to avoid stale client cache/state.
            const refreshedMatches = await api.getMatches(currentLeague, { includeAll: true });
            const matchesWithNumbers = recalculateMatchNumbers(refreshedMatches);
            setMatches(matchesWithNumbers);
            matchesRef.current = matchesWithNumbers;

            setSelectedMatches(prev => {
                const next = new Set(prev);
                next.delete(matchId);
                return next;
            });

            showSuccess('Match deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete match:', error);
            const errorMessage = error?.message || 'Failed to delete match';
            showError(errorMessage);
            
            // Refresh matches to get current state and recalculate match numbers
            try {
                const refreshedMatches = await api.getMatches(currentLeague, { includeAll: true });
                const matchesWithNumbers = recalculateMatchNumbers(refreshedMatches);
                setMatches(matchesWithNumbers);
                matchesRef.current = matchesWithNumbers;
            } catch (refreshError) {
                console.error('Failed to refresh matches after error:', refreshError);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClearAllMatches = async () => {
        if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL matches? This action cannot be undone and will clear all matches from the database.')) {
            return;
        }
        
        if (!confirm('This will permanently delete ALL matches. Are you absolutely sure?')) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            
            await api.clearAllMatches();
            
            // Clear local state
            setMatches([]);
            setSelectedMatches(new Set());
            
            showSuccess('All matches cleared successfully');
            
            // Refresh to ensure consistency
            await fetchInitialData();
        } catch (error: any) {
            console.error('Failed to clear all matches:', error);
            setError(error?.message || 'Failed to clear all matches');
            showError(error?.message || 'Failed to clear all matches');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteOld = async (matchId: string) => {
        const match = matches.find(m => m.id === matchId);
        const isMockMatch = match && (match as any)._isMock;

        if (!confirm(`Are you sure you want to delete this ${isMockMatch ? 'sample' : ''} match? This action cannot be undone.`)) return;

        try {
            setIsSubmitting(true);
            setError(null);
            
            // If it's a mock match, just remove it from local state (it doesn't exist in backend)
            if (isMockMatch) {
                console.log(`Removing mock match with ID: ${matchId} from local state`);
                setMatches(prev => prev.filter(m => m.id !== matchId));
                setSelectedMatches(prev => {
                    const next = new Set(prev);
                    next.delete(matchId);
                    return next;
                });
                showSuccess('Sample match removed from view');
                setIsSubmitting(false);
                return;
            }

            // For real matches, delete from backend
            console.log(`Attempting to delete match with ID: ${matchId}`);
            await api.deleteMatch(matchId);
            console.log(`Match ${matchId} deleted successfully`);
            
            // Remove from local state immediately for better UX
            setMatches(prev => prev.filter(m => m.id !== matchId));
            setSelectedMatches(prev => {
                const next = new Set(prev);
                next.delete(matchId);
                return next;
            });
            
            // Refresh matches from API to ensure consistency
            try {
                const updatedMatches = await api.getMatches(currentLeague, { includeAll: true });
                setMatches(updatedMatches);
            } catch (refreshError) {
                console.warn('Failed to refresh matches after deletion, but deletion was successful:', refreshError);
            }
            
            showSuccess('Match deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete match:', error);
            let errorMessage = error?.message || 'Failed to delete match. Please try again.';
            
            // Provide more helpful error message for 404
            if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                errorMessage = 'Match not found. It may have already been deleted.';
            }
            
            showError(errorMessage);
            setError(errorMessage);
            
            // Refresh matches to get current state
            try {
                const updatedMatches = await api.getMatches(currentLeague, { includeAll: true });
                setMatches(updatedMatches);
            } catch (refreshError) {
                console.error('Failed to refresh matches after error:', refreshError);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.date || !formData.time || !formData.venue || !formData.team1Id || !formData.team2Id) {
            setError('All fields are required');
            return;
        }

        if (formData.team1Id === formData.team2Id) {
            setError('Teams must be different');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const trimmedNote = formData.statusNote.trim();
            const reducedOversValue = formData.reducedOversTo ? Number(formData.reducedOversTo) : undefined;

            // Ensure league is set from currentLeague context
            const matchData = {
                ...formData,
                league: currentLeague,
                statusNote: trimmedNote || undefined,
                reducedOversTo:
                    reducedOversValue !== undefined && Number.isFinite(reducedOversValue) && reducedOversValue > 0
                        ? reducedOversValue
                        : undefined,
                dlsApplied: formData.dlsApplied ? true : undefined
            };

            if (editingId) {
                const updatedMatch = await api.updateMatch(editingId, matchData);
                // Recalculate all match numbers after update
                const allMatches = matches.map(m => m.id === editingId ? updatedMatch : m);
                const matchesWithNumbers = recalculateMatchNumbers(allMatches);
                setMatches(matchesWithNumbers);
                
                // Dispatch event to refresh match notifications
                window.dispatchEvent(new CustomEvent('match-updated', {
                  detail: { matchId: editingId }
                }));
                
                showSuccess('Match updated successfully');
            } else {
                const newMatch = await api.createMatch(matchData);
                // Recalculate all match numbers after creation
                const allMatches = [...matches, newMatch];
                const matchesWithNumbers = recalculateMatchNumbers(allMatches);
                setMatches(matchesWithNumbers);
                
                // Dispatch event to refresh match notifications
                window.dispatchEvent(new CustomEvent('match-created', {
                  detail: { matchId: newMatch.id }
                }));
                
                showSuccess('Match created successfully');
            }

            resetForm();
        } catch (error) {
            console.error('Failed to save match:', error);
            setError(editingId ? 'Failed to update match' : 'Failed to create match');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'live':
                return <StatusBadge status="live" label="Live" />;
            case 'completed':
                return <StatusBadge status="success" label="Completed" />;
            case 'cancelled':
                return <StatusBadge status="error" label="Cancelled" />;
            default:
                return <StatusBadge status="pending" label="Scheduled" />;
        }
    };

    // Manual status update handlers
    const handleMarkAsCompleted = async (matchId: string) => {
        try {
            setIsSubmitting(true);
            const match = matches.find(m => m.id === matchId);
            if (!match) return;

            await api.updateMatch(matchId, {
                date: match.date,
                time: match.time,
                venue: match.venue,
                team1Id: match.team1.id,
                team2Id: match.team2.id,
                status: 'completed',
                league: match.league
            });

            const updatedMatches = await api.getMatches(currentLeague, { includeAll: true });
            const matchesWithNumbers = recalculateMatchNumbers(updatedMatches);
            setMatches(matchesWithNumbers);
            showSuccess('Match marked as completed');
        } catch (error) {
            console.error('Failed to update match status:', error);
            showError('Failed to update match status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkAsCancelled = async (matchId: string) => {
        try {
            setIsSubmitting(true);
            const match = matches.find(m => m.id === matchId);
            if (!match) return;

            await api.updateMatch(matchId, {
                date: match.date,
                time: match.time,
                venue: match.venue,
                team1Id: match.team1.id,
                team2Id: match.team2.id,
                status: 'cancelled',
                league: match.league
            });

            const updatedMatches = await api.getMatches(currentLeague, { includeAll: true });
            setMatches(updatedMatches);
            showSuccess('Match marked as cancelled');
        } catch (error) {
            console.error('Failed to update match status:', error);
            showError('Failed to update match status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    /** Format an IST 24-h "HH:MM" string → "7:30 PM IST" */
    const formatTimeIST = (timeStr: string): string => {
        if (!timeStr) return '—';
        const [hh, mm] = timeStr.split(':').map(Number);
        if (isNaN(hh) || isNaN(mm)) return timeStr;
        const ampm = hh >= 12 ? 'PM' : 'AM';
        const h12 = hh % 12 || 12;
        return `${h12}:${String(mm).padStart(2, '0')} ${ampm} IST`;
    };

    /**
     * Convert an IST time to the viewer's local timezone.
     * Returns { localStr, tzAbbr } if the viewer is NOT in IST,
     * returns null if the viewer already is in IST (+05:30).
     */
    const formatTimeLocal = (timeStr: string, dateStr: string): { localStr: string; tzAbbr: string } | null => {
        if (!timeStr || !dateStr) return null;
        try {
            const dt = new Date(`${dateStr}T${timeStr}:00+05:30`);
            if (isNaN(dt.getTime())) return null;
            // Check if viewer's offset equals IST (+330 min)
            const viewerOffset = -dt.getTimezoneOffset();
            if (viewerOffset === 330) return null; // already IST
            const h = dt.getHours();
            const m = dt.getMinutes();
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            const tzAbbr = new Intl.DateTimeFormat('en', { timeZoneName: 'short' })
                .formatToParts(dt)
                .find(p => p.type === 'timeZoneName')?.value ?? '';
            return { localStr: `${h12}:${String(m).padStart(2, '0')} ${ampm}`, tzAbbr };
        } catch { return null; }
    };

    // Backward-compat alias used in plain-string contexts (form previews etc.)
    const formatTime = formatTimeIST;

    // Auth handled by layout, no need for auth check

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-[#0B0F13]">
                <AuroraBackground />
                <div className="flex-1 relative z-10 p-8">
                    <div className="space-y-6">
                        {/* Header skeleton */}
                        <div className="space-y-4">
                            <SkeletonLoader height="2rem" width="12rem" />
                            <SkeletonLoader height="1rem" width="8rem" />
                        </div>
                        
                        {/* Stats cards skeleton */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="glass-effect rounded-xl p-4">
                                    <SkeletonLoader height="0.75rem" width="6rem" className="mb-2" />
                                    <SkeletonLoader height="2rem" width="4rem" />
                                </div>
                            ))}
                        </div>
                        
                        {/* Table skeleton */}
                        <div className="glass-effect rounded-xl p-6">
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <SkeletonLoader height="3rem" width="100%" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0B0F13]">
            <AuroraBackground />
            <ToastContainer toasts={toasts} onClose={closeToast} />

            <PageTransition className="flex-1 relative z-10">
                <div className="p-8">
                    {/* Points Table */}
                    {(viewMode === 'grid' || viewMode === 'table') && matches.length > 0 && (
                        <div className="mb-8">
                            <PointsSystemDisplay matches={matches} league={currentLeague} />
                        </div>
                    )}

                    {/* Mobile Search */}
                    <div className="md:hidden mb-6">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search matches..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/20 transition-all text-sm"
                                style={{ background: 'rgba(255,255,255,0.05)' }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                        <div>
                            <div className="mb-2 text-xs text-gray-500 flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => router.push('/ipl-admin-2026/dashboard')}
                                    className="hover:text-ipl-gold transition-colors"
                                >
                                    Admin
                                </button>
                                <span className="text-gray-700">/</span>
                                <button
                                    type="button"
                                    onClick={() => router.push('/ipl-admin-2026/teams')}
                                    className="hover:text-ipl-gold transition-colors"
                                >
                                    Competition
                                </button>
                                <span className="text-gray-700">/</span>
                                <span className="text-gray-400">Matches</span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent tracking-tight">
                                    Manage Matches
                                </h1>
                                {/* Season badge */}
                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
                                    {currentLeague.toUpperCase()} {selectedSeason}
                                </span>
                                {statusCounts.live > 0 && (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-red-500/15 border border-red-500/40 rounded-full text-xs font-bold text-red-400"
                                    >
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                        {statusCounts.live} LIVE
                                    </motion.span>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                                {filteredMatches.length} of {seasonMatches.length} matches · {matches.length} total all seasons
                            </p>

                            {/* Season picker */}
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">Season:</span>
                                <div className="flex items-center gap-1 flex-wrap">
                                    {availableSeasons.slice().reverse().map(year => (
                                        <motion.button
                                            key={year}
                                            onClick={() => setSelectedSeason(year)}
                                            whileHover={{ scale: 1.06 }}
                                            whileTap={{ scale: 0.94 }}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                                                selectedSeason === year
                                                    ? currentLeague === 'wpl'
                                                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                                        : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                                                    : 'border-white/8 text-gray-500 hover:text-gray-300 hover:border-white/20'
                                            }`}
                                            style={selectedSeason !== year ? { background: 'rgba(255,255,255,0.03)' } : {}}
                                        >
                                            {year}
                                        </motion.button>
                                    ))}
                                </div>
                                {/* Mark whole season as completed — only show for past seasons */}
                                {selectedSeason < new Date().getFullYear() && seasonMatches.length > 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={handleMarkSeasonCompleted}
                                        disabled={isSubmitting || seasonMatches.every(m => m.status === 'completed')}
                                        className="ml-2 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200
                                            disabled:opacity-40 disabled:cursor-not-allowed
                                            border-emerald-500/30 text-emerald-400 hover:text-emerald-200 hover:border-emerald-500/60"
                                        style={{ background: 'rgba(16,185,129,0.07)' }}
                                        title={`Mark all ${selectedSeason} matches as completed`}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {seasonMatches.every(m => m.status === 'completed')
                                            ? `${selectedSeason} ✓ all done`
                                            : `Mark ${selectedSeason} complete`}
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-1 p-1 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'table'
                                        ? 'bg-gradient-to-r from-ipl-gold/80 to-ipl-purple/80 text-white shadow-md'
                                        : 'text-gray-500 hover:text-white hover:bg-white/8'
                                    }`}
                                    title="Table View"
                                >
                                    <IconTable className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'timeline'
                                        ? 'bg-gradient-to-r from-ipl-gold/80 to-ipl-purple/80 text-white shadow-md'
                                        : 'text-gray-500 hover:text-white hover:bg-white/8'
                                    }`}
                                    title="Timeline View"
                                >
                                    <IconTimeline className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('analytics')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'analytics'
                                        ? 'bg-gradient-to-r from-ipl-gold/80 to-ipl-purple/80 text-white shadow-md'
                                        : 'text-gray-500 hover:text-white hover:bg-white/8'
                                    }`}
                                    title="Analytics & Charts"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-xl border transition-all duration-200 ${showFilters
                                    ? 'bg-gradient-to-r from-ipl-gold/80 to-ipl-purple/80 text-white border-white/20 shadow-md'
                                    : 'text-gray-400 hover:text-white border-white/10 hover:border-white/20'
                                }`}
                                style={!showFilters ? { background: 'rgba(255,255,255,0.04)' } : {}}
                            >
                                <IconFilter className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2">
                                {/* Calendar Export Dropdown */}
                                <div className="relative group">
                                    <button
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-white/25 transition-all duration-200 text-sm font-medium"
                                        style={{ background: 'rgba(255,255,255,0.04)' }}
                                    >
                                        <Calendar className="w-4 h-4" />
                                        <span className="hidden sm:inline">Calendar</span>
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-72 glass-effect rounded-lg border border-white/10 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => {
                                                    const events: CalendarEvent[] = filteredMatches.map(match => {
                                                        const [hours, minutes] = match.time.split(':');
                                                        const startDate = new Date(match.date);
                                                        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                        const endDate = new Date(startDate);
                                                        endDate.setHours(endDate.getHours() + 3);
                                                        return {
                                                            title: `${match.team1.shortName} vs ${match.team2.shortName}`,
                                                            description: `IPL 2026 Match\\nVenue: ${match.venue}\\nStatus: ${match.status}`,
                                                            location: match.venue,
                                                            startDate,
                                                            endDate,
                                                        };
                                                    });
                                                    const timestamp = new Date().toISOString().split('T')[0];
                                                    exportToICal(events, `ipl_matches_${timestamp}.ics`);
                                                    showSuccess(`Exported ${filteredMatches.length} match(es) to iCal file`);
                                                }}
                                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Calendar className="w-4 h-4" />
                                                <span>Download iCal File</span>
                                            </button>
                                            <button
                                                onClick={handleCopyICalFeedUrl}
                                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Copy className="w-4 h-4" />
                                                <span>Copy iCal Feed URL</span>
                                            </button>
                                            <div className="border-t border-white/10 my-1"></div>
                                            <div className="px-4 py-2 text-xs text-gray-400">
                                                <div className="font-semibold mb-1 text-white">Subscribe via URL:</div>
                                                <div className="break-all text-xs bg-black/30 p-2 rounded font-mono text-gray-300">
                                                    {iCalFeedUrl}
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(iCalFeedUrl);
                                                            showSuccess('iCal feed URL copied!');
                                                        } catch (error) {
                                                            showError('Failed to copy URL');
                                                        }
                                                    }}
                                                    className="mt-2 text-xs text-ipl-gold hover:text-ipl-purple transition-colors flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    <span>Copy URL</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            <div className="flex items-center gap-2">
                            <button
                                    onClick={() => {
                                        setFormData({
                                            date: '',
                                            time: '',
                                            venue: '',
                                            team1Id: '',
                                            team2Id: '',
                                            status: 'upcoming',
                                            league: currentLeague,
                                            playoffType: null,
                                            statusNote: '',
                                            reducedOversTo: '',
                                            dlsApplied: false
                                        });
                                        setEditingId(null);
                                        setSelectedPlayoffType(null);
                                        setFormStep(1);
                                        setError(null);
                                        setShowPlayoffForm(true);
                                        setShowForm(false);
                                        setShowCsvUpload(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-sm font-semibold border border-purple-500/50 hover:border-purple-400/70 transition-all duration-200 shadow-md hover:shadow-purple-500/25"
                                    title="Create playoff match (Eliminator, Final, etc.)"
                                >
                                    <IconPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Playoff Match</span>
                                    <span className="sm:hidden">Playoff</span>
                                </button>
                                {matches.length > 0 && (
                                <button
                                    onClick={handleClearAllMatches}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 text-sm font-medium border border-red-500/30 hover:border-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Clear all matches from database"
                                >
                                    <IconTrash className="w-4 h-4" />
                                    <span className="hidden sm:inline">Clear All</span>
                                </button>
                            )}
                            <button
                                    onClick={() => {
                                        // Pre-fill date with Jan 1 of the selected season so the form defaults to that year
                                        if (!editingId) {
                                            setFormData(prev => ({
                                                ...prev,
                                                date: `${selectedSeason}-01-01`,
                                            }));
                                        }
                                        setShowForm(true);
                                        setShowPlayoffForm(false);
                                        setShowCsvUpload(false);
                                    }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black text-sm font-bold shadow-md hover:shadow-yellow-500/30 transition-all duration-200"
                            >
                                <IconPlus className="w-4 h-4" />
                                <span>Create Match</span>
                            </button>
                            {/* CSV Upload button */}
                            <input
                                ref={csvInputRef}
                                type="file"
                                accept=".csv,text/csv,.pdf,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleCsvFile(file);
                                    e.target.value = '';
                                }}
                            />
                            <button
                                onClick={() => {
                                    setShowCsvUpload(v => !v);
                                    setShowForm(false);
                                    setShowPlayoffForm(false);
                                    setCsvRows([]);
                                    setCsvFileName('');
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                                    showCsvUpload
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                        : 'border-white/10 text-gray-300 hover:text-white hover:border-white/25'
                                }`}
                                style={!showCsvUpload ? { background: 'rgba(255,255,255,0.05)' } : {}}
                                title="Upload season schedule via CSV"
                            >
                                <Upload className="w-4 h-4" />
                                <span className="hidden sm:inline">Upload CSV</span>
                            </button>
                            {/* PDF Download */}
                            <button
                                onClick={handleDownloadPdf}
                                disabled={pdfGenerating || !seasonMatches.length}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm font-semibold transition-all duration-200 text-gray-300 hover:text-white hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: 'rgba(255,255,255,0.05)' }}
                                title={`Download ${currentLeague.toUpperCase()} ${selectedSeason} schedule as PDF`}
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">{pdfGenerating ? 'Generating…' : 'Export PDF'}</span>
                            </button>
                            </div>
                            </div>
                            <a
                                href="/matches"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/25 transition-all duration-200"
                                style={{ background: 'rgba(255,255,255,0.04)' }}
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Public page
                            </a>
                        </div>
                    </div>

                    {/* Global status summary */}
                    <StaggeredList className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" staggerDelay={0.1}>
                        <motion.div
                            className="relative overflow-hidden rounded-2xl p-5 border border-white/10 hover:border-slate-400/40 cursor-pointer group transition-all duration-300"
                            style={{ background: 'linear-gradient(145deg, rgba(30,35,50,0.9) 0%, rgba(15,18,28,0.95) 100%)' }}
                            onClick={() => setFilters({ ...filters, status: 'all' })}
                            whileHover={{ scale: 1.03, y: -2 }}
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/50 to-transparent" />
                            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-500/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-lg shadow-slate-700/50">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-3xl font-extrabold text-white tabular-nums">{statusCounts.total}</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-300 mb-0.5">All Matches</p>
                            <p className="text-xs text-slate-500">Total scheduled</p>
                            <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-slate-400 to-slate-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative overflow-hidden rounded-2xl p-5 border border-white/10 hover:border-blue-500/40 cursor-pointer group transition-all duration-300"
                            style={{ background: 'linear-gradient(145deg, rgba(20,30,55,0.9) 0%, rgba(12,18,40,0.95) 100%)' }}
                            onClick={() => setFilters({ ...filters, status: 'upcoming' })}
                            whileHover={{ scale: 1.03, y: -2 }}
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-700/50">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-3xl font-extrabold text-white tabular-nums">{statusCounts.upcoming}</span>
                            </div>
                            <p className="text-sm font-semibold text-blue-200 mb-0.5">Upcoming</p>
                            <p className="text-xs text-blue-500/70">
                                {statusCounts.total > 0 ? ((statusCounts.upcoming / statusCounts.total) * 100).toFixed(0) : 0}% of total
                            </p>
                            <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${statusCounts.total > 0 ? (statusCounts.upcoming / statusCounts.total) * 100 : 0}%` }}
                                    transition={{ duration: 0.9, delay: 0.3 }}
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative overflow-hidden rounded-2xl p-5 border border-white/10 hover:border-red-500/40 cursor-pointer group transition-all duration-300"
                            style={{ background: 'linear-gradient(145deg, rgba(40,15,20,0.9) 0%, rgba(28,10,14,0.95) 100%)' }}
                            onClick={() => setFilters({ ...filters, status: 'live' })}
                            whileHover={{ scale: 1.03, y: -2 }}
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/60 to-transparent" />
                            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-700/50">
                                    {statusCounts.live > 0 ? (
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                        </span>
                                    ) : (
                                        <Zap className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <span className={`text-3xl font-extrabold tabular-nums ${statusCounts.live > 0 ? 'text-red-300 animate-pulse' : 'text-white'}`}>{statusCounts.live}</span>
                            </div>
                            <p className="text-sm font-semibold text-red-200 mb-0.5">Live Now</p>
                            <p className="text-xs text-red-500/70">
                                {statusCounts.total > 0 ? ((statusCounts.live / statusCounts.total) * 100).toFixed(0) : 0}% of total
                            </p>
                            <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-red-400 to-rose-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${statusCounts.total > 0 ? (statusCounts.live / statusCounts.total) * 100 : 0}%` }}
                                    transition={{ duration: 0.9, delay: 0.4 }}
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative overflow-hidden rounded-2xl p-5 border border-white/10 hover:border-emerald-500/40 cursor-pointer group transition-all duration-300"
                            style={{ background: 'linear-gradient(145deg, rgba(15,35,25,0.9) 0%, rgba(10,22,16,0.95) 100%)' }}
                            onClick={() => setFilters({ ...filters, status: 'completed' })}
                            whileHover={{ scale: 1.03, y: -2 }}
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-700/50">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-3xl font-extrabold text-white tabular-nums">{statusCounts.completed}</span>
                            </div>
                            <p className="text-sm font-semibold text-emerald-200 mb-0.5">Completed</p>
                            <p className="text-xs text-emerald-500/70">
                                {statusCounts.total > 0 ? ((statusCounts.completed / statusCounts.total) * 100).toFixed(0) : 0}% done
                            </p>
                            <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${statusCounts.total > 0 ? (statusCounts.completed / statusCounts.total) * 100 : 0}%` }}
                                    transition={{ duration: 0.9, delay: 0.5 }}
                                />
                            </div>
                        </motion.div>
                    </StaggeredList>

                    <PlayoffOverview
                        league={currentLeague}
                        selectedSeason={selectedSeason}
                        seasonMatches={seasonMatches}
                        teams={teams}
                    />

                    {/* Venue Filter Dropdown */}
                    <div className="mb-6 relative max-w-xs">
                        <button
                            onClick={() => setIsVenueDropdownOpen(!isVenueDropdownOpen)}
                            className="glass-effect px-6 py-3 rounded-lg text-white font-medium flex items-center space-x-3 w-full hover:bg-white/10 transition-all duration-300 group"
                        >
                            <svg 
                                className="w-5 h-5 text-ipl-gold" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="flex-1 text-left truncate">
                                {filters.venue === 'all' ? 'All Venues' : filters.venue}
                            </span>
                            <svg 
                                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isVenueDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        <div 
                            className={`absolute left-0 right-0 mt-2 glass-effect rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-out origin-top z-20 ${
                                isVenueDropdownOpen 
                                    ? 'opacity-100 scale-y-100 max-h-[450px]' 
                                    : 'opacity-0 scale-y-0 max-h-0 pointer-events-none'
                            }`}
                        >
                            <div className="py-2 max-h-[430px] overflow-y-auto scrollbar-thin scrollbar-thumb-ipl-gold/50 scrollbar-track-white/5">
                                {/* All Venues Option */}
                                <button
                                    onClick={() => {
                                        setFilters({ ...filters, venue: 'all' });
                                        setIsVenueDropdownOpen(false);
                                    }}
                                    className={`w-full px-6 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center space-x-3 ${
                                        filters.venue === 'all' ? 'bg-ipl-gold/20 text-ipl-gold' : 'text-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-ipl-gold to-ipl-purple">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold">All Venues</div>
                                        <div className="text-xs text-gray-400">{matches.length} matches</div>
                                    </div>
                                    {filters.venue === 'all' && (
                                        <svg className="w-5 h-5 text-ipl-gold" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>

                                {/* Venue Options */}
                                <div className="border-t border-white/10 mt-2 pt-2">
                                    {venues.map((venue) => {
                                        const venueMatchesCount = matches.filter(m => m.venue === venue).length;
                                        // Extract city from venue string (usually after the comma)
                                        const venueParts = venue.split(',');
                                        const stadiumName = venueParts[0].trim();
                                        const city = venueParts[1]?.trim() || '';
                                        
                                        return (
                                            <button
                                                key={venue}
                                                onClick={() => {
                                                    setFilters({ ...filters, venue: venue });
                                                    setIsVenueDropdownOpen(false);
                                                }}
                                                className={`w-full px-6 py-3 text-left hover:bg-white/10 transition-all duration-200 flex items-center space-x-3 group ${
                                                    filters.venue === venue ? 'bg-ipl-gold/20 text-ipl-gold' : 'text-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-ipl-purple/30 text-white shadow-lg">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold truncate">{stadiumName}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-2">
                                                        {city && <span>📍 {city}</span>}
                                                        <span>•</span>
                                                        <span>{venueMatchesCount} match{venueMatchesCount !== 1 ? 'es' : ''}</span>
                                                    </div>
                                                </div>
                                                {filters.venue === venue && (
                                                    <svg className="w-5 h-5 text-ipl-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="rounded-2xl p-5 mb-6 border border-white/10"
                            style={{ background: 'linear-gradient(145deg, rgba(20,25,40,0.95) 0%, rgba(12,14,22,0.98) 100%)' }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <IconFilter className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-semibold text-white">Filters</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="w-full rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/40 border border-white/10 transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.06)' }}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="upcoming">Scheduled</option>
                                        <option value="live">Live</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Date From</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                        className="w-full rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/40 border border-white/10 transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.06)' }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Date To</label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                        className="w-full rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/40 border border-white/10 transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.06)' }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Team</label>
                                    <select
                                        value={filters.team}
                                        onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                                        className="w-full rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/40 border border-white/10 transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.06)' }}
                                    >
                                        <option value="all">All Teams</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.shortName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Venue</label>
                                    <select
                                        value={filters.venue}
                                        onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
                                        className="w-full rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/40 border border-white/10 transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.06)' }}
                                    >
                                        <option value="all">All Venues</option>
                                        {venues.map(venue => (
                                            <option key={venue} value={venue}>{venue}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => setFilters({ status: 'all', dateFrom: '', dateTo: '', team: 'all', venue: 'all' })}
                                    className="text-xs text-gray-500 hover:text-yellow-400 transition-colors flex items-center gap-1.5"
                                >
                                    <IconX className="w-3.5 h-3.5" />
                                    Clear all filters
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {showForm && (
                        <motion.div
                            key="create-edit-form"
                            initial={{ opacity: 0, y: -16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="relative overflow-hidden rounded-2xl mb-8 border border-white/10"
                            style={{ background: 'linear-gradient(160deg, rgba(14,18,32,0.98) 0%, rgba(10,12,22,0.99) 100%)' }}
                        >
                            {/* Top accent line */}
                            <div className={`h-1 w-full bg-gradient-to-r ${editingId ? 'from-yellow-500 via-amber-400 to-orange-500' : 'from-blue-500 via-indigo-500 to-purple-600'}`} />

                            {/* Ambient glow */}
                            <div className={`absolute top-0 left-0 right-0 h-32 opacity-8 pointer-events-none bg-gradient-to-b ${editingId ? 'from-yellow-500/10' : 'from-blue-500/10'} to-transparent`} />

                            <div className="relative p-6 lg:p-8">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-7">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${editingId ? 'bg-yellow-500/15 border border-yellow-500/30' : 'bg-blue-500/15 border border-blue-500/30'}`}>
                                            {editingId ? (
                                                <IconEdit className={`w-5 h-5 text-yellow-400`} />
                                            ) : (
                                                <IconPlus className={`w-5 h-5 text-blue-400`} />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">
                                                {editingId ? 'Edit Match' : 'Create New Match'}
                                            </h2>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {editingId ? 'Update match details below' : 'Fill in the details to schedule a match'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={resetForm}
                                        className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/8 transition-all duration-200"
                                    >
                                        <IconX className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Step Indicators */}
                                <div className="flex items-center gap-0 mb-8">
                                    {[
                                        { num: 1, label: 'Date & Time' },
                                        { num: 2, label: 'Teams' },
                                        { num: 3, label: 'Venue & Status' },
                                    ].map((step, i) => (
                                        <div key={step.num} className="flex items-center flex-1">
                                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                                <motion.div
                                                    animate={{
                                                        scale: formStep === step.num ? 1.1 : 1,
                                                        backgroundColor: formStep > step.num
                                                            ? 'rgba(16, 185, 129, 0.9)'
                                                            : formStep === step.num
                                                            ? 'rgba(234, 179, 8, 0.9)'
                                                            : 'rgba(255,255,255,0.08)',
                                                    }}
                                                    transition={{ duration: 0.3 }}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer"
                                                    style={{
                                                        borderColor: formStep > step.num
                                                            ? 'rgba(16, 185, 129, 0.5)'
                                                            : formStep === step.num
                                                            ? 'rgba(234, 179, 8, 0.5)'
                                                            : 'rgba(255,255,255,0.1)',
                                                    }}
                                                    onClick={() => formStep > step.num && setFormStep(step.num)}
                                                >
                                                    {formStep > step.num ? (
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <span className={`text-xs font-bold ${formStep === step.num ? 'text-white' : 'text-gray-500'}`}>{step.num}</span>
                                                    )}
                                                </motion.div>
                                                <span className={`text-[10px] font-medium hidden sm:block ${formStep === step.num ? 'text-yellow-400' : formStep > step.num ? 'text-emerald-400' : 'text-gray-600'}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                            {i < 2 && (
                                                <div className="flex-1 mx-2 mt-[-10px]">
                                                    <div className="h-px w-full bg-white/8 relative overflow-hidden rounded-full">
                                                        <motion.div
                                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-emerald-400 rounded-full"
                                                            initial={{ width: '0%' }}
                                                            animate={{ width: formStep > step.num ? '100%' : '0%' }}
                                                            transition={{ duration: 0.4, ease: 'easeOut' }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="mb-6 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm flex items-center gap-2.5"
                                    >
                                        <IconX className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    {formStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.28 }}
                                            className="space-y-5"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                        Match Date
                                                    </label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                        <input
                                                            type="date"
                                                            value={formData.date}
                                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15 transition-all"
                                                            style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                        Match Time (IST)
                                                        {currentLeague === 'wpl' && (
                                                            <span className="ml-2 normal-case font-normal text-purple-400">WPL times only</span>
                                                        )}
                                                    </label>
                                                    {currentLeague === 'wpl' ? (
                                                        <div className="space-y-2">
                                                            <div className="relative">
                                                                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                                <select
                                                                    value={formData.time}
                                                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15 transition-all appearance-none"
                                                                    style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                                    required
                                                                >
                                                                    <option value="">Select a time...</option>
                                                                    {WPL_TIMES.map((timeOption, index) => (
                                                                        <option key={index} value={timeOption.ist} className="bg-gray-900 text-white">
                                                                            {timeOption.display}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            {formData.time && (
                                                                <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-500/8 border border-purple-500/20 rounded-lg px-3 py-2">
                                                                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                                                    {(() => {
                                                                        const selected = WPL_TIMES.find(t => t.ist === formData.time);
                                                                        return selected ? `Storing: ${selected.ist} IST (Paris: ${selected.paris})` : `Storing: ${formData.time} IST`;
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                            <input
                                                                type="time"
                                                                value={formData.time}
                                                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15 transition-all"
                                                                style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                                required
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Preview card */}
                                            {(formData.date || formData.time) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center gap-3 p-3.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5"
                                                >
                                                    <Calendar className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                                    <span className="text-sm text-yellow-200/80">
                                                        {formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '–'}
                                                        {formData.time ? ` · ${formatTime(formData.time)}` : ''}
                                                    </span>
                                                </motion.div>
                                            )}

                                            <div className="flex justify-end pt-2">
                                                <motion.button
                                                    type="button"
                                                    onClick={() => setFormStep(2)}
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-sm font-bold shadow-md hover:shadow-yellow-500/30 transition-all"
                                                >
                                                    Next: Select Teams
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {formStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.28 }}
                                            className="space-y-5"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                        Team 1 <span className="text-blue-400 normal-case font-normal">(Home)</span>
                                                    </label>
                                                    <div className="relative">
                                                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                        <select
                                                            value={formData.team1Id}
                                                            onChange={(e) => setFormData({ ...formData, team1Id: e.target.value })}
                                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 transition-all appearance-none"
                                                            style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                            required
                                                        >
                                                            <option value="">Select Team 1...</option>
                                                            {teams.map(team => (
                                                                <option key={team.id} value={team.id} disabled={team.id === formData.team2Id} className="bg-gray-900">
                                                                    {team.shortName} — {team.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                    {formData.team1Id && (
                                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-blue-400 pl-1">
                                                            ✓ {teams.find(t => t.id === formData.team1Id)?.name}
                                                        </motion.p>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                        Team 2 <span className="text-rose-400 normal-case font-normal">(Away)</span>
                                                    </label>
                                                    <div className="relative">
                                                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                        <select
                                                            value={formData.team2Id}
                                                            onChange={(e) => setFormData({ ...formData, team2Id: e.target.value })}
                                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/15 transition-all appearance-none"
                                                            style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                            required
                                                        >
                                                            <option value="">Select Team 2...</option>
                                                            {teams.map(team => (
                                                                <option key={team.id} value={team.id} disabled={team.id === formData.team1Id} className="bg-gray-900">
                                                                    {team.shortName} — {team.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                    {formData.team2Id && (
                                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-rose-400 pl-1">
                                                            ✓ {teams.find(t => t.id === formData.team2Id)?.name}
                                                        </motion.p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Matchup preview */}
                                            {formData.team1Id && formData.team2Id && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center justify-center gap-4 p-4 rounded-xl border border-white/10"
                                                    style={{ background: 'rgba(255,255,255,0.03)' }}
                                                >
                                                    <span className="text-sm font-bold text-blue-300">{teams.find(t => t.id === formData.team1Id)?.shortName}</span>
                                                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-white/5 to-white/10 border border-white/15 text-xs font-extrabold text-gray-300">VS</div>
                                                    <span className="text-sm font-bold text-rose-300">{teams.find(t => t.id === formData.team2Id)?.shortName}</span>
                                                </motion.div>
                                            )}

                                            {formData.team1Id === formData.team2Id && formData.team1Id && (
                                                <p className="text-xs text-red-400 flex items-center gap-1.5">
                                                    <IconX className="w-3.5 h-3.5" /> Same team selected — please choose different teams
                                                </p>
                                            )}

                                            <div className="flex justify-between pt-2">
                                                <motion.button type="button" onClick={() => setFormStep(1)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-white/25 text-sm font-medium transition-all"
                                                    style={{ background: 'rgba(255,255,255,0.04)' }}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                                    Back
                                                </motion.button>
                                                <motion.button type="button" onClick={() => setFormStep(3)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-sm font-bold shadow-md hover:shadow-yellow-500/30 transition-all"
                                                >
                                                    Next: Venue & Status
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {formStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.28 }}
                                            className="space-y-5"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="md:col-span-2 space-y-1.5 relative">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                        Venue
                                                        {currentLeague === 'wpl' && (
                                                            <span className="ml-2 normal-case font-normal text-purple-400">WPL 2026 venues only</span>
                                                        )}
                                                    </label>
                                                    {currentLeague === 'wpl' ? (
                                                        <div className="relative">
                                                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                            <select
                                                                value={formData.venue}
                                                                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15 transition-all appearance-none"
                                                                style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                                required
                                                            >
                                                                <option value="">Select a venue...</option>
                                                                {WPL_VENUES.map((venue, index) => (
                                                                    <option key={index} value={venue} className="bg-gray-900 text-white">{venue}</option>
                                                                ))}
                                                            </select>
                                                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                                                            <input
                                                                type="text"
                                                                value={formData.venue}
                                                                onChange={(e) => {
                                                                    setFormData({ ...formData, venue: e.target.value });
                                                                    setVenueSearchQuery(e.target.value);
                                                                }}
                                                                onFocus={() => setVenueSearchQuery(formData.venue)}
                                                                className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15 transition-all"
                                                                style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                                placeholder="Search or type a stadium..."
                                                                required
                                                            />
                                                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                        </div>
                                                    )}

                                                    {/* Venue Suggestions Dropdown */}
                                                    {currentLeague === 'ipl' && venueSearchQuery && (
                                                        <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl shadow-2xl border border-white/10 overflow-hidden max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500/30 scrollbar-track-white/5"
                                                            style={{ background: 'rgba(14,18,32,0.98)', backdropFilter: 'blur(20px)' }}
                                                        >
                                                            {IPL_VENUES
                                                                .filter(venue => venue.toLowerCase().includes(venueSearchQuery.toLowerCase()))
                                                                .map((venue, index) => {
                                                                    const [stadiumName, city] = venue.split(',').map(s => s.trim());
                                                                    return (
                                                                        <button
                                                                            key={index}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFormData({ ...formData, venue });
                                                                                setVenueSearchQuery('');
                                                                            }}
                                                                            className="w-full px-4 py-3 text-left hover:bg-white/8 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                                                                        >
                                                                            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                                                                <MapPin className="w-4 h-4 text-yellow-400" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="text-white text-sm font-medium truncate">{stadiumName}</div>
                                                                                <div className="text-xs text-gray-500">{city}</div>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })
                                                            }
                                                            {IPL_VENUES.filter(v => v.toLowerCase().includes(venueSearchQuery.toLowerCase())).length === 0 && (
                                                                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                                                    No venues matched — you can type a custom venue
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Match Status</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {(['upcoming', 'live', 'completed', 'cancelled'] as const).map((s) => {
                                                            const cfg: Record<string, { label: string; color: string; ring: string }> = {
                                                                upcoming: { label: 'Scheduled', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300', ring: 'ring-blue-500/30' },
                                                                live:     { label: 'Live',      color: 'border-red-500/40 bg-red-500/10 text-red-300',   ring: 'ring-red-500/30' },
                                                                completed:{ label: 'Completed', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300', ring: 'ring-emerald-500/30' },
                                                                cancelled:{ label: 'Cancelled', color: 'border-gray-500/40 bg-gray-500/10 text-gray-400', ring: 'ring-gray-500/30' },
                                                            };
                                                            const c = cfg[s];
                                                            const isActive = formData.status === s;
                                                            return (
                                                                <motion.button
                                                                    key={s}
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, status: s })}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${isActive ? c.color + ' ring-2 ' + c.ring : 'border-white/8 text-gray-500 hover:border-white/20 hover:text-gray-300'}`}
                                                                    style={isActive ? {} : { background: 'rgba(255,255,255,0.03)' }}
                                                                >
                                                                    {c.label}
                                                                </motion.button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 space-y-4">
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                            Match Advisory (optional)
                                                        </label>
                                                        <textarea
                                                            value={formData.statusNote}
                                                            onChange={(e) => setFormData({ ...formData, statusNote: e.target.value })}
                                                            rows={3}
                                                            className="w-full px-4 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15 transition-all resize-none"
                                                            style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                            placeholder="Example: Match abandoned due to rain. Overs reduced to 8 per side."
                                                        />
                                                        <p className="text-[11px] text-gray-500">
                                                            Shown on match cards and match center so fans know about abandonments or reduced overs.
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                                Reduced overs per side
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={20}
                                                                step={1}
                                                                value={formData.reducedOversTo}
                                                                onChange={(e) => setFormData({ ...formData, reducedOversTo: e.target.value })}
                                                                className="w-full px-4 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15 transition-all"
                                                                style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                                placeholder="e.g., 8"
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                                DLS applied
                                                            </label>
                                                            <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 text-sm text-gray-300 cursor-pointer"
                                                                style={{ background: 'rgba(255,255,255,0.06)' }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.dlsApplied}
                                                                    onChange={(e) => setFormData({ ...formData, dlsApplied: e.target.checked })}
                                                                    className="h-4 w-4 rounded border-white/20 text-yellow-500 focus:ring-yellow-500/30"
                                                                />
                                                                <span>Duckworth-Lewis-Stern method used</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Summary preview */}
                                            {(formData.team1Id && formData.team2Id && formData.date) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-4 rounded-xl border border-white/10"
                                                    style={{ background: 'rgba(255,255,255,0.025)' }}
                                                >
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Match Summary</p>
                                                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                                                        <span className="text-gray-300">
                                                            <span className="text-white font-semibold">{teams.find(t => t.id === formData.team1Id)?.shortName}</span>
                                                            <span className="text-gray-500 mx-2">vs</span>
                                                            <span className="text-white font-semibold">{teams.find(t => t.id === formData.team2Id)?.shortName}</span>
                                                        </span>
                                                        {formData.date && <span className="text-gray-400">{new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                                                        {formData.time && <span className="text-gray-400">{formatTime(formData.time)}</span>}
                                                        {formData.venue && <span className="text-gray-400 truncate max-w-[220px]">{formData.venue.split(',')[0]}</span>}
                                                    </div>
                                                </motion.div>
                                            )}

                                            <div className="flex justify-between pt-2">
                                                <motion.button type="button" onClick={() => setFormStep(2)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-white/25 text-sm font-medium transition-all"
                                                    style={{ background: 'rgba(255,255,255,0.04)' }}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                                    Back
                                                </motion.button>
                                                <motion.button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    whileHover={{ scale: isSubmitting ? 1 : 1.03 }}
                                                    whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
                                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${editingId ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:shadow-yellow-500/30' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-blue-500/30'}`}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                                            Saving…
                                                        </>
                                                    ) : editingId ? (
                                                        <><IconEdit className="w-4 h-4" /> Update Match</>
                                                    ) : (
                                                        <><IconPlus className="w-4 h-4" /> Create Match</>
                                                    )}
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {showPlayoffForm && (
                        <motion.div
                            key="playoff-form"
                            initial={{ opacity: 0, y: -16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="relative overflow-hidden rounded-2xl mb-8 border border-purple-500/20"
                            style={{ background: 'linear-gradient(160deg, rgba(14,10,32,0.99) 0%, rgba(10,8,22,0.99) 100%)' }}
                        >
                            {/* Top accent line */}
                            <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-violet-600" />

                            {/* Ambient glow */}
                            <div className="absolute top-0 left-0 right-0 h-40 opacity-10 pointer-events-none bg-gradient-to-b from-purple-500/20 to-transparent" />

                            <div className="relative p-6 lg:p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-500/15 border border-purple-500/30">
                                            <Zap className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Create Playoff Match</h2>
                                            <p className="text-xs text-gray-500 mt-0.5">Pre-filled dates, times & venues — editable as needed</p>
                                        </div>
                                    </div>
                                    <button onClick={resetForm} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/8 transition-all duration-200">
                                        <IconX className="w-5 h-5" />
                                    </button>
                                </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-6 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm flex items-center gap-2.5"
                                >
                                    <IconX className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!selectedPlayoffType) {
                                    setError('Please select a playoff type');
                                    return;
                                }

                                if (!formData.team1Id || !formData.team2Id) {
                                    setError('Please select both playoff teams');
                                    return;
                                }

                                if (formData.team1Id === formData.team2Id) {
                                    setError('Please select two different teams');
                                    return;
                                }

                                try {
                                    setIsSubmitting(true);
                                    setError(null);

                                    const playoffDetails = getPlayoffMatchDetails(selectedPlayoffType, currentLeague, selectedSeason);
                                    if (!playoffDetails) {
                                        setError('Invalid playoff type');
                                        return;
                                    }

                                    // Create the playoff match (use formData values if set, otherwise use defaults)
                                    const matchData = {
                                        date: formData.date || playoffDetails.date,
                                        time: formData.time || playoffDetails.time,
                                        venue: formData.venue || playoffDetails.venue,
                                        team1Id: formData.team1Id,
                                        team2Id: formData.team2Id,
                                        status: 'upcoming' as const,
                                        league: currentLeague,
                                        playoffType: selectedPlayoffType
                                    };

                                    const newMatch = await api.createMatch(matchData);

                                    // Recalculate all match numbers after creation
                                    const allMatches = [...matches, newMatch];
                                    const matchesWithNumbers = recalculateMatchNumbers(allMatches);
                                    setMatches(matchesWithNumbers);
                                    
                                    // Dispatch event to refresh match notifications
                                    window.dispatchEvent(new CustomEvent('match-created', {
                                      detail: { matchId: newMatch.id }
                                    }));
                                    
                                    showSuccess(`${playoffDetails.title} match created successfully`);
                                    resetForm();
                                } catch (error: any) {
                                    console.error('Failed to create playoff match:', error);
                                    setError(error?.message || 'Failed to create playoff match');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Playoff Type <span className="text-red-400 normal-case font-normal">required</span>
                                        </label>
                                        <div className="relative">
                                            <Zap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                                            <select
                                                value={selectedPlayoffType || ''}
                                                onChange={(e) => {
                                                    const playoffType = e.target.value as PlayoffType;
                                                    setSelectedPlayoffType(playoffType);
                                                    if (playoffType) {
                                                        const details = getPlayoffMatchDetails(playoffType, currentLeague, selectedSeason);
                                                        if (details) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                date: details.date,
                                                                time: details.time,
                                                                venue: details.venue,
                                                                team1Id: '',
                                                                team2Id: '',
                                                                playoffType: playoffType
                                                            }));
                                                        }
                                                    }
                                                }}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-500/20 text-white text-sm focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none"
                                                style={{ background: 'rgba(168,85,247,0.06)', colorScheme: 'dark' }}
                                                required
                                            >
                                                <option value="">Choose a playoff type…</option>
                                                {getPlayoffTypes().map(type => (
                                                    <option key={type.value || 'none'} value={type.value || ''} className="bg-gray-900 text-white">
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>

                                    {selectedPlayoffType && (() => {
                                        const details = getPlayoffMatchDetails(selectedPlayoffType, currentLeague, selectedSeason);
                                        if (!details) return null;
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.28 }}
                                                className="space-y-4"
                                            >
                                                {/* Editable details */}
                                                <div className="rounded-xl border border-purple-500/20 overflow-hidden" style={{ background: 'rgba(168,85,247,0.04)' }}>
                                                    <div className="px-4 py-3 border-b border-purple-500/15 flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-purple-400" />
                                                        <span className="text-sm font-semibold text-purple-300">Match Details</span>
                                                        <span className="ml-auto text-xs text-gray-500">Pre-filled · editable</span>
                                                    </div>
                                                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</label>
                                                            <div className="relative">
                                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                                                                <input
                                                                    type="date"
                                                                    value={formData.date || details.date}
                                                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/8 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15 transition-all"
                                                                    style={{ background: 'rgba(255,255,255,0.05)', colorScheme: 'dark' }}
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Time (IST)</label>
                                                            {currentLeague === 'wpl' ? (
                                                                <div className="relative">
                                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                                                                    <select
                                                                        value={formData.time || details.time}
                                                                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/8 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all appearance-none"
                                                                        style={{ background: 'rgba(255,255,255,0.05)', colorScheme: 'dark' }}
                                                                        required
                                                                    >
                                                                        <option value="">Select…</option>
                                                                        {WPL_TIMES.map((timeOption, index) => (
                                                                            <option key={index} value={timeOption.ist} className="bg-gray-900 text-white">{timeOption.display}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                                                                    <input
                                                                        type="time"
                                                                        value={formData.time || details.time}
                                                                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/8 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                                                                        style={{ background: 'rgba(255,255,255,0.05)', colorScheme: 'dark' }}
                                                                        required
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Venue</label>
                                                            {currentLeague === 'wpl' ? (
                                                                <div className="relative">
                                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                                                                    <select
                                                                        value={formData.venue || details.venue}
                                                                        onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                                                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/8 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all appearance-none"
                                                                        style={{ background: 'rgba(255,255,255,0.05)', colorScheme: 'dark' }}
                                                                        required
                                                                    >
                                                                        <option value="">Select…</option>
                                                                        {WPL_VENUES.map((venue, index) => (
                                                                            <option key={index} value={venue} className="bg-gray-900 text-white">{venue}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                                                                    <input
                                                                        type="text"
                                                                        value={formData.venue || details.venue}
                                                                        onChange={(e) => {
                                                                            setFormData(prev => ({ ...prev, venue: e.target.value }));
                                                                            setVenueSearchQuery(e.target.value);
                                                                        }}
                                                                        onFocus={() => setVenueSearchQuery(formData.venue || details.venue)}
                                                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/8 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                                                                        style={{ background: 'rgba(255,255,255,0.05)', colorScheme: 'dark' }}
                                                                        placeholder="Stadium, City"
                                                                        required
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-blue-500/20 overflow-hidden" style={{ background: 'rgba(59,130,246,0.04)' }}>
                                                    <div className="px-4 py-3 border-b border-blue-500/15 flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-blue-400" />
                                                        <span className="text-sm font-semibold text-blue-300">Teams</span>
                                                        <span className="ml-auto text-xs text-gray-500">
                                                            {currentLeague === 'ipl' ? 'Select from 10 IPL teams' : 'Select playoff teams'}
                                                        </span>
                                                    </div>
                                                    <div className="px-4 py-4 space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                                                            <div className="space-y-1.5">
                                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                                    Team 1
                                                                </label>
                                                                <div className="relative">
                                                                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                                    <select
                                                                        value={formData.team1Id}
                                                                        onChange={(e) => setFormData(prev => ({ ...prev, team1Id: e.target.value }))}
                                                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 transition-all appearance-none"
                                                                        style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                                        required
                                                                    >
                                                                        <option value="">Select Team 1...</option>
                                                                        {playoffTeamOptions.map(team => (
                                                                            <option key={team.id} value={team.id} disabled={team.id === formData.team2Id} className="bg-gray-900">
                                                                                {team.shortName} — {team.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                                </div>
                                                                <p className="text-xs text-gray-500 pl-1">Slot hint: {details.team1Label}</p>
                                                                {formData.team1Id && (
                                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-blue-400 pl-1">
                                                                        ✓ {playoffTeamOptions.find(t => t.id === formData.team1Id)?.name}
                                                                    </motion.p>
                                                                )}
                                                            </div>
                                                            <div className="self-center justify-self-center px-3 py-1.5 rounded-full border border-white/10 text-xs font-extrabold text-gray-400" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                                VS
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                                    Team 2
                                                                </label>
                                                                <div className="relative">
                                                                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                                    <select
                                                                        value={formData.team2Id}
                                                                        onChange={(e) => setFormData(prev => ({ ...prev, team2Id: e.target.value }))}
                                                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/15 transition-all appearance-none"
                                                                        style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                                                                        required
                                                                    >
                                                                        <option value="">Select Team 2...</option>
                                                                        {playoffTeamOptions.map(team => (
                                                                            <option key={team.id} value={team.id} disabled={team.id === formData.team1Id} className="bg-gray-900">
                                                                                {team.shortName} — {team.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                                </div>
                                                                <p className="text-xs text-gray-500 pl-1">Slot hint: {details.team2Label}</p>
                                                                {formData.team2Id && (
                                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-rose-400 pl-1">
                                                                        ✓ {playoffTeamOptions.find(t => t.id === formData.team2Id)?.name}
                                                                    </motion.p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {formData.team1Id && formData.team2Id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 6 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="flex items-center justify-center gap-4 p-4 rounded-xl border border-white/10"
                                                                style={{ background: 'rgba(255,255,255,0.03)' }}
                                                            >
                                                                <span className="text-sm font-bold text-blue-300">{playoffTeamOptions.find(t => t.id === formData.team1Id)?.shortName}</span>
                                                                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-white/5 to-white/10 border border-white/15 text-xs font-extrabold text-gray-300">VS</div>
                                                                <span className="text-sm font-bold text-rose-300">{playoffTeamOptions.find(t => t.id === formData.team2Id)?.shortName}</span>
                                                            </motion.div>
                                                        )}
                                                        {formData.team1Id === formData.team2Id && formData.team1Id && (
                                                            <p className="text-xs text-red-400 flex items-center gap-1.5">
                                                                <IconX className="w-3.5 h-3.5" /> Same team selected — please choose different teams
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })()}

                                    <div className="flex justify-end gap-3 pt-4 border-t border-white/8">
                                        <motion.button type="button" onClick={resetForm} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-white/25 text-sm font-medium transition-all"
                                            style={{ background: 'rgba(255,255,255,0.04)' }}
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            type="submit"
                                            disabled={isSubmitting || !selectedPlayoffType || !formData.team1Id || !formData.team2Id || formData.team1Id === formData.team2Id}
                                            whileHover={{ scale: (isSubmitting || !selectedPlayoffType || !formData.team1Id || !formData.team2Id || formData.team1Id === formData.team2Id) ? 1 : 1.03 }}
                                            whileTap={{ scale: (isSubmitting || !selectedPlayoffType || !formData.team1Id || !formData.team2Id || formData.team1Id === formData.team2Id) ? 1 : 0.97 }}
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-bold shadow-md hover:shadow-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                                    Creating…
                                                </>
                                            ) : (
                                                <><Zap className="w-4 h-4" /> Create Playoff Match</>
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </form>
                            </div>
                        </motion.div>
                    )}

                    {/* ── CSV Upload Panel ── */}
                    {showCsvUpload && (
                        <motion.div
                            key="csv-upload-panel"
                            initial={{ opacity: 0, y: -14, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="relative overflow-hidden rounded-2xl mb-8 border border-emerald-500/20"
                            style={{ background: 'linear-gradient(160deg, rgba(5,20,15,0.99) 0%, rgba(5,12,10,0.99) 100%)' }}
                        >
                            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
                            <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-b from-emerald-500/8 to-transparent" />

                            <div className="relative p-6 lg:p-8">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                                            <Upload className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Upload Match Schedule</h2>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Import matches for <span className="text-emerald-400 font-semibold">{currentLeague.toUpperCase()} {selectedSeason}</span> from a CSV or fixture-table PDF
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setShowCsvUpload(false); setCsvRows([]); setCsvFileName(''); }}
                                        className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/8 transition-all">
                                        <XIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Format info + template download */}
                                <div className="mb-5 p-4 rounded-xl border border-white/8 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Supported Formats</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Match No', 'Match Day', 'Date (YYYY-MM-DD)', 'Day', 'Start (7:30PM)', 'Home', 'Away', 'Venue'].map(col => (
                                                <span key={col} className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">{col}</span>
                                            ))}
                                            {['Match', 'Team (Punjab vs Mumbai)', 'Time (IST)', 'Date', 'Stadium/City'].map(col => (
                                                <span key={col} className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">{col}</span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1.5">Accepts official schedule CSVs and fixture-table PDFs. For PDF tables, the team cell can be like <code className="text-gray-400">Punjab vs Mumbai</code>. TBD playoff rows are skipped automatically.</p>
                                    </div>
                                    <button
                                        onClick={downloadCsvTemplate}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-400 hover:text-emerald-200 hover:border-emerald-500/60 text-sm font-semibold transition-all flex-shrink-0"
                                        style={{ background: 'rgba(16,185,129,0.07)' }}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Template
                                    </button>
                                </div>

                                {/* Drop zone */}
                                <div
                                    className="mb-5 relative border-2 border-dashed border-emerald-500/25 hover:border-emerald-500/50 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group"
                                    style={{ background: 'rgba(16,185,129,0.03)' }}
                                    onClick={() => csvInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(16,185,129,0.6)'; }}
                                    onDragLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.style.borderColor = '';
                                        const file = e.dataTransfer.files?.[0];
                                        if (file && (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv' || file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf')) handleCsvFile(file);
                                    }}
                                >
                                    {csvFileName ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileText className="w-8 h-8 text-emerald-400" />
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-white">{csvFileName}</p>
                                                <p className="text-xs text-gray-500">{csvRows.length} rows detected · <span className="text-emerald-400">{csvRows.filter(r => r.valid).length} valid</span>{csvRows.filter(r => !r.valid).length > 0 && <span className="text-red-400"> · {csvRows.filter(r => !r.valid).length} errors</span>}</p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); setCsvRows([]); setCsvFileName(''); }}
                                                className="ml-2 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-emerald-500/50 mx-auto mb-2 group-hover:text-emerald-400 transition-colors" />
                                            <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">Drop your CSV or PDF here or <span className="text-emerald-400 font-semibold">click to browse</span></p>
                                            <p className="text-xs text-gray-600 mt-1">.csv and fixture-table .pdf files supported</p>
                                        </>
                                    )}
                                </div>

                                {/* Preview table */}
                                {csvRows.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mb-5">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preview — {csvRows.length} rows</p>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3.5 h-3.5" />{csvRows.filter(r => r.valid).length} valid</span>
                                                {csvRows.filter(r => !r.valid).length > 0 && (
                                                    <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{csvRows.filter(r => !r.valid).length} errors</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-white/8 overflow-hidden">
                                            <div className="overflow-x-auto max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/30 scrollbar-track-white/5">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold w-8">#</th>
                                                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Date</th>
                                                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Time</th>
                                                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Team 1</th>
                                                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Team 2</th>
                                                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Venue</th>
                                                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Status</th>
                                                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Issues</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {csvRows.map((row) => (
                                                            <tr
                                                                key={row.rowNum}
                                                                className={`border-b border-white/5 last:border-0 ${
                                                                    row.valid
                                                                        ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                                                        : 'bg-red-500/8 hover:bg-red-500/12'
                                                                }`}
                                                            >
                                                                <td className="px-3 py-2 text-gray-600">{row.rowNum}</td>
                                                                <td className="px-3 py-2 text-gray-300 font-mono">{row.date || <span className="text-red-400">—</span>}</td>
                                                                <td className="px-3 py-2 text-gray-300 font-mono">{row.time || <span className="text-red-400">—</span>}</td>
                                                                <td className="px-3 py-2">
                                                                    {row.team1Id
                                                                        ? <span className="text-emerald-300 font-semibold">{teams.find(t => t.id === row.team1Id)?.shortName ?? row.team1Raw}</span>
                                                                        : <span className="text-red-400">{row.team1Raw || '—'}</span>
                                                                    }
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    {row.team2Id
                                                                        ? <span className="text-emerald-300 font-semibold">{teams.find(t => t.id === row.team2Id)?.shortName ?? row.team2Raw}</span>
                                                                        : <span className="text-red-400">{row.team2Raw || '—'}</span>
                                                                    }
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-300 max-w-[180px] truncate" title={row.venue}>{row.venue || <span className="text-red-400">—</span>}</td>
                                                                <td className="px-3 py-2">
                                                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                                                        row.status === 'live' ? 'bg-red-500/15 text-red-300' :
                                                                        row.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' :
                                                                        row.status === 'cancelled' ? 'bg-gray-500/15 text-gray-400' :
                                                                        'bg-blue-500/15 text-blue-300'
                                                                    }`}>{row.status || 'upcoming'}</span>
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    {row.valid
                                                                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                                        : <span className="text-red-400 text-[11px] leading-tight">{row.errors.join(' · ')}</span>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Action row */}
                                <div className="flex items-center justify-between gap-3">
                                    <button
                                        onClick={() => csvInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/25 text-sm font-medium transition-all"
                                        style={{ background: 'rgba(255,255,255,0.04)' }}
                                    >
                                        <FileText className="w-4 h-4" />
                                        {csvFileName ? 'Change File' : 'Select File'}
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {csvRows.filter(r => !r.valid).length > 0 && csvRows.filter(r => r.valid).length > 0 && (
                                            <p className="text-xs text-yellow-400/80 hidden sm:block">
                                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                                                Only valid rows will be imported
                                            </p>
                                        )}
                                        <motion.button
                                            onClick={handleCsvImport}
                                            disabled={csvImporting || csvRows.filter(r => r.valid).length === 0}
                                            whileHover={{ scale: (csvImporting || csvRows.filter(r => r.valid).length === 0) ? 1 : 1.03 }}
                                            whileTap={{ scale: (csvImporting || csvRows.filter(r => r.valid).length === 0) ? 1 : 0.97 }}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-sm font-bold shadow-md hover:shadow-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {csvImporting ? (
                                                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Importing…</>
                                            ) : (
                                                <><Upload className="w-4 h-4" />Import {csvRows.filter(r => r.valid).length > 0 ? `${csvRows.filter(r => r.valid).length} Match${csvRows.filter(r => r.valid).length !== 1 ? 'es' : ''}` : 'Matches'}</>
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'grid' ? (
                        // Grid View (Card-based)
                        <div className="space-y-6">
                            {/* Bulk Operations Toolbar */}
                            {selectedMatches.size > 0 && (
                                <BulkOperationsToolbar
                                    selectedCount={selectedMatches.size}
                                    totalCount={filteredMatches.length}
                                    onSelectAll={toggleSelectAll}
                                    onDeselectAll={clearSelection}
                                    onBulkEdit={() => setShowBulkEditModal(true)}
                                    onBulkDelete={() => setShowBulkDeleteModal(true)}
                                    onBulkExport={() => {
                                        const format = prompt('Select export format:\n1. CSV\n2. JSON\n3. Excel\n4. iCal\n\nEnter 1-4:');
                                        if (format === '1') {
                                            handleBulkExport('csv');
                                        } else if (format === '2') {
                                            handleBulkExport('json');
                                        } else if (format === '3') {
                                            handleBulkExport('excel');
                                        } else if (format === '4') {
                                            handleBulkExport('ical');
                                        }
                                    }}
                                    onBulkStatusUpdate={(status) => handleBulkStatusUpdate(status as 'upcoming' | 'live' | 'completed')}
                                    statusOptions={[
                                        { value: 'upcoming', label: 'Set to Scheduled' },
                                        { value: 'live', label: 'Set to Live' },
                                        { value: 'completed', label: 'Set to Completed' }
                                    ]}
                                    showSelectAll={true}
                                />
                            )}

                            {/* Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredMatches.map((match, index) => (
                                    <ModernMatchCard
                                        key={match.id}
                                        match={match}
                                        index={index}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onExportCalendar={(m) => {
                                            const [hours, minutes] = m.time.split(':');
                                            const startDate = new Date(m.date);
                                            startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                            const endDate = new Date(startDate);
                                            endDate.setHours(endDate.getHours() + 3);
                                            const event: CalendarEvent = {
                                                title: `${m.team1.shortName} vs ${m.team2.shortName}`,
                                                description: `${currentLeague.toUpperCase()} 2026 Match\\nVenue: ${m.venue}\\nStatus: ${m.status}`,
                                                location: m.venue,
                                                startDate,
                                                endDate,
                                            };
                                            exportToICal([event], `match_${m.id}.ics`);
                                            showSuccess('Match exported to iCal file');
                                        }}
                                        isSelected={selectedMatches.has(match.id)}
                                        onSelect={toggleSelectMatch}
                                        isSubmitting={isSubmitting}
                                        onMarkCompleted={handleMarkAsCompleted}
                                        onMarkCancelled={handleMarkAsCancelled}
                                    />
                                ))}
                            </div>

                            {filteredMatches.length === 0 && (
                                <EmptyStateIllustration
                                    type="matches"
                                    title="No matches found"
                                    description={
                                        Object.values(filters).some(v => v !== 'all' && v !== '') || searchQuery.trim()
                                            ? "Try adjusting your filters or search query to see more matches."
                                            : "Get started by creating your first match."
                                    }
                                    action={
                                        Object.values(filters).some(v => v !== 'all' && v !== '') || searchQuery.trim()
                                            ? {
                                                label: "Clear Filters",
                                                onClick: () => {
                                                    setFilters({ status: 'all', dateFrom: '', dateTo: '', team: 'all', venue: 'all' });
                                                    setSearchQuery('');
                                                }
                                            }
                                            : {
                                                label: "Create Match",
                                                onClick: () => setShowForm(true)
                                            }
                                    }
                                />
                            )}
                        </div>
                    ) : viewMode === 'table' ? (
                        // Table View
                        <div className="glass-effect rounded-xl overflow-hidden border border-white/10">
                            <BulkOperationsToolbar
                                selectedCount={selectedMatches.size}
                                totalCount={filteredMatches.length}
                                onSelectAll={toggleSelectAll}
                                onDeselectAll={clearSelection}
                                onBulkEdit={() => setShowBulkEditModal(true)}
                                onBulkDelete={() => setShowBulkDeleteModal(true)}
                                onBulkExport={() => {
                                    // Show export format menu
                                    const format = prompt('Select export format:\n1. CSV\n2. JSON\n3. Excel\n4. iCal\n\nEnter 1-4:');
                                    if (format === '1') {
                                        handleBulkExport('csv');
                                    } else if (format === '2') {
                                        handleBulkExport('json');
                                    } else if (format === '3') {
                                        handleBulkExport('excel');
                                    } else if (format === '4') {
                                        handleBulkExport('ical');
                                    }
                                }}
                                onBulkStatusUpdate={(status) => handleBulkStatusUpdate(status as 'upcoming' | 'live' | 'completed')}
                                statusOptions={[
                                    { value: 'upcoming', label: 'Set to Scheduled' },
                                    { value: 'live', label: 'Set to Live' },
                                    { value: 'completed', label: 'Set to Completed' }
                                ]}
                                showSelectAll={true}
                            />
                            <div className="overflow-x-auto">
                                <table className="w-full" style={{ tableLayout: 'auto', minWidth: '1000px' }}>
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-4 py-4 text-left" style={{ width: '48px' }}>
                                                <button
                                                    onClick={toggleSelectAll}
                                                    className="flex items-center"
                                                    title={selectedMatches.size === filteredMatches.length ? 'Deselect All' : 'Select All'}
                                                >
                                                    {selectedMatches.size === filteredMatches.length && filteredMatches.length > 0 ? (
                                                        <CheckSquare className="w-5 h-5 text-ipl-gold" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                                                Match #
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" style={{ width: '160px', minWidth: '160px' }}>
                                                Date & Time
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" style={{ minWidth: '350px' }}>
                                                Match
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" style={{ width: '180px', minWidth: '180px' }}>
                                                Venue
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" style={{ width: '200px', minWidth: '200px' }}>
                                                Status
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" style={{ width: '180px', minWidth: '180px' }}>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredMatches.map((match, index) => (
                                            <motion.tr 
                                                key={match.id} 
                                                className="hover:bg-white/5 transition-colors"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03, duration: 0.3 }}
                                                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                            >
                                                <td className="px-4 py-4" style={{ width: '48px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMatches.has(match.id)}
                                                        onChange={() => toggleSelectMatch(match.id)}
                                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-ipl-gold focus:ring-ipl-gold/20 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap" style={{ width: '120px' }}>
                                                    <div className="text-sm font-bold text-ipl-gold">
                                                        {getMatchNumberDisplay(match, matches)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap" style={{ width: '160px' }}>
                                                    <div className="text-sm text-white font-medium">{formatDate(match.date)}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {(() => {
                                                            const local = formatTimeLocal(match.time, match.date);
                                                            return local ? (
                                                                <span title={formatTimeIST(match.time)}>
                                                                    {local.localStr} <span className="text-gray-600">{local.tzAbbr}</span>
                                                                    <span className="ml-1 text-[10px] text-gray-600">({formatTimeIST(match.time)})</span>
                                                                </span>
                                                            ) : (
                                                                <span>{formatTimeIST(match.time)}</span>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4" style={{ minWidth: '350px' }}>
                                                    {/* WPL Playoff Helper Text */}
                                                    {match.league === 'wpl' && match.playoffType && 
                                                     (String(match.team1.id).includes('tbd-') || String(match.team2.id).includes('tbd-') || 
                                                      match.team1.shortName?.includes('Place') || match.team2.shortName?.includes('Place') ||
                                                      match.team1.shortName === 'Winner of Eliminator' || match.team2.shortName === 'Winner of Eliminator') && (
                                                        <div className="mb-2">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30" title="Placeholder from 5 WPL teams based on points table">
                                                                💡 Placeholder
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {(() => {
                                                                // Check if it's a TBD team by ID, shortName, or name
                                                                // Also check for teams 16, 17, 18, 19 which are placeholder teams
                                                                const isPlaceholderTeam = 
                                                                    String(match.team1.id).includes('tbd-') || 
                                                                    String(match.team1.id) === '16' || 
                                                                    String(match.team1.id) === '17' || 
                                                                    String(match.team1.id) === '18' || 
                                                                    String(match.team1.id) === '19' ||
                                                                    match.team1.shortName === 'TBD' || 
                                                                    match.team1.shortName?.includes('Place') || 
                                                                    match.team1.name?.includes('Place Team');
                                                                
                                                                if (isPlaceholderTeam) {
                                                                    return (
                                                                        <Image 
                                                                            src="/logos/tba_logo.svg" 
                                                                            alt="TBA" 
                                                                            width={32}
                                                                            height={32}
                                                                            className="object-contain"
                                                                        />
                                                                    );
                                                                }
                                                                
                                                                // ALWAYS prioritize team.logo first (especially for TBA/TBD teams)
                                                                if (match.team1.logo && match.team1.logo.trim() !== '') {
                                                                    // Check for TBA logo
                                                                    if (match.team1.logo.includes('tba_logo.svg')) {
                                                                        return (
                                                                            <Image 
                                                                                src={match.team1.logo} 
                                                                                alt="TBA" 
                                                                                width={32}
                                                                                height={32}
                                                                                className="object-contain"
                                                                            />
                                                                        );
                                                                    }
                                                                    // If team has a logo, use it directly (unless it's a special case)
                                                                    if (!match.team1.logo.endsWith('.json') && !match.team1.logo.includes('rcb_logo_premium.svg')) {
                                                                        return (
                                                                            <Image 
                                                                                src={match.team1.logo} 
                                                                                alt={match.team1.shortName || match.team1.name} 
                                                                                width={32}
                                                                                height={32}
                                                                                className="object-contain"
                                                                                onError={(e) => {
                                                                                    // Fallback to animated path if team.logo fails
                                                                                    const team1League = match.team1.league || match.league || 'ipl';
                                                                                    const animatedPath = getAnimatedLogoPath(match.team1.id, match.team1.shortName || '', team1League);
                                                                                    (e.target as HTMLImageElement).src = animatedPath;
                                                                                }}
                                                                            />
                                                                        );
                                                                    }
                                                                }
                                                                
                                                                // Fallback to animated logo path
                                                                const team1League = match.team1.league || match.league || 'ipl';
                                                                const animatedPath = getAnimatedLogoPath(match.team1.id, match.team1.shortName || '', team1League);
                                                                
                                                                if (animatedPath.endsWith('rcb_logo_premium.svg')) {
                                                                    return (
                                                              <div className="w-8 h-8 flex items-center justify-center">
                                                                <RCBLionLogo className="w-8 h-8" />
                                                              </div>
                                                                    );
                                                                }
                                                                if (animatedPath.endsWith('.json')) {
                                                                    return (
                                                                        <div className="w-8 h-8 flex items-center justify-center">
                                                                            <RCBLottie className="w-8 h-8" />
                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <Image 
                                                                        src={animatedPath} 
                                                                        alt={match.team1.shortName || match.team1.name} 
                                                                        width={32}
                                                                        height={32}
                                                                        className="object-contain"
                                                                        onError={(e) => {
                                                                            // Fallback to default logo
                                                                            const fallback = getLogoPath(match.team1.id);
                                                                            (e.target as HTMLImageElement).src = fallback;
                                                                        }}
                                                                    />
                                                                );
                                                            })()}
                                                            <span className="text-white font-semibold whitespace-nowrap">
                                                                {(String(match.team1.id).includes('tbd-') || 
                                                                  String(match.team1.id) === '16' || 
                                                                  String(match.team1.id) === '17' || 
                                                                  String(match.team1.id) === '18' || 
                                                                  String(match.team1.id) === '19' ||
                                                                  match.team1.shortName?.includes('Place') || 
                                                                  match.team1.name?.includes('Place Team')) 
                                                                    ? 'TBD' 
                                                                    : match.team1.shortName}
                                                            </span>
                                                        </div>
                                                        <span className="text-gray-500 font-bold mx-2 flex-shrink-0 whitespace-nowrap">vs</span>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {(() => {
                                                                // Check if it's a TBD team by ID, shortName, or name
                                                                // Also check for teams 16, 17, 18, 19 which are placeholder teams
                                                                const isPlaceholderTeam = 
                                                                    String(match.team2.id).includes('tbd-') || 
                                                                    String(match.team2.id) === '16' || 
                                                                    String(match.team2.id) === '17' || 
                                                                    String(match.team2.id) === '18' || 
                                                                    String(match.team2.id) === '19' ||
                                                                    match.team2.shortName === 'TBD' || 
                                                                    match.team2.shortName?.includes('Place') || 
                                                                    match.team2.name?.includes('Place Team');
                                                                
                                                                if (isPlaceholderTeam) {
                                                                    return (
                                                                        <Image 
                                                                            src="/logos/tba_logo.svg" 
                                                                            alt="TBA" 
                                                                            width={32}
                                                                            height={32}
                                                                            className="object-contain"
                                                                        />
                                                                    );
                                                                }
                                                                
                                                                // ALWAYS prioritize team.logo first (especially for TBA/TBD teams)
                                                                if (match.team2.logo && match.team2.logo.trim() !== '') {
                                                                    // Check for TBA logo
                                                                    if (match.team2.logo.includes('tba_logo.svg')) {
                                                                        return (
                                                                            <Image 
                                                                                src={match.team2.logo} 
                                                                                alt="TBA" 
                                                                                width={32}
                                                                                height={32}
                                                                                className="object-contain"
                                                                            />
                                                                        );
                                                                    }
                                                                    // If team has a logo, use it directly (unless it's a special case)
                                                                    if (!match.team2.logo.endsWith('.json') && !match.team2.logo.includes('rcb_logo_premium.svg')) {
                                                                        return (
                                                                            <Image 
                                                                                src={match.team2.logo} 
                                                                                alt={match.team2.shortName || match.team2.name} 
                                                                                width={32}
                                                                                height={32}
                                                                                className="object-contain"
                                                                                onError={(e) => {
                                                                                    // Fallback to animated path if team.logo fails
                                                                                    const team2League = match.team2.league || match.league || 'ipl';
                                                                                    const animatedPath = getAnimatedLogoPath(match.team2.id, match.team2.shortName || '', team2League);
                                                                                    (e.target as HTMLImageElement).src = animatedPath;
                                                                                }}
                                                                            />
                                                                        );
                                                                    }
                                                                }
                                                                
                                                                // Fallback to animated logo path
                                                                const team2League = match.team2.league || match.league || 'ipl';
                                                                const animatedPath = getAnimatedLogoPath(match.team2.id, match.team2.shortName || '', team2League);
                                                                
                                                                if (animatedPath.endsWith('rcb_logo_premium.svg')) {
                                                                    return (
                                                              <div className="w-8 h-8 flex items-center justify-center">
                                                                <RCBLionLogo className="w-8 h-8" />
                                                              </div>
                                                                    );
                                                                }
                                                                if (animatedPath.endsWith('.json')) {
                                                                    return (
                                                                        <div className="w-8 h-8 flex items-center justify-center">
                                                                            <RCBLottie className="w-8 h-8" />
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <Image 
                                                                        src={animatedPath} 
                                                                        alt={match.team2.shortName || match.team2.name} 
                                                                        width={32}
                                                                        height={32}
                                                                        className="object-contain"
                                                                        onError={(e) => {
                                                                            // Fallback to default logo
                                                                            const fallback = getLogoPath(match.team2.id);
                                                                            (e.target as HTMLImageElement).src = fallback;
                                                                        }}
                                                                    />
                                                                );
                                                            })()}
                                                            <span className="text-white font-semibold whitespace-nowrap">
                                                                {(String(match.team2.id).includes('tbd-') || 
                                                                  String(match.team2.id) === '16' || 
                                                                  String(match.team2.id) === '17' || 
                                                                  String(match.team2.id) === '18' || 
                                                                  String(match.team2.id) === '19' ||
                                                                  match.team2.shortName?.includes('Place') || 
                                                                  match.team2.name?.includes('Place Team')) 
                                                                    ? 'TBD' 
                                                                    : match.team2.shortName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4" style={{ width: '180px' }}>
                                                    <div className="text-sm text-gray-300 truncate" title={match.venue}>
                                                        {match.venue}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4" style={{ width: '200px' }}>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {getStatusBadge(match.status)}
                                                        <div className="flex items-center gap-1 flex-wrap">
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={match.status === 'completed'}
                                                                    onChange={() => {
                                                                        if (match.status === 'completed') {
                                                                            // Uncheck - revert to automatic status
                                                                            const [hours, minutes] = match.time.split(':').map(Number);
                                                                            const matchDate = new Date(match.date);
                                                                            matchDate.setHours(hours, minutes || 0, 0, 0);
                                                                            const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
                                                                            const now = new Date();
                                                                            const newStatus = now >= thirtyMinutesBefore ? 'live' : 'upcoming';
                                                                            handleBulkStatusUpdate(newStatus);
                                                                        } else {
                                                                            handleMarkAsCompleted(match.id);
                                                                        }
                                                                    }}
                                                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/20 cursor-pointer"
                                                                    disabled={isSubmitting}
                                                                />
                                                                <span className="text-xs text-gray-400 group-hover:text-green-400 transition-colors">Completed</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={match.status === 'cancelled'}
                                                                    onChange={() => {
                                                                        if (match.status === 'cancelled') {
                                                                            // Uncheck - revert to automatic status
                                                                            const [hours, minutes] = match.time.split(':').map(Number);
                                                                            const matchDate = new Date(match.date);
                                                                            matchDate.setHours(hours, minutes || 0, 0, 0);
                                                                            const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
                                                                            const now = new Date();
                                                                            const newStatus = now >= thirtyMinutesBefore ? 'live' : 'upcoming';
                                                                            handleBulkStatusUpdate(newStatus);
                                                                        } else {
                                                                            handleMarkAsCancelled(match.id);
                                                                        }
                                                                    }}
                                                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500/20 cursor-pointer"
                                                                    disabled={isSubmitting}
                                                                />
                                                                <span className="text-xs text-gray-400 group-hover:text-red-400 transition-colors">Cancelled</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap" style={{ width: '180px' }}>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="relative group">
                                                            <button
                                                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                                disabled={isSubmitting}
                                                                title="Export to Calendar"
                                                            >
                                                                <Calendar className="w-4 h-4" />
                                                            </button>
                                                            <div className="absolute right-0 top-full mt-1 w-56 glass-effect rounded-lg border border-white/10 p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                                                <button
                                                                    onClick={() => handleExportToGoogleCalendar(match)}
                                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2 text-sm"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    <span>Google Calendar</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleExportToOutlookCalendar(match)}
                                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2 text-sm"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    <span>Outlook Calendar</span>
                                                                </button>
                                                                <div className="border-t border-white/10 my-1"></div>
                                                                <button
                                                                    onClick={() => {
                                                                        const [hours, minutes] = match.time.split(':');
                                                                        const startDate = new Date(match.date);
                                                                        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                                        const endDate = new Date(startDate);
                                                                        endDate.setHours(endDate.getHours() + 3);
                                                                        const event: CalendarEvent = {
                                                                            title: `${match.team1.shortName} vs ${match.team2.shortName}`,
                                                                            description: `IPL 2026 Match\\nVenue: ${match.venue}\\nStatus: ${match.status}`,
                                                                            location: match.venue,
                                                                            startDate,
                                                                            endDate,
                                                                        };
                                                                        exportToICal([event], `match_${match.id}.ics`);
                                                                        showSuccess('Match exported to iCal file');
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2 text-sm"
                                                                >
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>Download iCal</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEdit(match)}
                                                            className="p-2 text-ipl-gold hover:bg-ipl-gold/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                            disabled={isSubmitting}
                                                            title="Edit Match"
                                                        >
                                                            <IconEdit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(match.id)}
                                                            disabled={isSubmitting}
                                                            title={(match as any)._isMock ? 'Remove sample match' : 'Delete Match'}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                        >
                                                            <IconTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredMatches.length === 0 && (
                                <EmptyStateIllustration
                                    type="matches"
                                    title="No matches found"
                                    description={
                                        Object.values(filters).some(v => v !== 'all' && v !== '') 
                                            ? "Try adjusting your filters to see more matches."
                                            : "Get started by creating your first match."
                                    }
                                    action={
                                        Object.values(filters).some(v => v !== 'all' && v !== '')
                                            ? {
                                                label: "Clear Filters",
                                                onClick: () => setFilters({ status: 'all', dateFrom: '', dateTo: '', team: 'all', venue: 'all' })
                                            }
                                            : {
                                                label: "Create Match",
                                                onClick: () => setShowForm(true)
                                            }
                                    }
                                />
                            )}
                        </div>
                    ) : viewMode === 'timeline' ? (
                        <div className="space-y-6">
                            {matchesByDate.length > 0 ? (
                                <StaggeredList className="space-y-6" staggerDelay={0.1}>
                            {matchesByDate.map(([date, dateMatches]) => (
                                        <motion.div 
                                            key={date} 
                                            className="rounded-2xl border border-white/10 overflow-hidden"
                                            style={{ background: 'linear-gradient(145deg, rgba(15,20,30,0.92) 0%, rgba(10,12,20,0.96) 100%)' }}
                                            whileHover={{ scale: 1.005 }}
                                        >
                                    <div className="px-6 py-4 border-b border-white/8 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-purple-500/20 border border-white/15 flex-shrink-0">
                                            <span className="text-xs font-bold text-gray-400">{new Date(date + 'T00:00:00').toLocaleDateString('en-US',{month:'short'}).toUpperCase()}</span>
                                            <span className="text-lg font-extrabold text-white leading-none">{new Date(date + 'T00:00:00').getDate()}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white">{formatDate(date)}</h3>
                                            <p className="text-xs text-gray-500">{dateMatches.length} match{dateMatches.length !== 1 ? 'es' : ''}</p>
                                        </div>
                                        <div className="ml-auto h-px flex-1 bg-gradient-to-r from-white/10 to-transparent max-w-xs" />
                                    </div>
                                            <StaggeredList className="divide-y divide-white/5" staggerDelay={0.05}>
                                        {dateMatches.map((match) => (
                                                    <motion.div
                                                key={match.id}
                                                className="px-6 py-4 hover:bg-white/4 transition-all duration-200"
                                                        whileHover={{ x: 2 }}
                                            >
                                                {/* WPL Playoff Helper Text */}
                                                {match.league === 'wpl' && match.playoffType && 
                                                 ((String(match.team1.id).includes('tbd-') || String(match.team1.id) === '16' || String(match.team1.id) === '17' || String(match.team1.id) === '18' || String(match.team1.id) === '19') ||
                                                  (String(match.team2.id).includes('tbd-') || String(match.team2.id) === '16' || String(match.team2.id) === '17' || String(match.team2.id) === '18' || String(match.team2.id) === '19') ||
                                                  match.team1.shortName?.includes('Place') || match.team2.shortName?.includes('Place') ||
                                                  match.team1.shortName === 'Winner of Eliminator' || match.team2.shortName === 'Winner of Eliminator') && (
                                                    <div className="mb-2">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30" title="Placeholder from 5 WPL teams based on points table">
                                                            💡 Placeholder from 5 WPL teams
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-sm text-gray-400 font-medium min-w-[80px]">
                                                            {(() => {
                                                                const local = formatTimeLocal(match.time, match.date);
                                                                return local ? (
                                                                    <span title={formatTimeIST(match.time)}>
                                                                        {local.localStr} <span className="text-gray-500 text-xs">{local.tzAbbr}</span>
                                                                        <div className="text-[10px] text-gray-600 font-normal">{formatTimeIST(match.time)}</div>
                                                                    </span>
                                                                ) : (
                                                                    <span>{formatTimeIST(match.time)}</span>
                                                                );
                                                            })()}
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-2">
                                                                {(() => {
                                                                    // Check if it's a TBD team by ID, shortName, or name
                                                                    // Also check for teams 16, 17, 18, 19 which are placeholder teams
                                                                    const isPlaceholderTeam = 
                                                                        String(match.team1.id).includes('tbd-') || 
                                                                        String(match.team1.id) === '16' || 
                                                                        String(match.team1.id) === '17' || 
                                                                        String(match.team1.id) === '18' || 
                                                                        String(match.team1.id) === '19' ||
                                                                        match.team1.shortName === 'TBD' || 
                                                                        match.team1.shortName?.includes('Place') || 
                                                                        match.team1.name?.includes('Place Team');
                                                                    
                                                                    if (isPlaceholderTeam) {
                                                                        return (
                                                                            <Image 
                                                                                src="/logos/tba_logo.svg" 
                                                                                alt="TBA" 
                                                                                width={40}
                                                                                height={40}
                                                                                className="object-contain"
                                                                            />
                                                                        );
                                                                    }
                                                                    
                                                                    // ALWAYS prioritize team.logo first (especially for TBA/TBD teams)
                                                                    if (match.team1.logo && match.team1.logo.trim() !== '') {
                                                                        // Check for TBA logo
                                                                        if (match.team1.logo.includes('tba_logo.svg')) {
                                                                            return (
                                                                                <Image 
                                                                                    src={match.team1.logo} 
                                                                                    alt="TBA" 
                                                                                    width={40}
                                                                                    height={40}
                                                                                    className="object-contain"
                                                                                />
                                                                            );
                                                                        }
                                                                        // If team has a logo, use it directly (unless it's a special case)
                                                                        if (!match.team1.logo.endsWith('.json') && !match.team1.logo.includes('rcb_logo_premium.svg')) {
                                                                            return (
                                                                                <Image 
                                                                                    src={match.team1.logo} 
                                                                                    alt={match.team1.shortName || match.team1.name} 
                                                                                    width={40}
                                                                                    height={40}
                                                                                    className="object-contain"
                                                                                    onError={(e) => {
                                                                                        // Fallback to animated path if team.logo fails
                                                                                        const team1League = match.team1.league || match.league || 'ipl';
                                                                                        const animatedPath = getAnimatedLogoPath(match.team1.id, match.team1.shortName || '', team1League);
                                                                                        (e.target as HTMLImageElement).src = animatedPath;
                                                                                    }}
                                                                                />
                                                                            );
                                                                        }
                                                                    }
                                                                    
                                                                    // Fallback to animated logo path
                                                                    const team1League = match.team1.league || match.league || 'ipl';
                                                                    const animatedPath = getAnimatedLogoPath(match.team1.id, match.team1.shortName || '', team1League);
                                                                    
                                                                    if (animatedPath.endsWith('rcb_logo_premium.svg')) {
                                                                        return (
                                                                  <div className="w-10 h-10 flex items-center justify-center">
                                                                    <RCBLionLogo className="w-10 h-10" />
                                                                  </div>
                                                                        );
                                                                    }
                                                                    if (animatedPath.endsWith('.json')) {
                                                                        return (
                                                                            <div className="w-10 h-10 flex items-center justify-center">
                                                                                <RCBLottie className="w-10 h-10" />
                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <Image 
                                                                            src={animatedPath} 
                                                                            alt={match.team1.shortName || match.team1.name} 
                                                                            width={40}
                                                                            height={40}
                                                                            className="object-contain"
                                                                            onError={(e) => {
                                                                                // Fallback to default logo
                                                                                const fallback = getLogoPath(match.team1.id);
                                                                                (e.target as HTMLImageElement).src = fallback;
                                                                            }}
                                                                        />
                                                                    );
                                                                })()}
                                                                                                                                <span className="text-white font-bold whitespace-nowrap">
                                                                                                                                        {(String(match.team1.id).includes('tbd-') || 
                                                                                                                                            String(match.team1.id) === '16' || 
                                                                                                                                            String(match.team1.id) === '17' || 
                                                                                                                                            String(match.team1.id) === '18' || 
                                                                                                                                            String(match.team1.id) === '19' ||
                                                                      match.team1.shortName?.includes('Place') || 
                                                                      match.team1.name?.includes('Place Team')) 
                                                                        ? 'TBD' 
                                                                        : match.team1.shortName}
                                                                </span>
                                                            </div>
                                                            <span className="text-gray-500 font-bold text-lg mx-2 flex-shrink-0 whitespace-nowrap">vs</span>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {(() => {
                                                                    // Check if it's a TBD team by ID, shortName, or name
                                                                    // Check if it's a TBD team by ID, shortName, or name
                                                                    // Also check for teams 16, 17, 18, 19 which are placeholder teams
                                                                    const isPlaceholderTeam = 
                                                                        String(match.team2.id).includes('tbd-') || 
                                                                        String(match.team2.id) === '16' || 
                                                                        String(match.team2.id) === '17' || 
                                                                        String(match.team2.id) === '18' || 
                                                                        String(match.team2.id) === '19' ||
                                                                        match.team2.shortName === 'TBD' || 
                                                                        match.team2.shortName?.includes('Place') || 
                                                                        match.team2.name?.includes('Place Team');
                                                                    
                                                                    if (isPlaceholderTeam) {
                                                                        return (
                                                                            <Image 
                                                                                src="/logos/tba_logo.svg" 
                                                                                alt="TBA" 
                                                                                width={40}
                                                                                height={40}
                                                                                className="object-contain"
                                                                            />
                                                                        );
                                                                    }
                                                                    
                                                                    // ALWAYS prioritize team.logo first (especially for TBA/TBD teams)
                                                                    if (match.team2.logo && match.team2.logo.trim() !== '') {
                                                                        // Check for TBA logo
                                                                        if (match.team2.logo.includes('tba_logo.svg')) {
                                                                            return (
                                                                                <Image 
                                                                                    src={match.team2.logo} 
                                                                                    alt="TBA" 
                                                                                    width={40}
                                                                                    height={40}
                                                                                    className="object-contain"
                                                                                />
                                                                            );
                                                                        }
                                                                        // If team has a logo, use it directly (unless it's a special case)
                                                                        if (!match.team2.logo.endsWith('.json') && !match.team2.logo.includes('rcb_logo_premium.svg')) {
                                                                            return (
                                                                                <Image 
                                                                                    src={match.team2.logo} 
                                                                                    alt={match.team2.shortName || match.team2.name} 
                                                                                    width={40}
                                                                                    height={40}
                                                                                    className="object-contain"
                                                                                    onError={(e) => {
                                                                                        // Fallback to animated path if team.logo fails
                                                                                        const team2League = match.team2.league || match.league || 'ipl';
                                                                                        const animatedPath = getAnimatedLogoPath(match.team2.id, match.team2.shortName || '', team2League);
                                                                                        (e.target as HTMLImageElement).src = animatedPath;
                                                                                    }}
                                                                                />
                                                                            );
                                                                        }
                                                                    }
                                                                    
                                                                    // Fallback to animated logo path
                                                                    const team2League = match.team2.league || match.league || 'ipl';
                                                                    const animatedPath = getAnimatedLogoPath(match.team2.id, match.team2.shortName || '', team2League);
                                                                    
                                                                    if (animatedPath.endsWith('rcb_logo_premium.svg')) {
                                                                        return (
                                                                  <div className="w-10 h-10 flex items-center justify-center">
                                                                    <RCBLionLogo className="w-10 h-10" />
                                                                  </div>
                                                                        );
                                                                    }
                                                                    if (animatedPath.endsWith('.json')) {
                                                                        return (
                                                                            <div className="w-10 h-10 flex items-center justify-center">
                                                                                <RCBLottie className="w-10 h-10" />
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <Image 
                                                                            src={animatedPath} 
                                                                            alt={match.team2.shortName || match.team2.name} 
                                                                            width={40}
                                                                            height={40}
                                                                            className="object-contain"
                                                                            onError={(e) => {
                                                                                // Fallback to default logo
                                                                                const fallback = getLogoPath(match.team2.id);
                                                                                (e.target as HTMLImageElement).src = fallback;
                                                                            }}
                                                                        />
                                                                    );
                                                                })()}
                                                                                                                                <span className="text-white font-bold whitespace-nowrap">
                                                                                                                                        {(String(match.team2.id).includes('tbd-') || 
                                                                                                                                            String(match.team2.id) === '16' || 
                                                                                                                                            String(match.team2.id) === '17' || 
                                                                                                                                            String(match.team2.id) === '18' || 
                                                                                                                                            String(match.team2.id) === '19' ||
                                                                      match.team2.shortName?.includes('Place') || 
                                                                      match.team2.name?.includes('Place Team')) 
                                                                        ? 'TBD' 
                                                                        : match.team2.shortName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                            <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                                                            <span className="truncate max-w-[180px]">{match.venue.split(',')[0]}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {getStatusBadge(match.status)}
                                                            <div className="flex items-center gap-2 ml-2">
                                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={match.status === 'completed'}
                                                                        onChange={() => {
                                                                            if (match.status === 'completed') {
                                                                                const [hours, minutes] = match.time.split(':').map(Number);
                                                                                const matchDate = new Date(match.date);
                                                                                matchDate.setHours(hours, minutes || 0, 0, 0);
                                                                                const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
                                                                                const now = new Date();
                                                                                const newStatus = now >= thirtyMinutesBefore ? 'live' : 'upcoming';
                                                                                handleBulkStatusUpdate(newStatus);
                                                                            } else {
                                                                                handleMarkAsCompleted(match.id);
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/20 cursor-pointer"
                                                                        disabled={isSubmitting}
                                                                    />
                                                                    <span className="text-xs text-gray-500 group-hover:text-green-400 transition-colors">Done</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={match.status === 'cancelled'}
                                                                        onChange={() => {
                                                                            if (match.status === 'cancelled') {
                                                                                const [hours, minutes] = match.time.split(':').map(Number);
                                                                                const matchDate = new Date(match.date);
                                                                                matchDate.setHours(hours, minutes || 0, 0, 0);
                                                                                const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
                                                                                const now = new Date();
                                                                                const newStatus = now >= thirtyMinutesBefore ? 'live' : 'upcoming';
                                                                                handleBulkStatusUpdate(newStatus);
                                                                            } else {
                                                                                handleMarkAsCancelled(match.id);
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500/20 cursor-pointer"
                                                                        disabled={isSubmitting}
                                                                    />
                                                                    <span className="text-xs text-gray-500 group-hover:text-red-400 transition-colors">Cancelled</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleEdit(match)}
                                                                className="p-1.5 text-yellow-500/80 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all duration-200"
                                                                title="Edit"
                                                            >
                                                                <IconEdit className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(match.id)}
                                                                disabled={isSubmitting}
                                                                title={(match as any)._isMock ? 'Remove sample match' : 'Delete Match'}
                                                                className="p-1.5 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                                                            >
                                                                <IconTrash className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                    </motion.div>
                                                ))}
                                            </StaggeredList>
                                        </motion.div>
                                    ))}
                                </StaggeredList>
                            ) : (
                                <EmptyStateIllustration
                                    type="matches"
                                    title="No matches found"
                                    description={
                                        Object.values(filters).some(v => v !== 'all' && v !== '') 
                                            ? "Try adjusting your filters to see more matches."
                                            : "Get started by creating your first match."
                                    }
                                    action={
                                        Object.values(filters).some(v => v !== 'all' && v !== '')
                                            ? {
                                                label: "Clear Filters",
                                                onClick: () => setFilters({ status: 'all', dateFrom: '', dateTo: '', team: 'all', venue: 'all' })
                                            }
                                            : {
                                                label: "Create Match",
                                                onClick: () => setShowForm(true)
                                            }
                                    }
                                />
                            )}
                        </div>
                    ) : (
                        // Analytics View
                        <div className="space-y-6">
                            {/* Statistics Dashboard */}
                            <div className="glass-effect rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <TrendingUp className="w-6 h-6 text-ipl-gold" />
                                    <h2 className="text-2xl font-bold text-white">Statistics Dashboard</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <motion.div 
                                        className="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">Total Matches</div>
                                        <div className="text-2xl font-bold text-white">{statisticsData.totalMatches}</div>
                                    </motion.div>
                                    <motion.div 
                                        className="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">Avg per Day</div>
                                        <div className="text-2xl font-bold text-blue-400">{statisticsData.avgMatchesPerDay}</div>
                                    </motion.div>
                                    <motion.div 
                                        className="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">This Week</div>
                                        <div className="text-2xl font-bold text-purple-400">{statisticsData.upcomingThisWeek}</div>
                                    </motion.div>
                                    <motion.div 
                                        className="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">Completed %</div>
                                        <div className="text-2xl font-bold text-green-400">{statisticsData.completedPercentage}%</div>
                                    </motion.div>
                                    <motion.div 
                                        className="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">Top Team</div>
                                        <div className="text-lg font-bold text-ipl-gold">
                                            {statisticsData.matchesPerTeam[0]?.team || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {statisticsData.matchesPerTeam[0]?.count || 0} matches
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Interactive Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <InteractiveChart
                                    data={matchesByStatusChart}
                                    type="bar"
                                    title="Matches by Status"
                                    height={250}
                                />
                                <InteractiveChart
                                    data={matchesByMonthChart}
                                    type="bar"
                                    title="Matches by Month"
                                    height={250}
                                />
                                <InteractiveChart
                                    data={matchesByVenueChart}
                                    type="bar"
                                    title="Top 10 Venues"
                                    height={250}
                                />
                                <InteractiveChart
                                    data={matchesByTeamChart}
                                    type="bar"
                                    title="Matches by Team Participation"
                                    height={250}
                                />
                                </div>

                            {/* Team Match Matrix */}
                            <div className="glass-effect rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <Grid3x3 className="w-6 h-6 text-ipl-gold" />
                                    <h2 className="text-2xl font-bold text-white">Team Match Matrix</h2>
                                    <p className="text-sm text-gray-400 ml-auto">Click to filter matches</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <div className="inline-block min-w-full">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase border-b border-white/10"></th>
                                                    {teams.map(team => (
                                                        <th 
                                                            key={team.id}
                                                            className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase border-b border-white/10 min-w-[80px]"
                                                        >
                                                            {team.shortName}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teams.map(team1 => (
                                                    <tr key={team1.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-semibold text-white border-r border-white/10">
                                                            {team1.shortName}
                                                        </td>
                                                        {teams.map(team2 => (
                                                            <td 
                                                                key={team2.id}
                                                                className="px-4 py-3 text-center border-r border-white/10 last:border-r-0"
                                                            >
                                                                {team1.id === team2.id ? (
                                                                    <span className="text-gray-600">-</span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            const team1Matches = matches.filter(m => 
                                                                                (m.team1.id === team1.id && m.team2.id === team2.id) ||
                                                                                (m.team1.id === team2.id && m.team2.id === team1.id)
                                                                            );
                                                                            if (team1Matches.length > 0) {
                                                                                setFilters({ ...filters, team: team1.id });
                                                                                setViewMode('table');
                                                                            }
                                                                        }}
                                                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                                                            teamMatchMatrix[team1.id]?.[team2.id] > 0
                                                                                ? 'bg-ipl-gold/20 text-ipl-gold hover:bg-ipl-gold/30 cursor-pointer'
                                                                                : 'text-gray-600 cursor-default'
                                                                        }`}
                                                                    >
                                                                        {teamMatchMatrix[team1.id]?.[team2.id] || 0}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                        </div>
                                </div>
                            </div>

                            {/* Venue Heatmap */}
                            <div className="glass-effect rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <MapPin className="w-6 h-6 text-ipl-gold" />
                                    <h2 className="text-2xl font-bold text-white">Venue Distribution</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {venues.slice(0, 12).map(venue => {
                                        const venueMatches = matches.filter(m => m.venue === venue);
                                        const count = venueMatches.length;
                                        const intensity = Math.min(1, count / 10); // Normalize to 0-1
                                        return (
                                            <motion.button
                                                key={venue}
                                                onClick={() => {
                                                    setFilters({ ...filters, venue });
                                                    setViewMode('table');
                                                }}
                                                className="glass-effect rounded-lg p-4 text-left hover:bg-white/10 transition-all border border-white/10"
                                                whileHover={{ scale: 1.05 }}
                                                style={{
                                                    backgroundColor: `rgba(255, 215, 0, ${intensity * 0.2})`,
                                                    borderColor: `rgba(255, 215, 0, ${intensity * 0.5})`
                                                }}
                                            >
                                                <div className="text-sm font-semibold text-white mb-1 truncate">
                                                    {venue.split(',')[0]}
                                                </div>
                                                <div className="text-xs text-gray-400 mb-2">
                                                    {venue.split(',')[1]?.trim() || ''}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-bold text-ipl-gold">{count}</span>
                                                    <span className="text-xs text-gray-400">matches</span>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Match Calendar View */}
                            <div className="glass-effect rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <CalendarIcon className="w-6 h-6 text-ipl-gold" />
                                    <h2 className="text-2xl font-bold text-white">Match Calendar</h2>
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                                            {day}
                                        </div>
                                    ))}
                                    {(() => {
                                        const calendarDays: JSX.Element[] = [];
                                        const now = new Date();
                                        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                                        const startDate = new Date(firstDay);
                                        startDate.setDate(startDate.getDate() - startDate.getDay());

                                        for (let i = 0; i < 42; i++) {
                                            const currentDate = new Date(startDate);
                                            currentDate.setDate(startDate.getDate() + i);
                                            const dateStr = currentDate.toISOString().split('T')[0];
                                            const dayMatches = matches.filter(m => m.date === dateStr);
                                            const isCurrentMonth = currentDate.getMonth() === now.getMonth();
                                            
                                            calendarDays.push(
                                                <motion.button
                                                    key={i}
                                                    onClick={() => {
                                                        if (dayMatches.length > 0) {
                                                            setFilters({ ...filters, dateFrom: dateStr, dateTo: dateStr });
                                                            setViewMode('table');
                                                        }
                                                    }}
                                                    className={`p-2 rounded-lg text-sm transition-all ${
                                                        !isCurrentMonth 
                                                            ? 'text-gray-600' 
                                                            : dayMatches.length > 0
                                                            ? 'bg-ipl-gold/20 text-ipl-gold border border-ipl-gold/30 hover:bg-ipl-gold/30'
                                                            : 'text-gray-400 hover:bg-white/5'
                                                    }`}
                                                    whileHover={dayMatches.length > 0 ? { scale: 1.1 } : {}}
                                                    disabled={dayMatches.length === 0}
                                                >
                                                    <div>{currentDate.getDate()}</div>
                                                    {dayMatches.length > 0 && (
                                                        <div className="text-xs mt-1 font-bold">{dayMatches.length}</div>
                                                    )}
                                                </motion.button>
                                            );
                                        }
                                        return calendarDays;
                                    })()}
                </div>
            </div>
                        </div>
                    )}

                    {/* Bulk Edit Modal */}
                    <BulkEditModal
                        isOpen={showBulkEditModal}
                        onClose={() => setShowBulkEditModal(false)}
                        onSave={handleBulkEdit}
                        selectedCount={selectedMatches.size}
                        title="Bulk Edit Matches"
                        fields={[
                            {
                                name: 'status',
                                label: 'Status',
                                type: 'select',
                                options: [
                                    { value: 'upcoming', label: 'Scheduled' },
                                    { value: 'live', label: 'Live' },
                                    { value: 'completed', label: 'Completed' }
                                ]
                            },
                            {
                                name: 'venue',
                                label: 'Venue',
                                type: 'text',
                                placeholder: 'Enter new venue...'
                            },
                            {
                                name: 'dateShift',
                                label: 'Date Shift (days)',
                                type: 'number',
                                placeholder: 'e.g., 2 for +2 days, -1 for -1 day'
                            }
                        ]}
                    />

                    {/* Bulk Delete Modal */}
                    <BatchDeleteModal
                        isOpen={showBulkDeleteModal}
                        onClose={() => setShowBulkDeleteModal(false)}
                        onConfirm={handleBulkDelete}
                        itemCount={selectedMatches.size}
                        itemType="matches"
                        warningMessage="All match data, including scores and statistics, will be permanently deleted."
                    />
                </div>
            </PageTransition>
        </div>
    );
}
