// Simple test to verify Excel export functionality
console.log('🧪 Testing Excel export functionality...');

// Test XLSX library availability
const XLSX = (window as any).XLSX;
if (XLSX) {
  console.log('✅ XLSX library is available');
} else {
  console.error('❌ XLSX library is NOT available');
}

// Test creating a simple workbook
try {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Test Data'],
    ['Row 1', 'Data 1'],
    ['Row 2', 'Data 2']
  ]);
  
  XLSX.utils.book_append_sheet(wb, ws, 'Test');
  
  console.log('✅ Basic Excel creation works');
  
  // Test download
  XLSX.writeFile(wb, 'test-excel.xlsx');
  console.log('✅ Excel download works');
  
} catch (error) {
  console.error('❌ Basic Excel creation failed:', error);
}

export const testExcelExport = () => {
  console.log('🧪 Running testExcelExport function...');
  return 'Test completed';
};
