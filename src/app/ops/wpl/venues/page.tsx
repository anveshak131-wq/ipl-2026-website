'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  Activity, 
  ShieldCheck, 
  X,
  Check,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter
} from "lucide-react";

export interface WPLVenue {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  capacity: string;
  category: "WPL Active Hub" | "Emerging / High Potential" | "Premier BCCI International";
  activeInCurrentSeason: boolean;
  clusterStage?: string;
  curator: string;
  activePitch: string;
  soilType: "Red Soil" | "Black Soil" | "Hybrid Clay" | "Alluvial / Silt";
  boundaryDimensions: { off: number; leg: number; straight: number };
  pitchCharacteristics: {
    paceBias: number;
    spinBias: number;
    avgFirstInnings: number;
    chaseWinPct: number;
    description: string;
  };
  groundStatus: "Ready" | "Inspection" | "Maintenance" | "Under Construction";
  drainageSystem: string;
}

const ALL_INDIAN_INTERNATIONAL_VENUES: WPLVenue[] = [
  // --- WPL Active / Historic Caravan Hubs ---
  {
    id: "dy-patil",
    name: "Dr. DY Patil Sports Academy",
    shortName: "DY Patil",
    city: "Navi Mumbai",
    state: "Maharashtra",
    capacity: "45,300",
    category: "WPL Active Hub",
    activeInCurrentSeason: true,
    clusterStage: "2026 Leg 1 (Matches 1–11)",
    curator: "Vishal Sawant",
    activePitch: "Center Strip #4",
    soilType: "Red Soil",
    boundaryDimensions: { off: 55, leg: 56, straight: 64 },
    pitchCharacteristics: {
      paceBias: 58,
      spinBias: 42,
      avgFirstInnings: 172,
      chaseWinPct: 62,
      description: "True bounce, high outfield velocity, heavy late-evening dew favoring teams chasing.",
    },
    groundStatus: "Ready",
    drainageSystem: "Sub-surface trench drains + 2 Super Soppers",
  },
  {
    id: "kotambi",
    name: "Baroda Cricket Association Stadium, Kotambi",
    shortName: "BCA Kotambi",
    city: "Vadodara",
    state: "Gujarat",
    capacity: "35,000",
    category: "WPL Active Hub",
    activeInCurrentSeason: true,
    clusterStage: "2026 Leg 2 & Playoffs (Final)",
    curator: "Ketan Trivedi",
    activePitch: "Pitch #3",
    soilType: "Black Soil",
    boundaryDimensions: { off: 54, leg: 55, straight: 62 },
    pitchCharacteristics: {
      paceBias: 40,
      spinBias: 60,
      avgFirstInnings: 161,
      chaseWinPct: 70,
      description: "Gripping turn for finger and wrist spinners. Staged the 2026 final with RCB-W chasing 204.",
    },
    groundStatus: "Ready",
    drainageSystem: "Modern sand-based drainage system",
  },
  {
    id: "chinnaswamy",
    name: "M. Chinnaswamy Stadium",
    shortName: "Chinnaswamy",
    city: "Bengaluru",
    state: "Karnataka",
    capacity: "35,000",
    category: "WPL Active Hub",
    activeInCurrentSeason: false,
    clusterStage: "2024 Opening Leg Hub",
    curator: "Prashanth Rao",
    activePitch: "Pitch #5",
    soilType: "Red Soil",
    boundaryDimensions: { off: 53, leg: 55, straight: 62 },
    pitchCharacteristics: {
      paceBias: 55,
      spinBias: 45,
      avgFirstInnings: 168,
      chaseWinPct: 65,
      description: "Equipped with world-class SubAir aeration system; high-altitude ball carry.",
    },
    groundStatus: "Ready",
    drainageSystem: "SubAir automated underground vacuum evacuation",
  },
  {
    id: "arun-jaitley",
    name: "Arun Jaitley Stadium",
    shortName: "Kotla / Delhi",
    city: "New Delhi",
    state: "Delhi",
    capacity: "35,200",
    category: "WPL Active Hub",
    activeInCurrentSeason: false,
    clusterStage: "2024 Finals & Playoffs Hub",
    curator: "Ankit Datta",
    activePitch: "Pitch #3",
    soilType: "Hybrid Clay",
    boundaryDimensions: { off: 54, leg: 54, straight: 63 },
    pitchCharacteristics: {
      paceBias: 45,
      spinBias: 55,
      avgFirstInnings: 158,
      chaseWinPct: 54,
      description: "Lower bounce where cutters and spin hold up off the surface.",
    },
    groundStatus: "Ready",
    drainageSystem: "Dual-pump perimeter sump network",
  },
  {
    id: "brabourne",
    name: "Brabourne Stadium, CCI",
    shortName: "Brabourne",
    city: "Mumbai",
    state: "Maharashtra",
    capacity: "25,000",
    category: "WPL Active Hub",
    activeInCurrentSeason: false,
    clusterStage: "2023 Inaugural Final & 2025 Cluster",
    curator: "Mukund Pawar",
    activePitch: "Pitch #2",
    soilType: "Red Soil",
    boundaryDimensions: { off: 52, leg: 54, straight: 60 },
    pitchCharacteristics: {
      paceBias: 52,
      spinBias: 48,
      avgFirstInnings: 175,
      chaseWinPct: 58,
      description: "Short boundaries and fast sea breeze producing massive batting totals.",
    },
    groundStatus: "Ready",
    drainageSystem: "Gravity herringbone drainage system",
  },
  {
    id: "ekana",
    name: "BRSABV Ekana Cricket Stadium",
    shortName: "Ekana Stadium",
    city: "Lucknow",
    state: "Uttar Pradesh",
    capacity: "50,100",
    category: "WPL Active Hub",
    activeInCurrentSeason: false,
    clusterStage: "2025 Caravan Cluster",
    curator: "Sanjeev Agarwal",
    activePitch: "Pitch #6",
    soilType: "Black Soil",
    boundaryDimensions: { off: 56, leg: 56, straight: 65 },
    pitchCharacteristics: {
      paceBias: 38,
      spinBias: 62,
      avgFirstInnings: 152,
      chaseWinPct: 50,
      description: "Large boundary pockets and slower pitch dynamics creating tight low-scoring contests.",
    },
    groundStatus: "Ready",
    drainageSystem: "Full ground vacuum extraction and peripheral sloped drains",
  },

  // --- Andhra Pradesh & Emerging Mega Hubs ---
  {
    id: "amaravathi-aca",
    name: "ACA International Cricket Stadium",
    shortName: "Amaravati / Mangalagiri",
    city: "Amaravati (Mangalagiri)",
    state: "Andhra Pradesh",
    capacity: "34,000",
    category: "Emerging / High Potential",
    activeInCurrentSeason: false,
    clusterStage: "BCCI Women HQ & High Performance Centre",
    curator: "K. R. V. Prasad",
    activePitch: "Main Pavilion Strip #1",
    soilType: "Hybrid Clay",
    boundaryDimensions: { off: 55, leg: 55, straight: 64 },
    pitchCharacteristics: {
      paceBias: 50,
      spinBias: 50,
      avgFirstInnings: 164,
      chaseWinPct: 55,
      description: "Andhra Cricket Association international stadium in APCR; designated as official BCCI Women cricket headquarters.",
    },
    groundStatus: "Ready",
    drainageSystem: "State-of-the-art multi-layer sand filter drainage",
  },
  {
    id: "aca-vdca-vizag",
    name: "Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium",
    shortName: "Vizag ACA-VDCA",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    capacity: "27,500",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "Regular IPL & International Staging Ground",
    curator: "K. Nagamalliah",
    activePitch: "Pitch #3",
    soilType: "Red Soil",
    boundaryDimensions: { off: 54, leg: 56, straight: 65 },
    pitchCharacteristics: {
      paceBias: 48,
      spinBias: 52,
      avgFirstInnings: 170,
      chaseWinPct: 57,
      description: "High scoring surface surrounded by scenic hill terrain; consistent bounce with late turn.",
    },
    groundStatus: "Ready",
    drainageSystem: "Underground perforated PVC drain matrix",
  },
  {
    id: "varanasi-ganjari",
    name: "Varanasi International Cricket Stadium",
    shortName: "Varanasi / Kashi",
    city: "Varanasi (Ganjari)",
    state: "Uttar Pradesh",
    capacity: "30,000",
    category: "Emerging / High Potential",
    activeInCurrentSeason: false,
    clusterStage: "New Lord Shiva-Themed Mega Stadium",
    curator: "UPCA Panel Curator",
    activePitch: "Center Match Strip (Planned)",
    soilType: "Alluvial / Silt",
    boundaryDimensions: { off: 55, leg: 55, straight: 64 },
    pitchCharacteristics: {
      paceBias: 50,
      spinBias: 50,
      avgFirstInnings: 165,
      chaseWinPct: 53,
      description: "Iconic Lord Shiva-themed complex with Trishul floodlights, Damru media center, and 9 international practice strips.",
    },
    groundStatus: "Under Construction",
    drainageSystem: "Modern sand-gravel sub-base drainage",
  },

  // --- Key BCCI International Venues Across India ---
  {
    id: "narendra-modi",
    name: "Narendra Modi Stadium",
    shortName: "Motera / Ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    capacity: "132,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "World-Record Capacity Arena",
    curator: "Kashyap Dave",
    activePitch: "Red Soil Strip #5",
    soilType: "Red Soil",
    boundaryDimensions: { off: 58, leg: 58, straight: 68 },
    pitchCharacteristics: {
      paceBias: 56,
      spinBias: 44,
      avgFirstInnings: 176,
      chaseWinPct: 55,
      description: "World largest cricket venue offering 11 center pitches (both red and black soil combinations).",
    },
    groundStatus: "Ready",
    drainageSystem: "Sub-surface siphon drainage (playable in 30 mins post-rain)",
  },
  {
    id: "wankhede",
    name: "Wankhede Stadium",
    shortName: "Wankhede",
    city: "Mumbai",
    state: "Maharashtra",
    capacity: "33,100",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "Mumbai Indians Headquarters",
    curator: "Ramesh Mhamunkar",
    activePitch: "Center Pitch #4",
    soilType: "Red Soil",
    boundaryDimensions: { off: 54, leg: 55, straight: 63 },
    pitchCharacteristics: {
      paceBias: 58,
      spinBias: 42,
      avgFirstInnings: 178,
      chaseWinPct: 60,
      description: "Iconic red-soil bouncy wicket offering great seam value early on followed by massive boundary-clearing opportunities.",
    },
    groundStatus: "Ready",
    drainageSystem: "Sand-carpet drainage with automatic soakaways",
  },
  {
    id: "eden-gardens",
    name: "Eden Gardens",
    shortName: "Eden Gardens",
    city: "Kolkata",
    state: "West Bengal",
    capacity: "68,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "Historic East Zone Headquarters",
    curator: "Sujan Mukherjee",
    activePitch: "Pitch #3",
    soilType: "Hybrid Clay",
    boundaryDimensions: { off: 55, leg: 56, straight: 66 },
    pitchCharacteristics: {
      paceBias: 50,
      spinBias: 50,
      avgFirstInnings: 174,
      chaseWinPct: 56,
      description: "Historic colosseum with high-speed outfield and balanced pace-spin conditions.",
    },
    groundStatus: "Ready",
    drainageSystem: "Advanced perforated vacuum matrix",
  },
  {
    id: "chepauk",
    name: "M. A. Chidambaram Stadium",
    shortName: "Chepauk / Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    capacity: "38,200",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "CSK Base / Coastal Spin Arena",
    curator: "V. Ramesh",
    activePitch: "Pitch #2",
    soilType: "Black Soil",
    boundaryDimensions: { off: 55, leg: 55, straight: 64 },
    pitchCharacteristics: {
      paceBias: 35,
      spinBias: 65,
      avgFirstInnings: 160,
      chaseWinPct: 52,
      description: "Dry coastal wicket with sharp turn and variable bounce, demanding high spin proficiency.",
    },
    groundStatus: "Ready",
    drainageSystem: "Perforated pipe drainage with soak sumps",
  },
  {
    id: "uppal-hyderabad",
    name: "Rajiv Gandhi International Cricket Stadium",
    shortName: "Uppal / Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    capacity: "39,200",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "SRH Headquarters",
    curator: "Y. L. Chandrasekhar",
    activePitch: "Pitch #4",
    soilType: "Black Soil",
    boundaryDimensions: { off: 56, leg: 56, straight: 65 },
    pitchCharacteristics: {
      paceBias: 48,
      spinBias: 52,
      avgFirstInnings: 175,
      chaseWinPct: 54,
      description: "Flattest batting strip in the south; high 200+ totals with true bounce through the line.",
    },
    groundStatus: "Ready",
    drainageSystem: "Full ground storm drain with 3 suction units",
  },
  {
    id: "mullanpur",
    name: "Maharaja Yadavindra Singh International Cricket Stadium",
    shortName: "Mullanpur",
    city: "New Chandigarh",
    state: "Punjab",
    capacity: "38,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "New Punjab Kings Base",
    curator: "Daljit Singh",
    activePitch: "Pitch #3",
    soilType: "Hybrid Clay",
    boundaryDimensions: { off: 56, leg: 56, straight: 66 },
    pitchCharacteristics: {
      paceBias: 62,
      spinBias: 38,
      avgFirstInnings: 166,
      chaseWinPct: 50,
      description: "Modern facility offering steep tennis-ball bounce and lateral seam movement under night skies.",
    },
    groundStatus: "Ready",
    drainageSystem: "Herringbone sub-surface vacuum drainage",
  },
  {
    id: "dharamsala-hpca",
    name: "Himachal Pradesh Cricket Association Stadium",
    shortName: "Dharamsala",
    city: "Dharamsala",
    state: "Himachal Pradesh",
    capacity: "21,200",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "High Altitude Seam Haven",
    curator: "Sunil Chauhan",
    activePitch: "Pitch #2",
    soilType: "Hybrid Clay",
    boundaryDimensions: { off: 54, leg: 55, straight: 63 },
    pitchCharacteristics: {
      paceBias: 68,
      spinBias: 32,
      avgFirstInnings: 165,
      chaseWinPct: 55,
      description: "1,457m elevation producing unmatched swing and air carry in cold mountain conditions.",
    },
    groundStatus: "Ready",
    drainageSystem: "Ryegrass cold-climate rootzone with SubAir evacuation",
  },
  {
    id: "raipur-svns",
    name: "Shaheed Veer Narayan Singh International Stadium",
    shortName: "Naya Raipur",
    city: "Raipur",
    state: "Chhattisgarh",
    capacity: "65,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "Central India Mega Arena",
    curator: "Shamim Mirza",
    activePitch: "Pitch #4",
    soilType: "Red Soil",
    boundaryDimensions: { off: 58, leg: 58, straight: 68 },
    pitchCharacteristics: {
      paceBias: 52,
      spinBias: 48,
      avgFirstInnings: 163,
      chaseWinPct: 56,
      description: "Huge boundary ropes reward power hitters who clear the deep ropes.",
    },
    groundStatus: "Ready",
    drainageSystem: "Heavy sub-drain system",
  },
  {
    id: "barsapara-guwahati",
    name: "Barsapara Cricket Stadium (ACA)",
    shortName: "Barsapara / Guwahati",
    city: "Guwahati",
    state: "Assam",
    capacity: "46,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "North-East Gateway Venue",
    curator: "Ratna Bordoloi",
    activePitch: "Pitch #3",
    soilType: "Hybrid Clay",
    boundaryDimensions: { off: 54, leg: 55, straight: 64 },
    pitchCharacteristics: {
      paceBias: 50,
      spinBias: 50,
      avgFirstInnings: 178,
      chaseWinPct: 58,
      description: "Fast batting track producing high run rates and intense boundary scoring.",
    },
    groundStatus: "Ready",
    drainageSystem: "Gravity herringbone with heavy pump backup",
  },
  {
    id: "greenfield-trivandrum",
    name: "Greenfield International Stadium",
    shortName: "Karyavattom / Trivandrum",
    city: "Thiruvananthapuram",
    state: "Kerala",
    capacity: "50,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "South Coastal Seam Venue",
    curator: "Biju George",
    activePitch: "Pitch #3",
    soilType: "Red Soil",
    boundaryDimensions: { off: 55, leg: 55, straight: 65 },
    pitchCharacteristics: {
      paceBias: 60,
      spinBias: 40,
      avgFirstInnings: 154,
      chaseWinPct: 50,
      description: "Early swing and movement with heavy coastal moisture in evening sessions.",
    },
    groundStatus: "Ready",
    drainageSystem: "Advanced geotextile membrane drainage",
  },
  {
    id: "gwalior-scindia",
    name: "Shrimant Madhavrao Scindia Cricket Stadium",
    shortName: "Gwalior West",
    city: "Gwalior",
    state: "Madhya Pradesh",
    capacity: "30,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "New MPCA International Stadium",
    curator: "Samandar Singh",
    activePitch: "Pitch #2",
    soilType: "Black Soil",
    boundaryDimensions: { off: 55, leg: 55, straight: 63 },
    pitchCharacteristics: {
      paceBias: 45,
      spinBias: 55,
      avgFirstInnings: 172,
      chaseWinPct: 58,
      description: "Newly inaugurated international ground replacing Captain Roop Singh Stadium with modern amenities.",
    },
    groundStatus: "Ready",
    drainageSystem: "High-spec sand based vacuum drain",
  },
  {
    id: "ranchi-jsca",
    name: "JSCA International Stadium Complex",
    shortName: "JSCA / Ranchi",
    city: "Ranchi",
    state: "Jharkhand",
    capacity: "40,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "East Zone International Arena",
    curator: "S. B. Singh",
    activePitch: "Pitch #4",
    soilType: "Black Soil",
    boundaryDimensions: { off: 56, leg: 56, straight: 65 },
    pitchCharacteristics: {
      paceBias: 42,
      spinBias: 58,
      avgFirstInnings: 159,
      chaseWinPct: 53,
      description: "Spacious venue known for balanced bounce and variable turn on deteriorating surfaces.",
    },
    groundStatus: "Ready",
    drainageSystem: "Sloped sub-drain collector with high-capacity pumps",
  },
  {
    id: "pune-mca",
    name: "Maharashtra Cricket Association Stadium",
    shortName: "Gahunje / Pune",
    city: "Pune",
    state: "Maharashtra",
    capacity: "42,700",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "Western Region Premier Hub",
    curator: "Raju Kane",
    activePitch: "Pitch #3",
    soilType: "Black Soil",
    boundaryDimensions: { off: 56, leg: 56, straight: 65 },
    pitchCharacteristics: {
      paceBias: 45,
      spinBias: 55,
      avgFirstInnings: 166,
      chaseWinPct: 54,
      description: "Open bowl stadium near western expressway; good batting strip with variable bounce late in games.",
    },
    groundStatus: "Ready",
    drainageSystem: "Engineered sand sub-layer drainage system",
  },
  {
    id: "jaipur-sms",
    name: "Sawai Mansingh Stadium",
    shortName: "SMS / Jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    capacity: "30,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "Rajasthan Royals Base",
    curator: "Taposh Chatterjee",
    activePitch: "Pitch #2",
    soilType: "Hybrid Clay",
    boundaryDimensions: { off: 55, leg: 55, straight: 65 },
    pitchCharacteristics: {
      paceBias: 50,
      spinBias: 50,
      avgFirstInnings: 165,
      chaseWinPct: 58,
      description: "Large square boundaries offering tactical chess matches between spinners and boundary power hitters.",
    },
    groundStatus: "Ready",
    drainageSystem: "Sub-surface trench drains",
  },
  {
    id: "indore-holkar",
    name: "Holkar Cricket Stadium",
    shortName: "Holkar / Indore",
    city: "Indore",
    state: "Madhya Pradesh",
    capacity: "30,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "High-Altitude Six Hitter Paradise",
    curator: "Samandar Singh Chouhan",
    activePitch: "Pitch #1",
    soilType: "Red Soil",
    boundaryDimensions: { off: 52, leg: 53, straight: 61 },
    pitchCharacteristics: {
      paceBias: 50,
      spinBias: 50,
      avgFirstInnings: 185,
      chaseWinPct: 62,
      description: "Shortest square boundaries among premier stadiums, producing record-smashing run-rates.",
    },
    groundStatus: "Ready",
    drainageSystem: "Full ground herringbone drainage",
  },
  {
    id: "cuttack-barabati",
    name: "Barabati Stadium",
    shortName: "Barabati / Cuttack",
    city: "Cuttack",
    state: "Odisha",
    capacity: "45,000",
    category: "Premier BCCI International",
    activeInCurrentSeason: false,
    clusterStage: "Historic Odisha International Base",
    curator: "Pankaj Pattnaik",
    activePitch: "Pitch #3",
    soilType: "Black Soil",
    boundaryDimensions: { off: 54, leg: 55, straight: 64 },
    pitchCharacteristics: {
      paceBias: 42,
      spinBias: 58,
      avgFirstInnings: 156,
      chaseWinPct: 52,
      description: "Slower wicket next to Mahanadi river; gripping turn under hot and humid coastal conditions.",
    },
    groundStatus: "Ready",
    drainageSystem: "Perimeter storm water pumps and super soppers",
  },
];

