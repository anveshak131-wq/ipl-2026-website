#!/bin/bash
# Script to restore all IPL players
# Usage: ./restore-all-players.sh [your-domain]

DOMAIN=${1:-"ipl-2026-website.pages.dev"}

echo "🔄 Restoring IPL players to $DOMAIN..."
echo ""

# First, restore starter set
echo "Step 1: Restoring starter set..."
curl -s "https://$DOMAIN/api/restore-players?restoreAll=true" | jq

echo ""
echo "✅ Starter set restored!"
echo ""
echo "📝 Next steps:"
echo "1. If you have a backup file with your 200+ players, use:"
echo "   curl -X POST https://$DOMAIN/api/restore-players \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d @your-players-backup.json"
echo ""
echo "2. Check current players:"
echo "   curl https://$DOMAIN/api/players?diagnostic=true | jq"

