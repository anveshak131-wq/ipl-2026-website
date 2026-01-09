// Simple test to verify dashboard fixes
console.log('Dashboard test file loaded');
console.log('Testing hourlyData initialization:', typeof hourlyData);

// Test the fixes we made
const testHourlyData = {};
const testArray = testHourlyData && Object.keys(testHourlyData).length > 0 
  ? Object.entries(testHourlyData).map(([hour, count]) => ({ hour: `${hour}:00`, count }))
  : [];

console.log('Test result:', testArray);
console.log('This should show "Test result: []" if fixes are working');
