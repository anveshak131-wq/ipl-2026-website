#!/bin/bash

# Script to set up a private admin branch
# This creates a separate branch for admin code that can be kept private

set -e

echo "🔒 Setting up private admin branch..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📌 Current branch: $CURRENT_BRANCH"

# Create admin-private branch if it doesn't exist
if git show-ref --verify --quiet refs/heads/admin-private; then
    echo "⚠️  Branch 'admin-private' already exists"
    read -p "Do you want to switch to it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout admin-private
        echo "✅ Switched to admin-private branch"
    else
        echo "❌ Aborted"
        exit 1
    fi
else
    echo "🌿 Creating new 'admin-private' branch..."
    git checkout -b admin-private
    echo "✅ Created and switched to admin-private branch"
fi

echo ""
echo "📝 Next steps:"
echo "1. Your admin code is now in the 'admin-private' branch"
echo "2. Switch back to main: git checkout main"
echo "3. Remove admin files from main (if desired):"
echo "   git rm -r src/app/ipl-admin-2026/"
echo "   git commit -m 'Remove admin files from public branch'"
echo "4. Configure Cloudflare to deploy from 'admin-private' branch"
echo ""
echo "✅ Setup complete!"

