/**
 * Generate comprehensive IPL squads (200+ players)
 * Adds more players to reach 200+ total
 */

const fs = require('fs');
const path = require('path');

// Read existing auction players
const auctionPlayers = JSON.parse(fs.readFileSync('auction-players-clean.json', 'utf-8'));

// Team info
const teams = {
  '1': { name: 'RCB', need: 17 }, // Already have 8, need 17 more = 25 total
  '2': { name: 'MI', need: 18 },  // Already have 7, need 18 more = 25 total
  '3': { name: 'SRH', need: 14 }, // Already have 11, need 14 more = 25 total
  '4': { name: 'GT', need: 21 },  // Already have 4, need 21 more = 25 total
  '5': { name: 'PBKS', need: 23 }, // Already have 2, need 23 more = 25 total
  '6': { name: 'DC', need: 17 },  // Already have 8, need 17 more = 25 total
  '7': { name: 'LSG', need: 19 }, // Already have 6, need 19 more = 25 total
  '8': { name: 'RR', need: 16 },  // Already have 9, need 16 more = 25 total
  '9': { name: 'KKR', need: 12 }, // Already have 13, need 12 more = 25 total
  '10': { name: 'CSK', need: 16 }  // Already have 9, need 16 more = 25 total
};

// Common Indian names for generating players
const indianFirstNames = ['Rohit', 'Virat', 'Rishabh', 'Shubman', 'Ishan', 'Suryakumar', 'Hardik', 'Ravindra', 'Yuzvendra', 'Mohammed', 'Jasprit', 'Bhuvneshwar', 'Ravichandran', 'Dinesh', 'Wriddhiman', 'KL', 'Mayank', 'Prithvi', 'Shreyas', 'Sanju', 'Ruturaj', 'Devdutt', 'Rahul', 'Shikhar', 'Ajinkya', 'Cheteshwar', 'Rishabh', 'Axar', 'Kuldeep', 'Washington', 'Deepak', 'Shardul', 'T Natarajan', 'Navdeep', 'Avesh', 'Harshal', 'Arshdeep', 'Umran', 'Mukesh', 'Yash', 'Akash', 'Kartik', 'Rajat', 'Anuj', 'Mahipal', 'Suyash', 'Shahbaz', 'Lalit', 'Abhishek', 'Tilak', 'Nehal', 'Vishnu', 'Shams', 'Raghav', 'Kumar', 'Piyush', 'Jason', 'Akash', 'Tim', 'Cameron', 'Glenn', 'Faf', 'Dinesh', 'Mohammed', 'Lockie', 'Reece', 'Will', 'Yash'];
const indianLastNames = ['Sharma', 'Kohli', 'Pant', 'Gill', 'Kishan', 'Yadav', 'Pandya', 'Jadeja', 'Chahal', 'Shami', 'Bumrah', 'Kumar', 'Ashwin', 'Karthik', 'Saha', 'Rahul', 'Agarwal', 'Shaw', 'Iyer', 'Samson', 'Gaikwad', 'Padikkal', 'Tripathi', 'Dhawan', 'Rahane', 'Pujara', 'Patel', 'Yadav', 'Sundar', 'Chahar', 'Thakur', 'Saini', 'Saini', 'Khan', 'Patel', 'Singh', 'Malik', 'Choudhary', 'Dayal', 'Deep', 'Sharma', 'Patidar', 'Rawat', 'Lomror', 'Prabhudessai', 'Ahmed', 'Yadav', 'Sharma', 'Varma', 'Wadhera', 'Vinod', 'Mulani', 'Goyal', 'Kartikeya', 'Chawla', 'Behrendorff', 'Madhwal', 'David', 'Green', 'Maxwell', 'du Plessis', 'Karthik', 'Siraj', 'Ferguson', 'Topley', 'Jacks', 'Dayal'];

// Overseas names
const overseasFirstNames = ['David', 'Glenn', 'Faf', 'Cameron', 'Tim', 'Josh', 'Liam', 'Ben', 'Jason', 'Wanindu', 'Pathum', 'Matheesha', 'Rachin', 'Finn', 'Tim', 'Adam', 'Kyle', 'Lungi', 'Anrich', 'Matt', 'Akeal', 'Jacob', 'Riley', 'Cooper', 'Zak', 'Luke', 'Jack', 'Quinton', 'Reece', 'Lockie', 'Will'];
const overseasLastNames = ['Warner', 'Maxwell', 'du Plessis', 'Green', 'David', 'Inglis', 'Livingstone', 'Duckett', 'Holder', 'Hasaranga', 'Nissanka', 'Pathirana', 'Ravindra', 'Allen', 'Seifert', 'Milne', 'Jamieson', 'Ngidi', 'Nortje', 'Henry', 'Hosein', 'Duffy', 'Meredith', 'Connolly', 'Foulkes', 'Wood', 'Edwards', 'de Kock', 'Topley', 'Ferguson', 'Jacks'];

const roles = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
const bowlingStyles = ['Right-arm fast', 'Right-arm medium-fast', 'Right-arm medium', 'Right-arm off-break', 'Right-arm leg-break', 'Left-arm fast', 'Left-arm medium-fast', 'Left-arm orthodox', 'Left-arm leg-break'];
const battingStyles = ['Right-handed bat', 'Left-handed bat'];

