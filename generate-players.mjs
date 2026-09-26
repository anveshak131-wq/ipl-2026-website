// Generate comprehensive IPL player dataset
const teams = [
  { id: '1', name: 'RCB', players: 25 },
  { id: '2', name: 'MI', players: 25 },
  { id: '3', name: 'SRH', players: 25 },
  { id: '4', name: 'GT', players: 25 },
  { id: '5', name: 'PBKS', players: 25 },
  { id: '6', name: 'DC', players: 25 },
  { id: '7', name: 'LSG', players: 25 },
  { id: '8', name: 'RR', players: 25 },
  { id: '9', name: 'KKR', players: 25 },
  { id: '10', name: 'CSK', players: 25 }
];

const roles = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
const nationalities = ['India', 'Australia', 'South Africa', 'England', 'West Indies', 'New Zealand', 'Afghanistan', 'Bangladesh', 'Sri Lanka'];
const battingStyles = ['Right-handed bat', 'Left-handed bat'];
const bowlingStyles = ['Right-arm fast', 'Right-arm medium-fast', 'Right-arm medium', 'Right-arm off-break', 'Right-arm leg-break', 'Left-arm fast', 'Left-arm medium-fast', 'Left-arm orthodox', 'Left-arm leg-break', 'N/A (Batsman)', 'N/A (Wicket-keeper)'];

let playerId = 1;
const allPlayers = [];

teams.forEach(team => {
  for (let i = 0; i < team.players; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const nationality = nationalities[Math.floor(Math.random() * nationalities.length)];
    const battingStyle = battingStyles[Math.floor(Math.random() * battingStyles.length)];
    const bowlingStyle = role === 'Batsman' || role === 'Wicket-keeper' 
      ? (role === 'Wicket-keeper' ? 'N/A (Wicket-keeper)' : 'N/A (Batsman)')
      : bowlingStyles[Math.floor(Math.random() * (bowlingStyles.length - 2))];
    
    const player = {
      id: String(playerId++),
      league: 'ipl',
      name: `Player ${playerId - 1} ${team.name}`,
      role: role,
      teamId: team.id,
      age: Math.floor(Math.random() * 15) + 20,
      nationality: nationality,
      jerseyNumber: Math.floor(Math.random() * 99) + 1,
      isCaptain: i === 0,
      bowlingStyle: bowlingStyle,
      battingStyle: battingStyle,
      stats: {
        matches: Math.floor(Math.random() * 200) + 10,
        runs: role === 'Bowler' ? Math.floor(Math.random() * 200) : Math.floor(Math.random() * 5000) + 100,
        wickets: role === 'Batsman' ? 0 : Math.floor(Math.random() * 150) + 1,
        average: parseFloat((Math.random() * 40 + 15).toFixed(2)),
        strikeRate: parseFloat((Math.random() * 50 + 120).toFixed(2)),
        economy: role === 'Batsman' ? 0 : parseFloat((Math.random() * 3 + 6).toFixed(2)),
        highest: Math.floor(Math.random() * 100) + 20,
        fours: Math.floor(Math.random() * 200) + 10,
        sixes: Math.floor(Math.random() * 100) + 5,
        fifties: Math.floor(Math.random() * 20),
        hundreds: Math.floor(Math.random() * 5),
        bestBowling: role === 'Batsman' ? '-' : `${Math.floor(Math.random() * 3) + 1}/${Math.floor(Math.random() * 20)}`
      }
    };
    allPlayers.push(player);
  }
});

console.log(JSON.stringify(allPlayers, null, 2));
