import fs from 'node:fs';

const file = 'comprehensive-players.json';
if (!fs.existsSync(file)) {
  console.error('comprehensive-players.json not found!');
  process.exit(1);
}

const players = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log(`Auditing and fixing ${players.length} IPL players...`);

// Franchise Master ID mapping:
// 1: CSK, 2: MI, 3: RCB, 4: KKR, 5: DC, 6: PBKS, 7: RR, 8: SRH, 9: GT, 10: LSG

const srhNames = new Set([
  'Travis Head', 'Jack Edwards', 'Aniket Verma', 'Smaran Ravichandran',
  'Heinrich Klaasen', 'Ishan Kishan', 'Salil Arora', 'Liam Livingstone',
  'Kamindu Mendis', 'Abhishek Sharma', 'Shivang Kumar', 'Nitish Kumar Reddy',
  'Harsh Dubey', 'Harshal Patel', 'Jaydev Unadkat', 'Pat Cummins',
  'Brydon Carse', 'Shivam Mavi', 'Zeeshan Ansari', 'Eshan Malinga',
  'Praful Hinge', 'Onkar Tarmale', 'Amit Kumar', 'Krains Fuletra', 'Sakib Hussain',
  'Atharva Taide', 'Simarjeet Singh'
]);

const rcbNames = new Set([
  'Virat Kohli', 'Rajat Patidar', 'Phil Salt', 'Jitesh Sharma',
  'Josh Hazlewood', 'Bhuvneshwar Kumar', 'Krunal Pandya', 'Devdutt Padikkal',
  'Rasikh Salam', 'Yash Dayal', 'Tim David', 'Romario Shepherd', 'Suyash Sharma',
  'Swapnil Singh', 'Manoj Bhandage', 'Jacob Bethell', 'Nuwan Thushara',
  'Swastik Chikara', 'Mohit Rathee', 'Lungi Ngidi', 'Blessing Muzarabani',
  'Abhinandan Singh', 'Kanishk Chouhan', 'Satvik Deswal', 'Vihaan Malhotra',
  'Vicky Ostwal', 'Mangesh Yadav', 'Jordan Cox', 'Jacob Duffy'
]);

const cskNames = new Set([
  'Ruturaj Gaikwad', 'MS Dhoni', 'Ravindra Jadeja', 'Shivam Dube',
  'Matheesha Pathirana', 'Devon Conway', 'Rahul Tripathi', 'Rachin Ravindra',
  'Ravichandran Ashwin', 'Khaleel Ahmed', 'Noor Ahmad', 'Vijay Shankar',
  'Sam Curran', 'Deepak Chahar', 'Mukesh Choudhary', 'Jamie Overton',
  'Shaik Rasheed', 'Anshul Kamboj', 'Gurjapneet Singh', 'Nathan Ellis'
]);

const miNames = new Set([
  'Hardik Pandya', 'Rohit Sharma', 'Jasprit Bumrah', 'Suryakumar Yadav',
  'Tilak Varma', 'Trent Boult', 'Robin Minz', 'Naman Dhir', 'Karn Sharma',
  'Ryan Rickelton', 'Deepak Chahar', 'Allah Ghazanfar', 'Will Jacks', 'Mitchell Santner',
  'Reece Topley', 'Corbin Bosch', 'Ashwin Hebbar', 'Bevon Jacobs', 'Satyanarayana Raju'
]);

const kkrNames = new Set([
  'Rinku Singh', 'Sunil Narine', 'Andre Russell', 'Varun Chakaravarthy',
  'Harshit Rana', 'Ramandeep Singh', 'Venkatesh Iyer', 'Quinton de Kock',
  'Rahmanullah Gurbaz', 'Anrich Nortje', 'Angkrish Raghuvanshi', 'Vaibhav Arora',
  'Spencer Johnson', 'Moeen Ali', 'Ajinkya Rahane', 'Manish Pandey',
  'Umran Malik', 'Rovman Powell', 'Mayank Markande'
]);

const dcNames = new Set([
  'Axar Patel', 'Kuldeep Yadav', 'Tristan Stubbs', 'Abishek Porel',
  'KL Rahul', 'Mitchell Starc', 'Harry Brook', 'T Natarajan', 'Mukesh Kumar',
  'Faf du Plessis', 'Karun Nair', 'Sameer Rizvi', 'Ashutosh Sharma', 'Mohit Sharma',
  'Dushmantha Chameera', 'Donovan Ferreira', 'Vipraj Nigam', 'Ajay Mandal'
]);

const pbksNames = new Set([
  'Shashank Singh', 'Prabhsimran Singh', 'Shreyas Iyer', 'Arshdeep Singh',
  'Yuzvendra Chahal', 'Glenn Maxwell', 'Marcus Stoinis', 'Marco Jansen',
  'Lockie Ferguson', 'Nehal Wadhera', 'Harpreet Brar', 'Pravin Dubey',
  'Vijaykumar Vyshak', 'Aaron Hardie', 'Azmatullah Omarzai', 'Josh Inglis',
  'Xavier Bartlett', 'Kulwant Khejroliya', 'Harnoor Singh', 'Priyansh Arya'
]);

