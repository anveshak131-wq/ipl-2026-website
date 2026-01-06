const fs = require('fs');
const content = fs.readFileSync('src/app/ipl-admin-2026/dashboard/page.tsx', 'utf8');

// Find the return statement
const returnMatch = content.match(/\s+return\s+\(/);
if (!returnMatch) {
  console.log('No return statement found');
  process.exit(1);
}

const returnIndex = content.indexOf(returnMatch[0]);
const afterReturn = content.substring(returnIndex);

// Count opening and closing divs
const openDivs = (afterReturn.match(/<div/g) || []).length;
const closeDivs = (afterReturn.match(/<\/div>/g) || []).length;

console.log('Opening divs:', openDivs);
console.log('Closing divs:', closeDivs);
console.log('Difference:', openDivs - closeDivs);

// Count opening and closing braces in JSX section
const openBraces = (afterReturn.match(/{/g) || []).length;
const closeBraces = (afterReturn.match(/}/g) || []).length;

console.log('Opening braces:', openBraces);
console.log('Closing braces:', closeBraces);
console.log('Difference:', openBraces - closeBraces);
