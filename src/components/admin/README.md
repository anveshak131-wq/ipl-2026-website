# Admin Panel Advanced Features

This directory contains reusable components for the admin panel with advanced features including search, filtering, bulk operations, and data visualization.

## Components

### 1. GlobalSearch
Global search component with keyboard shortcut (⌘K / Ctrl+K).

**Features:**
- Search pages, teams, players, matches
- Search history
- Keyboard navigation (Arrow keys, Enter)
- Real-time search results

**Usage:**
```tsx
import GlobalSearch from '@/components/admin/GlobalSearch';

// Add to your admin layout
<GlobalSearch />
```

### 2. AdvancedFilterBuilder
Advanced filter builder with multiple conditions and saved filters.

**Features:**
- Multiple filter conditions
- Various operators (equals, contains, greater than, etc.)
- Save and load filter presets
- Between and "in" operators for ranges

**Usage:**
```tsx
import AdvancedFilterBuilder, { FilterCondition } from '@/components/admin/AdvancedFilterBuilder';

const fields = [
  { value: 'name', label: 'Name', type: 'text' },
  { value: 'status', label: 'Status', type: 'select' },
  { value: 'date', label: 'Date', type: 'date' },
];

const [savedFilters, setSavedFilters] = useState([]);

<AdvancedFilterBuilder
  fields={fields}
  onApply={(conditions) => {
    // Apply filters
    console.log(conditions);
  }}
  onClear={() => {
    // Clear filters
  }}
  savedFilters={savedFilters}
  onSaveFilter={(name, conditions) => {
    // Save filter
    const newFilter = {
      id: Date.now().toString(),
      name,
      conditions,
      createdAt: Date.now(),
    };
    setSavedFilters([...savedFilters, newFilter]);
  }}
  onDeleteFilter={(id) => {
    setSavedFilters(savedFilters.filter(f => f.id !== id));
  }}
/>
```

### 3. FilterChips
Display active filters as chips with remove functionality.

**Usage:**
```tsx
import FilterChips from '@/components/admin/FilterChips';

<FilterChips
  conditions={activeFilters}
  onRemove={(id) => {
    setActiveFilters(activeFilters.filter(f => f.id !== id));
  }}
  onClearAll={() => {
    setActiveFilters([]);
  }}
  getFieldLabel={(field) => {
    return fields.find(f => f.value === field)?.label || field;
  }}
/>
```

### 4. BulkOperationsToolbar
Toolbar for bulk operations on selected items.

**Usage:**
```tsx
import BulkOperationsToolbar from '@/components/admin/BulkOperationsToolbar';

<BulkOperationsToolbar
  selectedCount={selectedItems.length}
  totalCount={allItems.length}
  onSelectAll={() => setSelectedItems(allItems.map(i => i.id))}
  onDeselectAll={() => setSelectedItems([])}
  onBulkEdit={() => setShowBulkEditModal(true)}
  onBulkDelete={() => setShowDeleteModal(true)}
  onBulkExport={() => exportSelected()}
  onBulkStatusUpdate={(status) => updateStatus(status)}
  statusOptions={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
/>
```

### 5. BulkEditModal
Modal for bulk editing multiple items.

**Usage:**
```tsx
import BulkEditModal from '@/components/admin/BulkEditModal';

<BulkEditModal
  isOpen={showBulkEdit}
  onClose={() => setShowBulkEdit(false)}
  onSave={(values) => {
    // Apply values to selected items
    updateItems(selectedItems, values);
  }}
  fields={[
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ]},
    { name: 'category', label: 'Category', type: 'text' },
  ]}
  selectedCount={selectedItems.length}
/>
```

### 6. BatchDeleteModal
Confirmation modal for batch deletion.

**Usage:**
```tsx
import BatchDeleteModal from '@/components/admin/BatchDeleteModal';

<BatchDeleteModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={() => {
    deleteItems(selectedItems);
    setSelectedItems([]);
  }}
  itemCount={selectedItems.length}
  itemType="teams"
  warningMessage="This will also delete all associated players and matches."
/>
```

### 7. DateRangePicker
Custom date range picker with quick ranges.

**Usage:**
```tsx
import DateRangePicker from '@/components/admin/DateRangePicker';

const [dateRange, setDateRange] = useState({ start: null, end: null });

<DateRangePicker
  value={dateRange}
  onChange={(range) => setDateRange(range)}
  placeholder="Select date range"
/>
```