const rrNames = new Set([
  'Sanju Samson', 'Yashasvi Jaiswal', 'Riyan Parag', 'Dhruv Jurel',
  'Shimron Hetmyer', 'Sandeep Sharma', 'Jofra Archer', 'Wanindu Hasaranga',
  'Maheesh Theekshana', 'Akash Madhwal', 'Kumar Kartikeya', 'Tushar Deshpande',
  'Nitish Rana', 'Shubham Dubey', 'Yudhvir Charak', 'Fazalhaq Farooqi', 'Kwena Maphaka'
]);

const gtNames = new Set([
  'Shubman Gill', 'Rashid Khan', 'Sai Sudharsan', 'Rahul Tewatia',
  'Shahrukh Khan', 'Jos Buttler', 'Mohammed Siraj', 'Kagiso Rabada',
  'Prasidh Krishna', 'Washington Sundar', 'Glenn Phillips', 'Ishant Sharma',
  'Jayant Yadav', 'Gerald Coetzee', 'Gurnoor Brar', 'Manav Suthar', 'Arshad Khan'
]);

const lsgNames = new Set([
  'Nicholas Pooran', 'Ravi Bishnoi', 'Mayank Yadav', 'Mohsin Khan',
  'Ayush Badoni', 'Rishabh Pant', 'David Miller', 'Avesh Khan',
  'Abdul Samad', 'Aryan Juyal', 'Akash Deep', 'Himmat Singh', 'M Siddharth',
  'Digvesh Rathi', 'Shahbaz Ahmed', 'Matthew Breetzke', 'Prince Yadav', 'Shamar Joseph'
]);

let changed = 0;
const updated = players.map(p => {
  const name = (p.name || '').trim();
  let targetTeamId = p.teamId;

  if (srhNames.has(name)) targetTeamId = '8';
  else if (rcbNames.has(name)) targetTeamId = '3';
  else if (cskNames.has(name)) targetTeamId = '1';
  else if (miNames.has(name)) targetTeamId = '2';
  else if (kkrNames.has(name)) targetTeamId = '4';
  else if (dcNames.has(name)) targetTeamId = '5';
  else if (pbksNames.has(name)) targetTeamId = '6';
  else if (rrNames.has(name)) targetTeamId = '7';
  else if (gtNames.has(name)) targetTeamId = '9';
  else if (lsgNames.has(name)) targetTeamId = '10';

  let isCaptain = !!p.isCaptain;
  if ([
    'Pat Cummins', 'Rajat Patidar', 'Ruturaj Gaikwad', 'Hardik Pandya',
    'Shreyas Iyer', 'Sanju Samson', 'Shubman Gill', 'Rishabh Pant',
    'Axar Patel', 'Rinku Singh'
  ].includes(name)) {
    isCaptain = true;
  }

  let isKeeper = !!p.isKeeper;
  if ([
    'Heinrich Klaasen', 'Ishan Kishan', 'Salil Arora', 'Phil Salt',
    'Jitesh Sharma', 'MS Dhoni', 'Devon Conway', 'Robin Minz',
    'Ryan Rickelton', 'Quinton de Kock', 'Rahmanullah Gurbaz',
    'Abishek Porel', 'KL Rahul', 'Dhruv Jurel', 'Sanju Samson',
    'Jos Buttler', 'Nicholas Pooran', 'Aryan Juyal'
  ].includes(name)) {
    isKeeper = true;
  }

  if (String(p.teamId) !== String(targetTeamId)) {
    changed++;
  }

  return {
    ...p,
    teamId: String(targetTeamId),
    team: String(targetTeamId),
    league: 'ipl',
    isCaptain,
    isKeeper
  };
});

fs.writeFileSync(file, JSON.stringify(updated, null, 2));
fs.writeFileSync(
  'functions/data/comprehensivePlayers.js',
  'export const fallbackIplPlayers = ' + JSON.stringify(updated, null, 2) + ';\nexport default fallbackIplPlayers;\n'
);

console.log(`✅ Fixed team assignments for ${changed} players!`);

const dist = {};
updated.forEach(p => { dist[p.teamId] = (dist[p.teamId] || 0) + 1; });
console.log('\nFinal Team Breakdown:');
const teamLabels = {
  '1': 'CSK', '2': 'MI', '3': 'RCB', '4': 'KKR', '5': 'DC',
  '6': 'PBKS', '7': 'RR', '8': 'SRH', '9': 'GT', '10': 'LSG'
};
Object.keys(dist).sort((a,b) => Number(a)-Number(b)).forEach(k => {
  console.log(`- ${teamLabels[k] || 'Team ' + k} (ID ${k}): ${dist[k]} players`);
});
