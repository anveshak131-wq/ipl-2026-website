export type IPLHistoryStatus = 'active' | 'defunct' | 'renamed';

export interface IPLHistoricalTeam {
  key: string;
  name: string;
  shortName: string;
  status: IPLHistoryStatus;
  seasons: number[];
  aliases?: string[];
  notes?: string;
}

export interface IPLSeasonRecord {
  year: number;
  teams: string[];
  joined?: string[];
  left?: string[];
  notes?: string;
}

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

export const IPL_HISTORICAL_TEAMS: IPLHistoricalTeam[] = [
  {
    key: 'rcb',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    status: 'active',
    seasons: range(2008, 2026),
    aliases: ['Royal Challengers Bangalore'],
    notes: 'Continuous IPL member since the inaugural 2008 season.'
  },
  {
    key: 'mi',
    name: 'Mumbai Indians',
    shortName: 'MI',
    status: 'active',
    seasons: range(2008, 2026),
    notes: 'Continuous IPL member since 2008.'
  },
  {
    key: 'kkr',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    status: 'active',
    seasons: range(2008, 2026),
    notes: 'Continuous IPL member since 2008.'
  },
  {
    key: 'csk',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    status: 'active',
    seasons: [...range(2008, 2015), ...range(2018, 2026)],
    notes: 'Suspended for the 2016 and 2017 seasons.'
  },
  {
    key: 'rr',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    status: 'active',
    seasons: [...range(2008, 2015), ...range(2018, 2026)],
    notes: 'Suspended for the 2016 and 2017 seasons.'
  },
  {
    key: 'dc',
    name: 'Delhi Capitals',
    shortName: 'DC',
    status: 'renamed',
    seasons: range(2008, 2026),
    aliases: ['Delhi Daredevils'],
    notes: 'Played as Delhi Daredevils from 2008 to 2018, renamed Delhi Capitals in 2019.'
  },
  {
    key: 'pbks',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    status: 'renamed',
    seasons: range(2008, 2026),
    aliases: ['Kings XI Punjab', 'KXIP'],
    notes: 'Played as Kings XI Punjab from 2008 to 2020, renamed Punjab Kings in 2021.'
  },
  {
    key: 'srh',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    status: 'active',
    seasons: range(2013, 2026),
    notes: 'Joined in 2013 after Deccan Chargers exited the IPL.'
  },
  {
    key: 'lsg',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    status: 'active',
    seasons: range(2022, 2026),
    notes: 'Expansion franchise added in 2022.'
  },
  {
    key: 'gt',
    name: 'Gujarat Titans',
    shortName: 'GT',
    status: 'active',
    seasons: range(2022, 2026),
    notes: 'Expansion franchise added in 2022.'
  },
  {
    key: 'deccan-chargers',
    name: 'Deccan Chargers',
    shortName: 'DCG',
    status: 'defunct',
    seasons: range(2008, 2012),
    notes: 'Exited after the 2012 season and was replaced by Sunrisers Hyderabad in 2013.'
  },
  {
    key: 'kochi-tuskers-kerala',
    name: 'Kochi Tuskers Kerala',
    shortName: 'KTK',
    status: 'defunct',
    seasons: [2011],
    notes: 'Played only in the 2011 season.'
  },
  {
    key: 'pune-warriors-india',
    name: 'Pune Warriors India',
    shortName: 'PWI',
    status: 'defunct',
    seasons: [2011, 2012, 2013],
    notes: 'Participated from 2011 through 2013.'
  },
  {
    key: 'gujarat-lions',
    name: 'Gujarat Lions',
    shortName: 'GL',
    status: 'defunct',
    seasons: [2016, 2017],
    notes: 'Temporary franchise during the CSK and RR suspension years.'
  },
  {
    key: 'rising-pune-supergiant',
    name: 'Rising Pune Supergiant',
    shortName: 'RPS',
    status: 'defunct',
    seasons: [2016, 2017],
    aliases: ['Rising Pune Supergiants'],
    notes: 'Temporary franchise during the CSK and RR suspension years.'
  }
];