const LOCAL_STORAGE_KEY = "wpl_venues_ops_data_v2";

export default function WPLVenuesOpsPage() {
  const [venues, setVenues] = useState<WPLVenue[]>(ALL_INDIAN_INTERNATIONAL_VENUES);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [activeSeasonOnly, setActiveSeasonOnly] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"edit" | "add" | null>(null);
  const [activeVenue, setActiveVenue] = useState<WPLVenue | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVenues(parsed);
        }
      }
    } catch {}
  }, []);

  const persistVenues = (updated: WPLVenue[]) => {
    setVenues(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      const matchSeason = !activeSeasonOnly || v.activeInCurrentSeason;
      const matchCategory = filterCategory === "ALL" || v.category === filterCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.state.toLowerCase().includes(q) ||
        v.curator.toLowerCase().includes(q) ||
        v.shortName.toLowerCase().includes(q);
      return matchSeason && matchCategory && matchSearch;
    });
  }, [venues, activeSeasonOnly, filterCategory, search]);

  const activeCount = useMemo(() => venues.filter((v) => v.activeInCurrentSeason).length, [venues]);

  const handleOpenAddModal = () => {
    const newVenue: WPLVenue = {
      id: "venue-" + Date.now(),
      name: "",
      shortName: "",
      city: "",
      state: "",
      capacity: "35,000",
      category: "Emerging / High Potential",
      activeInCurrentSeason: true,
      clusterStage: "New Caravan Hub",
      curator: "Chief Curator",
      activePitch: "Pitch #1",
      soilType: "Hybrid Clay",
      boundaryDimensions: { off: 55, leg: 55, straight: 64 },
      pitchCharacteristics: {
        paceBias: 50,
        spinBias: 50,
        avgFirstInnings: 165,
        chaseWinPct: 55,
        description: "Modern cricket surface with balanced pace and bounce.",
      },
      groundStatus: "Ready",
      drainageSystem: "Engineered sub-surface drainage",
    };
    setActiveVenue(newVenue);
    setModalMode("add");
  };

  const handleOpenEditModal = (venue: WPLVenue) => {
    setActiveVenue({ ...venue });
    setModalMode("edit");
  };

  const handleDeleteVenue = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from venues registry?`)) {
      const updated = venues.filter((v) => v.id !== id);
      persistVenues(updated);
    }
  };

  const handleToggleActiveSeason = (id: string) => {
    const updated = venues.map((v) =>
      v.id === id ? { ...v, activeInCurrentSeason: !v.activeInCurrentSeason } : v
    );
    persistVenues(updated);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVenue) return;

    let updated: WPLVenue[];
    if (modalMode === "add") {
      updated = [activeVenue, ...venues];
    } else {
      updated = venues.map((v) => (v.id === activeVenue.id ? activeVenue : v));
    }

    persistVenues(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setModalMode(null);
      setActiveVenue(null);
    }, 700);
  };

  const handleResetToDefaults = () => {
    if (confirm("Reset venues list back to official BCCI all-India defaults?")) {
      persistVenues(ALL_INDIAN_INTERNATIONAL_VENUES);
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(venues, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wpl-all-india-venues-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#131722] to-pink-950/40 border border-purple-500/20 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Pan-India BCCI International & WPL Caravan Command
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Stadiums & Pitch Registry
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                {venues.length} Total Venues
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Complete directory of all international cricket grounds across India—including Amaravati, Varanasi, Vizag, and active WPL hubs—with curatorship telemetry and soil diagnostics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Staging Venue
            </button>
            <button
              onClick={handleExportJSON}
              title="Export JSON Backup"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetToDefaults}
              title="Reset to All-India Verified BCCI Defaults"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{activeCount} Hubs</div>
            <div className="text-xs text-slate-400 font-medium">Active This Season</div>
          </div>
        </div>

        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{venues.length} Venues</div>
            <div className="text-xs text-slate-400 font-medium">BCCI Registry Grounds</div>
          </div>
        </div>

        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">Amaravati & Varanasi</div>
            <div className="text-xs text-slate-400 font-medium">Women HQ & Kashi Hubs</div>
          </div>
        </div>

        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">Caravan Rotation</div>
            <div className="text-xs text-slate-400 font-medium">BCCI Cluster Model</div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#111620] border border-white/10 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSeasonOnly(!activeSeasonOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSeasonOnly
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {activeSeasonOnly ? <ToggleRight className="w-4 h-4 text-emerald-300" /> : <ToggleLeft className="w-4 h-4" />}
            Only Active Staging Hubs ({activeCount})
          </button>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Categories ({venues.length})</option>
            <option value="WPL Active Hub">WPL Active & Historic Hubs</option>
            <option value="Emerging / High Potential">Emerging Grounds (Amaravati, Varanasi)</option>
            <option value="Premier BCCI International">Premier BCCI International Grounds</option>
          </select>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venue name, city, state, or curator..."
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVenues.map((v) => (
          <div
            key={v.id}
            className="rounded-2xl bg-[#121722] border border-white/10 hover:border-purple-500/30 transition-all p-5 shadow-xl space-y-3.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-purple-300 border border-white/10 text-[10px] font-bold">
                      {v.category}
                    </span>
                    {v.activeInCurrentSeason && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        Active Hub
                      </span>
                    )}
                    {v.groundStatus === "Under Construction" && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        Under Construction
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{v.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span>{v.city}, {v.state}</span>
                    <span>•</span>
                    <span>Cap: {v.capacity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActiveSeason(v.id)}
                    title={v.activeInCurrentSeason ? "Set as Standby" : "Activate for Season"}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    {v.activeInCurrentSeason ? (
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(v)}
                    title="Edit Details"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteVenue(v.id, v.name)}
                    title="Remove Ground"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {v.clusterStage && (
                <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-semibold truncate">
                  📌 {v.clusterStage}
                </div>
              )}
            </div>

            {/* Pitch & Metric Stats */}
            <div className="space-y-2.5 text-xs bg-[#0D1017] p-3 rounded-xl border border-white/5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 rounded-lg bg-white/[0.02]">
                  <div className="text-[9px] text-slate-400 font-semibold uppercase">1st Innings Par</div>
                  <div className="text-xs font-black text-amber-400 mt-0.5">{v.pitchCharacteristics.avgFirstInnings}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.02]">
                  <div className="text-[9px] text-slate-400 font-semibold uppercase">Chase Win %</div>
                  <div className="text-xs font-black text-emerald-400 mt-0.5">{v.pitchCharacteristics.chaseWinPct}%</div>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.02]">
                  <div className="text-[9px] text-slate-400 font-semibold uppercase">Pace / Spin</div>
                  <div className="text-[11px] font-bold text-slate-200 mt-0.5">
                    {v.pitchCharacteristics.paceBias}% / {v.pitchCharacteristics.spinBias}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-white/5">
                <span className="text-slate-400">Ropes:</span>
                <span>Off: <strong>{v.boundaryDimensions.off}m</strong></span>
                <span>Leg: <strong>{v.boundaryDimensions.leg}m</strong></span>
                <span>Straight: <strong>{v.boundaryDimensions.straight}m</strong></span>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                {v.pitchCharacteristics.description}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5 text-slate-400">
              <div className="truncate mr-2">
                Strip: <strong className="text-slate-200">{v.activePitch}</strong> ({v.soilType})
              </div>
              <div className="shrink-0">
                Curator: <strong className="text-purple-300">{v.curator}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal Drawer */}
      {modalMode && activeVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#121622] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#151B28]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  {modalMode === "add" ? "Register New International Ground" : `Edit ${activeVenue.shortName}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Configure BCCI stadium specs, pitch soil, and caravan status</p>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Stadium Name</label>
                  <input
                    type="text"
                    value={activeVenue.name}
                    onChange={(e) => setActiveVenue({ ...activeVenue, name: e.target.value })}
                    placeholder="e.g. ACA International Cricket Stadium"
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Short Name / Code</label>
                  <input
                    type="text"
                    value={activeVenue.shortName}
                    onChange={(e) => setActiveVenue({ ...activeVenue, shortName: e.target.value })}
                    placeholder="e.g. Amaravati"
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={activeVenue.city}
                    onChange={(e) => setActiveVenue({ ...activeVenue, city: e.target.value })}
                    placeholder="e.g. Amaravati"
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={activeVenue.state}
                    onChange={(e) => setActiveVenue({ ...activeVenue, state: e.target.value })}
                    placeholder="e.g. Andhra Pradesh"
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacity</label>
                  <input
                    type="text"
                    value={activeVenue.capacity}
                    onChange={(e) => setActiveVenue({ ...activeVenue, capacity: e.target.value })}
                    placeholder="e.g. 34,000"
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={activeVenue.category}
                    onChange={(e) => setActiveVenue({ ...activeVenue, category: e.target.value as any })}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="WPL Active Hub">WPL Active Hub</option>
                    <option value="Emerging / High Potential">Emerging / High Potential (Amaravati, Varanasi)</option>
                    <option value="Premier BCCI International">Premier BCCI International</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Soil Type</label>
                  <select
                    value={activeVenue.soilType}
                    onChange={(e) => setActiveVenue({ ...activeVenue, soilType: e.target.value as any })}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Red Soil">Red Soil (High Pace & Bounce)</option>
                    <option value="Black Soil">Black Soil (Gripping Turn)</option>
                    <option value="Hybrid Clay">Hybrid Clay (Even Bounce)</option>
                    <option value="Alluvial / Silt">Alluvial / Silt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Chief Curator</label>
                  <input
                    type="text"
                    value={activeVenue.curator}
                    onChange={(e) => setActiveVenue({ ...activeVenue, curator: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Active Pitch Strip</label>
                  <input
                    type="text"
                    value={activeVenue.activePitch}
                    onChange={(e) => setActiveVenue({ ...activeVenue, activePitch: e.target.value })}
                    placeholder="e.g. Center Pitch #3"
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Caravan / Regional Staging Note</label>
                <input
                  type="text"
                  value={activeVenue.clusterStage || ""}
                  onChange={(e) => setActiveVenue({ ...activeVenue, clusterStage: e.target.value })}
                  placeholder="e.g. BCCI Women Cricket HQ & High Performance Centre"
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Off Rope (m)</label>
                  <input
                    type="number"
                    value={activeVenue.boundaryDimensions.off}
                    onChange={(e) =>
                      setActiveVenue({
                        ...activeVenue,
                        boundaryDimensions: { ...activeVenue.boundaryDimensions, off: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Leg Rope (m)</label>
                  <input
                    type="number"
                    value={activeVenue.boundaryDimensions.leg}
                    onChange={(e) =>
                      setActiveVenue({
                        ...activeVenue,
                        boundaryDimensions: { ...activeVenue.boundaryDimensions, leg: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Straight (m)</label>
                  <input
                    type="number"
                    value={activeVenue.boundaryDimensions.straight}
                    onChange={(e) =>
                      setActiveVenue({
                        ...activeVenue,
                        boundaryDimensions: { ...activeVenue.boundaryDimensions, straight: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pitch Character Description</label>
                <textarea
                  rows={2}
                  value={activeVenue.pitchCharacteristics.description}
                  onChange={(e) =>
                    setActiveVenue({
                      ...activeVenue,
                      pitchCharacteristics: { ...activeVenue.pitchCharacteristics, description: e.target.value },
                    })
                  }
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeInCurrentSeason"
                  checked={activeVenue.activeInCurrentSeason}
                  onChange={(e) => setActiveVenue({ ...activeVenue, activeInCurrentSeason: e.target.checked })}
                  className="rounded border-white/10 bg-[#0B0E14] text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="activeInCurrentSeason" className="text-slate-300 font-semibold">
                  Designate as Active Staging Hub for Current Season
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-white shadow-lg shadow-purple-600/30"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      Saved!
                    </>
                  ) : (
                    "Save Venue"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
