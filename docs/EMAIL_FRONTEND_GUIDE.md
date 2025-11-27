# Email Notifications - Frontend Developer Guide

## Quick Start

The email notification system is automatically integrated. Here's what you need to know as a frontend developer:

## User Flow (What Happens Automatically)

1. User signs up → Account created
2. User accepts terms and conditions → Modal syncs to backend automatically
3. User selects favorite teams → Stored in user preferences
4. 30 minutes before a match → User receives email reminder

**You don't need to do anything special!** The system handles everything after terms acceptance.

## Components & Hooks

### Terms Acceptance Modal
```typescript
import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';

<TermsAcceptanceModal
  isOpen={shouldShowModal}
  onAccept={handleAccept}
  onDecline={handleDecline}
  needsReAcceptance={false}
  lastAcceptanceDate={acceptanceDate}
/>
```

The modal now automatically:
- Stores acceptance in localStorage
- Syncs to backend via `/api/preferences`
- Enables email notifications by default

### Existing Hooks

```typescript
// Check if user accepted terms
import { useTermsAccepted } from '@/hooks/useTermsAccepted';
const accepted = useTermsAccepted();

// Get acceptance info
import { useTermsAcceptanceInfo } from '@/hooks/useTermsAccepted';
const { accepted, date } = useTermsAcceptanceInfo();
```

## API Endpoints for Frontend

### Get User Preferences
```typescript
async function getUserPreferences(token: string) {
  const response = await fetch('/api/preferences', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Response:
{
  email: "user@example.com",
  name: "User Name",
  termsAccepted: true,
  termsAcceptedDate: "2025-11-27T10:30:00Z",
  emailNotificationsEnabled: true,
  favoriteTeamIds: ["1", "2", "3"]
}
```

### Update User Preferences
```typescript
async function updatePreferences(token: string, updates: any) {
  const response = await fetch('/api/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  return response.json();
}

// Example usage:
await updatePreferences(token, {
  emailNotificationsEnabled: false, // Disable emails
});

// Or enable emails and set favorite teams:
await updatePreferences(token, {
  emailNotificationsEnabled: true,
  favoriteTeamIds: ['1', '2', '3'],
});
```

## Building a Preferences Page

Here's a template for a user preferences/settings page:

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState(null);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const response = await fetch('/api/preferences', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        setPreferences(data);
        setEmailEnabled(data.emailNotificationsEnabled);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Toggle email notifications
  const toggleEmailNotifications = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    
    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          emailNotificationsEnabled: !emailEnabled,
        }),
      });
      setEmailEnabled(!emailEnabled);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!preferences) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Preferences</h1>

      <div className="space-y-6">
        {/* Terms Acceptance */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10">
          <h2 className="text-xl font-semibold mb-2">Terms of Service</h2>
          <p className="text-gray-300">
            You accepted on {new Date(preferences.termsAcceptedDate).toLocaleDateString()}
          </p>
        </div>

        {/* Email Notifications */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
          <label className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={toggleEmailNotifications}
              disabled={loading}
              className="w-4 h-4"
            />
            <span>
              Receive match reminders 30 minutes before your favorite team's match
            </span>
          </label>
        </div>

        {/* Favorite Teams */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10">
          <h2 className="text-xl font-semibold mb-2">Favorite Teams</h2>
          <p className="text-gray-300">
            {preferences.favoriteTeamIds.length > 0
              ? `${preferences.favoriteTeamIds.length} teams selected`
              : 'No teams selected'}
          </p>
          <button className="mt-4 px-4 py-2 bg-ipl-gold text-black rounded hover:bg-yellow-300">
            Manage Teams
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Adding Favorite Teams Selection

Here's how to add favorite teams to a preferences page:

```typescript
import { useState, useEffect } from 'react';

const TEAMS = [
  { id: '1', name: 'Royal Challengers Bengaluru', shortName: 'RCB' },
  { id: '2', name: 'Mumbai Indians', shortName: 'MI' },
  { id: '3', name: 'Sunrisers Hyderabad', shortName: 'SRH' },
  // ... more teams
];

export function FavoriteTeamsSelector() {
  const [selected, setSelected] = useState<string[]>([]);
  const token = localStorage.getItem('auth_token');

  const handleToggleTeam = async (teamId: string) => {
    const newSelected = selected.includes(teamId)
      ? selected.filter(id => id !== teamId)
      : [...selected, teamId];
    
    setSelected(newSelected);

    // Save to backend
    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          favoriteTeamIds: newSelected,
        }),
      });
    } catch (error) {
      console.error('Failed to update teams:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {TEAMS.map(team => (
        <button
          key={team.id}
          onClick={() => handleToggleTeam(team.id)}
          className={`p-4 rounded border-2 transition ${
            selected.includes(team.id)
              ? 'border-ipl-gold bg-ipl-gold/10'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="font-bold">{team.shortName}</div>
          <div className="text-sm text-gray-300">{team.name}</div>
        </button>
      ))}
    </div>
  );
}
```

## Important Notes

### Authentication Required
All preference endpoints require an auth token:
```typescript
const token = localStorage.getItem('auth_token');
// or from session/context if you manage it differently
```

### Default Behavior
- Email notifications are **enabled by default** after terms acceptance
- Users can disable via preferences
- No emails sent if terms not accepted

### Privacy & Compliance
- Only users with `termsAccepted: true` receive emails
- Include unsubscribe links in your UI
- Respect user's `emailNotificationsEnabled` flag

### Testing Email Delivery

To test if a user would receive emails:

```typescript
async function checkEmailEligibility(token: string) {
  const response = await fetch('/api/preferences', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const user = await response.json();
  
  return {
    eligible: user.termsAccepted && user.emailNotificationsEnabled,
    teams: user.favoriteTeamIds,
    acceptedOn: user.termsAcceptedDate,
  };
}
```

## Troubleshooting

### "Unauthorized" when calling /api/preferences
- Check that auth_token is stored in localStorage
- Verify token is not expired
- Check Authorization header format: `Bearer {token}`

### User preferences not updating
- Check browser console for fetch errors
- Verify request body is valid JSON
- Ensure user is authenticated

### Emails not arriving
- Verify user has `termsAccepted: true` 
- Check `emailNotificationsEnabled: true`
- Verify user has `favoriteTeamIds` set
- Wait for scheduler to run (every 5 minutes)

## Related Files

- Backend: `/functions/api/preferences.js`
- Backend: `/functions/api/email-service.js`
- Scheduler: `/functions/scheduled-email-reminder.js`
- Setup Guide: `/docs/EMAIL_NOTIFICATION_SETUP.md`

---

**For support**, see the main setup guide or check Cloudflare logs.
