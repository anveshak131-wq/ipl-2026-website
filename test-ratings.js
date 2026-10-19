const fs = require('fs');

// Read formatRatings.ts and transpile in-memory for testing
const tsCode = fs.readFileSync('src/lib/formatRatings.ts', 'utf8');
const jsCode = tsCode
  .replace(/export /g, '')
  .replace(/import [^;]+;/g, '')
  .replace(/: [A-Za-z0-9_<>\[\]|"'& ]+/g, '')
  .replace(/as const/g, '')
  .replace(/as [A-Za-z0-9_]+/g, '');

const evalModule = { exports: {} };
const runner = new Function('module', 'exports', jsCode + '; module.exports = { calculateSingleFormatRating, getAllFormatRatings };');
runner(evalModule, evalModule.exports);
const { getAllFormatRatings } = evalModule.exports;

const viratKohli = {
  name: "Virat Kohli",
  role: "Batsman",
  careerStats: {
    batting: {
      Test: { Matches: 123, Innings: 210, Runs: 9230, Highest: 254, Average: 46.85, SR: 55.58, "100s": 30, "200s": 7, "50s": 31 },
      ODI:  { Matches: 317, Innings: 305, Runs: 15109, Highest: 183, Average: 58.79, SR: 94.37, "100s": 55, "50s": 79 },
      T20:  { Matches: 125, Innings: 117, Runs: 4188, Highest: 122, Average: 48.70, SR: 137.05, "100s": 1, "50s": 38 },
      IPL:  { Matches: 283, Innings: 275, Runs: 9336, Highest: 113, Average: 40.42, SR: 134.80, "100s": 9, "50s": 68 }
    },
    bowling: {
      Test: { Matches: 123, Wickets: 0, Eco: 2.88 },
      ODI:  { Matches: 317, Wickets: 5, Eco: 6.16, Avg: 136 },
      T20:  { Matches: 125, Wickets: 4, Eco: 8.05 },
      IPL:  { Matches: 283, Wickets: 4, Eco: 8.80 }
    }
  }
};

const ratings = getAllFormatRatings(viratKohli);
console.log("\n=== MULTI-FORMAT RATINGS FOR VIRAT KOHLI ===");
for (const [fmt, res] of Object.entries(ratings)) {
  console.log(`${fmt.padEnd(5)}: Grade ${res.grade.padEnd(2)} | Score: ${res.score}/100 | Label: ${res.label} (Batting: ${res.batScore})`);
}
