#!/bin/bash

# This would require user credentials, but we can't do this in cloud environment
# Let's try to use the existing GitHub CLI or a different approach

# First, let's check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo "GitHub CLI found"
    gh auth status
else
    echo "GitHub CLI not found"
    
    # Try to install it
    apt-get update -qq && apt-get install -y -qq gh 2>/dev/null || echo "Could not install gh"
fi