export const IPL_SEASON_RECORDS: IPLSeasonRecord[] = [
  { year: 2008, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Daredevils', 'Kings XI Punjab', 'Deccan Chargers'], joined: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Daredevils', 'Kings XI Punjab', 'Deccan Chargers'], notes: 'Inaugural IPL season with 8 teams.' },
  { year: 2009, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Daredevils', 'Kings XI Punjab', 'Deccan Chargers'] },
  { year: 2010, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Daredevils', 'Kings XI Punjab', 'Deccan Chargers'] },
  { year: 2011, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Daredevils', 'Kings XI Punjab', 'Deccan Chargers', 'Kochi Tuskers Kerala', 'Pune Warriors India'], joined: ['Kochi Tuskers Kerala', 'Pune Warriors India'], notes: 'League expanded to 10 teams.' },
  { year: 2012, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Daredevils', 'Kings XI Punjab', 'Deccan Chargers', 'Pune Warriors India'], left: ['Kochi Tuskers Kerala'], notes: 'Back to 9 teams after Kochi Tuskers Kerala exited.' },
  { year: 2013, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Daredevils', 'Kings XI Punjab', 'Sunrisers Hyderabad', 'Pune Warriors India'], joined: ['Sunrisers Hyderabad'], left: ['Deccan Chargers'], notes: 'Sunrisers Hyderabad replaced Deccan Chargers.' },
  { year: 2014, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Daredevils', 'Kings XI Punjab', 'Sunrisers Hyderabad'], left: ['Pune Warriors India'], notes: 'Returned to 8 teams after Pune Warriors India exited.' },
  { year: 2015, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Daredevils', 'Kings XI Punjab', 'Sunrisers Hyderabad'] },
  { year: 2016, teams: ['RCB', 'MI', 'KKR', 'Sunrisers Hyderabad', 'Delhi Daredevils', 'Kings XI Punjab', 'Gujarat Lions', 'Rising Pune Supergiants'], joined: ['Gujarat Lions', 'Rising Pune Supergiants'], left: ['Chennai Super Kings', 'Rajasthan Royals'], notes: 'CSK and RR were suspended, so GL and Rising Pune entered temporarily.' },
  { year: 2017, teams: ['RCB', 'MI', 'KKR', 'Sunrisers Hyderabad', 'Delhi Daredevils', 'Kings XI Punjab', 'Gujarat Lions', 'Rising Pune Supergiant'], notes: 'Second and final season for Gujarat Lions and Rising Pune.' },
  { year: 2018, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Daredevils', 'Kings XI Punjab', 'Sunrisers Hyderabad'], joined: ['Chennai Super Kings', 'Rajasthan Royals'], left: ['Gujarat Lions', 'Rising Pune Supergiant'], notes: 'CSK and RR returned; temporary franchises left the league.' },
  { year: 2019, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Capitals', 'Kings XI Punjab', 'Sunrisers Hyderabad'], notes: 'Delhi Daredevils began playing as Delhi Capitals.' },
  { year: 2020, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Capitals', 'Kings XI Punjab', 'Sunrisers Hyderabad'] },
  { year: 2021, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Capitals', 'Punjab Kings', 'Sunrisers Hyderabad'], notes: 'Kings XI Punjab began playing as Punjab Kings.' },
  { year: 2022, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Capitals', 'Punjab Kings', 'Sunrisers Hyderabad', 'Lucknow Super Giants', 'Gujarat Titans'], joined: ['Lucknow Super Giants', 'Gujarat Titans'], notes: 'League expanded back to 10 teams.' },
  { year: 2023, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Capitals', 'Punjab Kings', 'Sunrisers Hyderabad', 'Lucknow Super Giants', 'Gujarat Titans'] },
  { year: 2024, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Capitals', 'Punjab Kings', 'Sunrisers Hyderabad', 'Lucknow Super Giants', 'Gujarat Titans'] },
  { year: 2025, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Capitals', 'Punjab Kings', 'Sunrisers Hyderabad', 'Lucknow Super Giants', 'Gujarat Titans'] },
  { year: 2026, teams: ['RCB', 'MI', 'KKR', 'CSK', 'RR', 'Delhi Capitals', 'Punjab Kings', 'Sunrisers Hyderabad', 'Lucknow Super Giants', 'Gujarat Titans'], notes: 'Current 10-team era continues.' }
];