let playerId = 200; // Start from 200 to avoid conflicts
const additionalPlayers = [];

Object.keys(teams).forEach(teamId => {
  const team = teams[teamId];
  const existingCount = auctionPlayers.filter(p => p.teamId === teamId).length;
  const needed = team.need;
  
  for (let i = 0; i < needed; i++) {
    const isIndian = Math.random() > 0.3; // 70% Indian, 30% overseas
    const role = roles[Math.floor(Math.random() * roles.length)];
    
    let firstName, lastName, nationality;
    if (isIndian) {
      firstName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)];
      lastName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)];
      nationality = 'India';
    } else {
      firstName = overseasFirstNames[Math.floor(Math.random() * overseasFirstNames.length)];
      lastName = overseasLastNames[Math.floor(Math.random() * overseasLastNames.length)];
      // Guess nationality
      if (firstName.includes('David') || firstName.includes('Glenn') || firstName.includes('Cameron') || firstName.includes('Tim') || firstName.includes('Josh') || firstName.includes('Ben') || firstName.includes('Matt') || firstName.includes('Riley') || firstName.includes('Cooper') || firstName.includes('Zak') || firstName.includes('Luke') || firstName.includes('Jack') || firstName.includes('Reece') || firstName.includes('Will')) {
        nationality = Math.random() > 0.5 ? 'Australia' : 'England';
      } else if (firstName.includes('Wanindu') || firstName.includes('Pathum') || firstName.includes('Matheesha') || firstName.includes('Akeal')) {
        nationality = 'Sri Lanka';
      } else if (firstName.includes('Rachin') || firstName.includes('Finn') || firstName.includes('Kyle') || firstName.includes('Jacob')) {
        nationality = 'New Zealand';
      } else if (firstName.includes('Anrich') || firstName.includes('Lungi') || firstName.includes('Quinton')) {
        nationality = 'South Africa';
      } else {
        nationality = 'Australia';
      }
    }
    
    const name = `${firstName} ${lastName}`;
    
    let bowlingStyle = 'N/A (Batsman)';
    let battingStyle = battingStyles[Math.floor(Math.random() * battingStyles.length)];
    
    if (role === 'Bowler') {
      bowlingStyle = bowlingStyles[Math.floor(Math.random() * bowlingStyles.length)];
    } else if (role === 'All-rounder') {
      bowlingStyle = bowlingStyles[Math.floor(Math.random() * (bowlingStyles.length - 2))];
    } else if (role === 'Wicket-keeper') {
      bowlingStyle = 'N/A (Wicket-keeper)';
    }
    
    // Generate realistic stats
    const isCapped = Math.random() > 0.4; // 60% capped
    const baseMatches = isCapped ? Math.floor(Math.random() * 80) + 20 : Math.floor(Math.random() * 15) + 5;
    const baseRuns = role === 'Bowler' ? Math.floor(Math.random() * 150) : 
                     role === 'All-rounder' ? Math.floor(Math.random() * 1500) + 300 :
                     Math.floor(Math.random() * 3000) + 500;
    const baseWickets = role === 'Batsman' || role === 'Wicket-keeper' ? 0 :
                       role === 'Bowler' ? Math.floor(Math.random() * 100) + 30 :
                       Math.floor(Math.random() * 40) + 5;
    
    const player = {
      id: String(playerId++),
      league: 'ipl',
      name: name,
      role: role,
      teamId: teamId,
      age: Math.floor(Math.random() * 18) + 18, // 18-36
      nationality: nationality,
      jerseyNumber: Math.floor(Math.random() * 99) + 1,
      isCaptain: false,
      bowlingStyle: bowlingStyle,
      battingStyle: battingStyle,
      stats: {
        matches: baseMatches,
        runs: baseRuns,
        wickets: baseWickets,
        average: parseFloat((Math.random() * 40 + 15).toFixed(2)),
        strikeRate: parseFloat((Math.random() * 60 + 120).toFixed(2)),
        economy: role === 'Batsman' || role === 'Wicket-keeper' ? 0 : parseFloat((Math.random() * 4 + 6).toFixed(2)),
        highest: Math.floor(Math.random() * 100) + 20,
        fours: Math.floor(baseRuns / 12),
        sixes: Math.floor(baseRuns / 20),
        fifties: Math.floor(baseMatches / 10),
        hundreds: role === 'Batsman' ? Math.floor(Math.random() * 5) : 0,
        bestBowling: role === 'Batsman' || role === 'Wicket-keeper' ? '-' : `${Math.floor(Math.random() * 3) + 1}/${Math.floor(Math.random() * 25)}`
      }
    };
    
    additionalPlayers.push(player);
  }
});

// Combine auction players with additional players
const allPlayers = [...auctionPlayers, ...additionalPlayers];

console.log(JSON.stringify(allPlayers, null, 2));
console.error(`\nTotal players: ${allPlayers.length} (${auctionPlayers.length} auction + ${additionalPlayers.length} additional)`);