### 8. InteractiveChart
Interactive bar chart component.

**Usage:**
```tsx
import InteractiveChart from '@/components/admin/InteractiveChart';

const chartData = [
  { label: 'Jan', value: 100, color: '#2F6FED' },
  { label: 'Feb', value: 150, color: '#7B61FF' },
  { label: 'Mar', value: 120, color: '#10B981' },
];

<InteractiveChart
  data={chartData}
  type="bar"
  title="Monthly Statistics"
  height={300}
  formatValue={(v) => `$${v.toLocaleString()}`}
/>
```

## Export Utilities

### exportUtils.ts
Utilities for exporting data to CSV, Excel, JSON, and PDF.

**Usage:**
```tsx
import { exportToCSV, exportToPDF, prepareExportData } from '@/lib/admin/exportUtils';

// Export to CSV
const exportData = prepareExportData(
  ['name', 'email', 'status'],
  items,
  { name: 'Name', email: 'Email', status: 'Status' }
);
exportToCSV(exportData, 'teams.csv');

// Export to PDF
exportToPDF('printable-content', 'report.pdf');
```

## Complete Example

Here's a complete example integrating all components:

```tsx
'use client';

import { useState } from 'react';
import AdvancedFilterBuilder, { FilterCondition } from '@/components/admin/AdvancedFilterBuilder';
import FilterChips from '@/components/admin/FilterChips';
import BulkOperationsToolbar from '@/components/admin/BulkOperationsToolbar';
import BulkEditModal from '@/components/admin/BulkEditModal';
import BatchDeleteModal from '@/components/admin/BatchDeleteModal';
import DateRangePicker from '@/components/admin/DateRangePicker';
import InteractiveChart from '@/components/admin/InteractiveChart';
import { exportToCSV, prepareExportData } from '@/lib/admin/exportUtils';

export default function AdminPageExample() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const fields = [
    { value: 'name', label: 'Name', type: 'text' },
    { value: 'status', label: 'Status', type: 'select' },
  ];

  const handleBulkExport = () => {
    const selectedData = items.filter(item => selectedItems.has(item.id));
    const exportData = prepareExportData(
      ['name', 'status'],
      selectedData
    );
    exportToCSV(exportData, 'export.csv');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <AdvancedFilterBuilder
          fields={fields}
          onApply={setFilters}
          onClear={() => setFilters([])}
        />
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Filter Chips */}
      <FilterChips
        conditions={filters}
        onRemove={(id) => setFilters(filters.filter(f => f.id !== id))}
        onClearAll={() => setFilters([])}
        getFieldLabel={(field) => fields.find(f => f.value === field)?.label || field}
      />

      {/* Bulk Operations */}
      <BulkOperationsToolbar
        selectedCount={selectedItems.size}
        totalCount={items.length}
        onSelectAll={() => setSelectedItems(new Set(items.map(i => i.id)))}
        onDeselectAll={() => setSelectedItems(new Set())}
        onBulkEdit={() => setShowBulkEdit(true)}
        onBulkDelete={() => setShowDeleteModal(true)}
        onBulkExport={handleBulkExport}
        statusOptions={[
          { value: 'active', label: 'Set Active' },
          { value: 'inactive', label: 'Set Inactive' },
        ]}
      />

      {/* Chart */}
      <InteractiveChart
        data={chartData}
        title="Statistics"
      />

      {/* Modals */}
      <BulkEditModal
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        onSave={(values) => {
          // Update selected items
          console.log(values);
        }}
        fields={fields}
        selectedCount={selectedItems.size}
      />

      <BatchDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          // Delete items
          console.log('Deleting', selectedItems);
        }}
        itemCount={selectedItems.size}
        itemType="items"
      />
    </div>
  );
}
```

## Keyboard Shortcuts

- **⌘K / Ctrl+K**: Open global search
- **⌘B / Ctrl+B**: Toggle sidebar (in sidebar component)
- **Escape**: Close modals, clear search

## Styling

All components use the admin panel's dark theme with consistent colors:
- Background: `#0B0F13`, `#141A22`
- Borders: `#2A3440`
- Text: `#E6EDF3` (primary), `#AEBAC7` (secondary)
- Accent: `#2F6FED` (blue)

