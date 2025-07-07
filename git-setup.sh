#!/bin/bash

# Git Setup Script for Chebichat AI Assistant
# Created: July 8, 2025
# Description: Initialize Git repository and push to GitHub for Chebichat AI Assistant - 
# An advanced AI-powered language learning assistant with intelligent conversation capabilities

echo "🚀 Git Setup Script for Chebichat AI Assistant"
echo "=============================================="

# Variables
REPO_URL="https://github.com/quangdn-ght/chebichat-assistant/"

# Check if commit message is provided as argument
if [ $# -eq 0 ]; then
    echo "📝 No commit message provided. Using default message..."
    COMMIT_MESSAGE="feat: initialize Chebichat AI Assistant - Advanced AI-powered language learning platform"
else
    COMMIT_MESSAGE="$*"
    echo "📝 Using custom commit message: '$COMMIT_MESSAGE'"
fi

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 completed successfully"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# Function to display usage information
show_usage() {
    echo ""
    echo "📖 Usage:"
    echo "  ./git-setup.sh [commit message]"
    echo ""
    echo "Examples:"
    echo "  ./git-setup.sh                                          # Uses default commit message"
    echo "  ./git-setup.sh \"feat: add new AI conversation features\"  # Custom commit message"
    echo "  ./git-setup.sh \"fix: resolve language model integration\" # Another example"
    echo "  ./git-setup.sh \"docs: update AI assistant documentation\" # Documentation update"
    echo ""
}

# Check if repository already exists
if [ -d ".git" ]; then
    echo "⚠️  Git repository already exists in this directory."
    echo "🔄 This script will add, commit, and push changes to the existing repository."
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operation cancelled by user."
        exit 1
    fi
    REPO_EXISTS=true
else
    REPO_EXISTS=false
fi

# Step 1: Initialize Git repository (if needed)
if [ "$REPO_EXISTS" = false ]; then
    echo "📁 Step 1: Initializing Git repository..."
    git init
    check_status "Git initialization"
    
    echo "🔗 Step 1.1: Adding remote repository..."
    git remote add origin "$REPO_URL"
    check_status "Adding remote origin"
else
    echo "📁 Step 1: Using existing Git repository..."
fi

# Step 2: Add all files to staging area
echo "📦 Step 2: Adding all files to staging area..."
git add .
check_status "Adding files to staging"

# Check if there are any changes to commit
if git diff --cached --quiet; then
    echo "⚠️  No changes detected to commit."
    echo "📊 Current repository status:"
    git status --short
    exit 0
fi

# Step 3: Create commit
echo "� Step 3: Creating commit with message: '$COMMIT_MESSAGE'..."
git commit -m "$COMMIT_MESSAGE"
check_status "Creating commit"

# Step 4: Push to GitHub
echo "⬆️ Step 4: Pushing to GitHub repository..."
if [ "$REPO_EXISTS" = false ]; then
    git push -u origin main
else
    git push
fi
check_status "Pushing to GitHub"

echo ""
echo "🎉 Git operations completed successfully!"
echo "📍 Repository URL: $REPO_URL"
echo "🌟 Your Chebichat AI Assistant is now synced with GitHub!"
echo "🤖 Ready to power intelligent language learning conversations!"

# Display repository status
echo ""
echo "📊 Current Git Status:"
git status --short

echo ""
echo "📝 Recent Commits:"
git log --oneline -5

echo ""
echo "🔄 Useful Git Commands for Future Development:"
echo "  git status              - Check repository status"
echo "  git add <file>          - Stage specific files"
echo "  git add .               - Stage all changes"
echo "  git commit -m 'message' - Commit staged changes"
echo "  git push                - Push commits to GitHub"
echo "  git pull                - Pull latest changes from GitHub"
echo "  git branch              - List branches"
echo "  git checkout -b <name>  - Create new branch"
echo "  git log --oneline       - View commit history"
echo "  git diff                - View unstaged changes"
echo "  git diff --cached       - View staged changes"

echo ""
echo "📚 Chebichat AI Assistant Development Tips:"
echo "  • Use conventional commits: feat:, fix:, docs:, style:, refactor:, test:"
echo "  • Test AI conversation flows and language learning features before committing"
echo "  • Update README.md when adding new AI capabilities or language support"
echo "  • Consider performance impact for real-time AI responses"
echo "  • Ensure proper error handling for AI API integrations"

show_usage
