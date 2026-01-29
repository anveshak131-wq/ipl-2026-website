# Glassmorphism Components for Live Score CSV Improvements

## Component Library

This document provides ready-to-use glassmorphism components for implementing the UI/UX improvements in the live score CSV page.

---

## 1. Smart Auto-Complete Component

### Player Search Auto-Complete
```jsx
// components/PlayerAutoComplete.jsx
import { useState, useRef, useEffect } from 'react';

const PlayerAutoComplete = ({ 
  players, 
  value, 
  onChange, 
  placeholder = "Search player...",
  recentPlayers = [],
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    const filtered = players.filter(player =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPlayers(filtered);
  }, [searchTerm, players]);

  const handleSelect = (player) => {
    onChange(player.name);
    setSearchTerm(player.name);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl 
                   text-white placeholder-white/50 focus:outline-none focus:border-white/40 
                   focus:bg-white/15 transition-all duration-300 shadow-lg"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {isOpen && filteredPlayers.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/10 backdrop-blur-xl border border-white/20 
                    rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {recentPlayers.length > 0 && (
              <div className="p-3 border-b border-white/10">
                <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Recent</p>
                {recentPlayers.map((player, index) => (
                  <button
                    key={`recent-${index}`}
                    onClick={() => handleSelect(player)}
                    className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10 
                             rounded-lg transition-colors duration-200 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400/20 to-purple-400/20 
                                rounded-full flex items-center justify-center">
                      <span className="text-xs text-white/60">{player.name.charAt(0)}</span>
                    </div>
                    <span className="text-sm">{player.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="p-3">
              <p className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2">All Players</p>
              {filteredPlayers.map((player, index) => (
                <button
                  key={`player-${index}`}
                  onClick={() => handleSelect(player)}
                  className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10 
                           rounded-lg transition-colors duration-200 flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400/20 to-pink-400/20 
                              rounded-full flex items-center justify-center">
                    <span className="text-xs text-white/60">{player.name.charAt(0)}</span>
                  </div>
                  <div>
                    <span className="text-sm block">{player.name}</span>
                    <span className="text-xs text-white/50">{player.team}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerAutoComplete;
```

---

## 2. Keyboard Navigation Helper

### Keyboard Shortcuts Modal
```jsx
// components/KeyboardShortcuts.jsx
import { useState } from 'react';

const KeyboardShortcuts = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'Tab', description: 'Navigate between cells' },
    { key: 'Enter', description: 'Move to next row' },
    { key: 'Ctrl + S', description: 'Save data' },
    { key: 'Ctrl + N', description: 'Add new row' },
    { key: 'Arrow Keys', description: 'Navigate within table' },
    { key: 'F2', description: 'Edit current cell' },
    { key: 'Escape', description: 'Cancel editing' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl 
                  shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center 
                     justify-center transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <kbd className="px-3 py-1 bg-white/10 border border-white/20 rounded-md text-sm 
                           font-mono text-white/90">
                {shortcut.key}
              </kbd>
              <span className="text-white/70 text-sm">{shortcut.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
```

---

## 3. Quick Templates Component

### Action Templates Bar
```jsx
// components/QuickTemplates.jsx
import { useState } from 'react';

const QuickTemplates = ({ onApplyTemplate }) => {
  const [activeTemplate, setActiveTemplate] = useState(null);
  
  const templates = [
    { 
      id: 'dot_ball', 
      name: 'Dot Ball', 
      icon: '○', 
      color: 'from-gray-400/20 to-gray-500/20',
      data: { runs: 0, ball: 'auto' }
    },
    { 
      id: 'single', 
      name: 'Single', 
      icon: '1', 
      color: 'from-blue-400/20 to-blue-500/20',
      data: { runs: 1, ball: 'auto' }
    },
    { 
      id: 'boundary', 
      name: 'Boundary', 
      icon: '4', 
      color: 'from-green-400/20 to-green-500/20',
      data: { runs: 4, ball: 'auto' }
    },
    { 
      id: 'six', 
      name: 'Six', 
      icon: '6', 
      color: 'from-purple-400/20 to-purple-500/20',
      data: { runs: 6, ball: 'auto' }
    },
    { 
      id: 'wicket', 
      name: 'Wicket', 
      icon: 'W', 
      color: 'from-red-400/20 to-red-500/20',
      data: { runs: 0, wicket: true, ball: 'auto' }
    },
    { 
      id: 'no_ball', 
      name: 'No Ball', 
      icon: 'NB', 
      color: 'from-orange-400/20 to-orange-500/20',
      data: { runs: 1, extras: { noBall: true } }
    },
    { 
      id: 'wide', 
      name: 'Wide', 
      icon: 'WD', 
      color: 'from-yellow-400/20 to-yellow-500/20',
      data: { runs: 1, extras: { wide: true } }
    },
  ];

  const handleTemplateClick = (template) => {
    setActiveTemplate(template.id);
    onApplyTemplate(template.data);
    setTimeout(() => setActiveTemplate(null), 200);
  };

  return (
    <div className="mb-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
      <h4 className="text-sm font-semibold text-white/80 mb-3">Quick Actions</h4>
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className={`px-4 py-2 bg-gradient-to-r ${template.color} border border-white/20 
                     rounded-lg text-white font-medium hover:scale-105 transform transition-all 
                     duration-200 shadow-lg hover:shadow-white/10 flex items-center gap-2
                     ${activeTemplate === template.id ? 'ring-2 ring-white/40 scale-105' : ''}`}
          >
            <span className="text-lg font-bold">{template.icon}</span>
            <span className="text-sm">{template.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickTemplates;
```

