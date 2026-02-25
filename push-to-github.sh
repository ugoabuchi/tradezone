#!/bin/bash

# TradeZone GitHub Push Script
# This script helps you push your local repository to GitHub

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     TradeZone - Push to GitHub                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    echo "Run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

echo "📋 Current Repository Status:"
echo "   Branch: $(git branch --show-current)"
echo "   Commits: $(git log --oneline 2>/dev/null | wc -l)"
echo "   Files: $(git ls-files | wc -l)"
echo ""

# Ask for GitHub username
read -p "🔑 Enter your GitHub username: " github_username

if [ -z "$github_username" ]; then
    echo "❌ GitHub username cannot be empty"
    exit 1
fi

# Ask for repository name
read -p "📦 Enter repository name (default: tradezone): " repo_name
repo_name="${repo_name:-tradezone}"

# Ask for authentication method
echo ""
echo "🔐 Choose authentication method:"
echo "  1) HTTPS with Personal Access Token"
echo "  2) SSH"
read -p "Select (1 or 2): " auth_method

case $auth_method in
    1)
        echo ""
        echo "📌 HTTPS METHOD SELECTED"
        echo ""
        echo "⚠️  You'll need a Personal Access Token from GitHub:"
        echo "   1. Go to: https://github.com/settings/tokens"
        echo "   2. Click 'Generate new token'"
        echo "   3. Name it: 'TradeZone Push'"
        echo "   4. Check 'repo' scope"
        echo "   5. Click 'Generate token' and COPY it"
        echo ""
        read -p "Press Enter when you have your token ready..."
        
        remote_url="https://github.com/${github_username}/${repo_name}.git"
        ;;
    2)
        echo ""
        echo "📌 SSH METHOD SELECTED"
        echo ""
        echo "⚠️  Make sure you have:"
        echo "   1. SSH key generated: ssh-keygen -t rsa -b 4096"
        echo "   2. Public key added to GitHub: https://github.com/settings/keys"
        echo ""
        remote_url="git@github.com:${github_username}/${repo_name}.git"
        ;;
    *)
        echo "❌ Invalid selection"
        exit 1
        ;;
esac

echo ""
echo "🔗 Repository URL: $remote_url"
echo ""
read -p "📝 Create this repository on GitHub now, then press Enter to continue..."

# Check if remote already exists
if git remote | grep -q origin; then
    echo ""
    echo "⚠️  Remote 'origin' already exists. Removing..."
    git remote remove origin
fi

echo ""
echo "🔄 Adding remote origin..."
git remote add origin "$remote_url"

echo "🌿 Renaming branch to 'main'..."
git branch -M main

echo "📤 Pushing to GitHub..."
echo "   (This may take a minute...)"
echo ""

if git push -u origin main; then
    echo ""
    echo "✅ SUCCESS! Repository pushed to GitHub!"
    echo ""
    echo "📊 Repository Details:"
    echo "   URL: https://github.com/${github_username}/${repo_name}"
    echo "   Branch: main"
    echo "   Commits: $(git log --oneline | wc -l)"
    echo "   Files: $(git ls-files | wc -l)"
    echo ""
    echo "🎉 Your TradeZone codebase is now on GitHub!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Visit: https://github.com/${github_username}/${repo_name}"
    echo "   2. Add description and topics"
    echo "   3. Add collaborators if needed"
    echo "   4. Enable GitHub Actions for CI/CD (optional)"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "   • GitHub username is correct"
    echo "   • Repository exists on GitHub"
    echo "   • Authentication method is properly configured"
    echo ""
    exit 1
fi