---

## 4. Real-Time Validation Component

### Validation Feedback
```jsx
// components/ValidationFeedback.jsx
const ValidationFeedback = ({ type, message, isVisible }) => {
  if (!isVisible) return null;

  const validationStyles = {
    error: 'from-red-500/20 to-red-600/20 border-red-400/30 text-red-200',
    warning: 'from-orange-500/20 to-orange-600/20 border-orange-400/30 text-orange-200',
    success: 'from-green-500/20 to-green-600/20 border-green-400/30 text-green-200',
    info: 'from-blue-500/20 to-blue-600/20 border-blue-400/30 text-blue-200',
  };

  const icons = {
    error: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    success: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${validationStyles[type]} 
                   border backdrop-blur-md rounded-lg text-sm font-medium shadow-lg animate-fade-in`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};

export default ValidationFeedback;
```

---

## 5. Enhanced Cell Component

### Glassmorphic Data Cell
```jsx
// components/EnhancedCell.jsx
import { useState, useEffect } from 'react';
import ValidationFeedback from './ValidationFeedback';

const EnhancedCell = ({ 
  value, 
  onChange, 
  type = 'text', 
  validation,
  className = '',
  placeholder,
  options = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [validationState, setValidationState] = useState(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleValidation = (val) => {
    if (validation) {
      const result = validation(val);
      setValidationState(result);
      return result.isValid;
    }
    return true;
  };

  const handleBlur = () => {
    if (handleValidation(tempValue)) {
      onChange(tempValue);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
      setValidationState(null);
    }
  };

  const cellStyles = {
    runs: 'bg-blue-500/10 border-blue-400/20 focus:bg-blue-500/20 focus:border-blue-400/40',
    wicket: 'bg-red-500/10 border-red-400/20 focus:bg-red-500/20 focus:border-red-400/40',
    extras: 'bg-orange-500/10 border-orange-400/20 focus:bg-orange-500/20 focus:border-orange-400/40',
    default: 'bg-white/5 border-white/10 focus:bg-white/10 focus:border-white/20'
  };

  const currentStyle = cellStyles[type] || cellStyles.default;

  if (isEditing) {
    return (
      <div className="relative">
        {type === 'select' ? (
          <select
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`w-full px-3 py-2 ${currentStyle} backdrop-blur-md border rounded-lg 
                     text-white focus:outline-none transition-all duration-200 shadow-lg`}
            autoFocus
          >
            <option value="" className="bg-gray-800">{placeholder}</option>
            {options.map(option => (
              <option key={option.value} value={option.value} className="bg-gray-800">
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full px-3 py-2 ${currentStyle} backdrop-blur-md border rounded-lg 
                     text-white placeholder-white/50 focus:outline-none transition-all duration-200 shadow-lg`}
            autoFocus
          />
        )}
        
        {validationState && !validationState.isValid && (
          <div className="absolute top-full left-0 mt-1 z-10">
            <ValidationFeedback 
              type="error" 
              message={validationState.message} 
              isVisible={true} 
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`w-full px-3 py-2 ${currentStyle} backdrop-blur-md border rounded-lg 
                 text-white cursor-pointer hover:bg-white/10 transition-all duration-200 
                 shadow-lg ${className}`}
    >
      <span className={value ? 'text-white' : 'text-white/50'}>
        {value || placeholder}
      </span>
    </div>
  );
};

export default EnhancedCell;
```

---

## 6. Floating Action Panel

### Quick Actions Floating Panel
```jsx
// components/FloatingActionPanel.jsx
import { useState } from 'react';

const FloatingActionPanel = ({ onSave, onAddRow, onExport }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className={`relative transition-all duration-300 ${isExpanded ? 'scale-100' : 'scale-0'}`}>
        <div className="absolute bottom-16 right-0 flex flex-col gap-3">
          <button
            onClick={onExport}
            className="px-4 py-3 bg-gradient-to-r from-gray-500/20 to-gray-600/20 
                     backdrop-blur-xl border border-white/20 rounded-xl text-white 
                     hover:scale-105 transform transition-all duration-200 shadow-lg 
                     hover:shadow-gray-500/25 flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          
          <button
            onClick={onAddRow}
            className="px-4 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                     backdrop-blur-xl border border-white/20 rounded-xl text-white 
                     hover:scale-105 transform transition-all duration-200 shadow-lg 
                     hover:shadow-blue-500/25 flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Row
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 
                 backdrop-blur-xl border border-white/20 rounded-full text-white 
                 hover:scale-110 transform transition-all duration-200 shadow-xl 
                 hover:shadow-green-500/30 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
        </svg>
      </button>
    </div>
  );
};

export default FloatingActionPanel;
```

---

## 7. Progress Indicator

### Data Entry Progress
```jsx
// components/ProgressIndicator.jsx
const ProgressIndicator = ({ currentInnings, totalBalls, completedBalls, errors }) => {
  const progress = (completedBalls / totalBalls) * 100 || 0;

  return (
    <div className="mb-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white/80">Innings {currentInnings} Progress</h4>
        <div className="flex items-center gap-4">
          {errors > 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">{errors} errors</span>
            </div>
          )}
          <span className="text-sm text-white/60">{completedBalls}/{totalBalls} balls</span>
        </div>
      </div>
      
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full 
                   transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2">
        <span className="text-xs text-white/50">Progress</span>
        <span className="text-xs text-white/50">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default ProgressIndicator;
```

---

## 8. Stats Summary Card

### Enhanced Statistics Display
```jsx
// components/StatsSummaryCard.jsx
const StatsSummaryCard = ({ title, stats, color = 'blue' }) => {
  const colorStyles = {
    blue: 'from-blue-500/20 to-purple-500/20 border-blue-400/20',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-400/20',
    green: 'from-green-500/20 to-emerald-500/20 border-green-400/20',
  };

  return (
    <div className={`p-6 bg-gradient-to-br ${colorStyles[color]} backdrop-blur-xl 
                  border border-white/20 rounded-2xl shadow-2xl`}>
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/60 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsSummaryCard;
```

---

## Usage Examples

### Integration in Main Component
```jsx
// Example usage in live-score-csv/page.tsx
import PlayerAutoComplete from '../components/PlayerAutoComplete';
import QuickTemplates from '../components/QuickTemplates';
import EnhancedCell from '../components/EnhancedCell';
import ProgressIndicator from '../components/ProgressIndicator';
import FloatingActionPanel from '../components/FloatingActionPanel';

// In your table rendering:
<td className="p-2">
  <EnhancedCell
    value={cell}
    onChange={(newValue) => updateCell(rowIndex, colIndex, newValue)}
    type="runs"
    validation={(value) => {
      const runs = parseInt(value);
      if (isNaN(runs) || runs < 0 || runs > 6) {
        return { isValid: false, message: 'Runs must be 0-6' };
      }
      return { isValid: true };
    }}
  />
</td>

<td className="p-2">
  <PlayerAutoComplete
    players={availablePlayers}
    value={cell}
    onChange={(newValue) => updateCell(rowIndex, colIndex, newValue)}
    placeholder="Select striker..."
  />
</td>
```

---

## Customization Guidelines

### Color Themes
```css
/* Glassmorphism color variables */
:root {
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-bg-hover: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-border-hover: rgba(255, 255, 255, 0.2);
  --glass-blur: blur(12px);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Animation Classes
```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
```

These components maintain the modern glassmorphism aesthetic while adding significant functionality and user experience improvements to the live score CSV page.
