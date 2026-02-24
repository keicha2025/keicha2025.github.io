#!/bin/bash
echo "🚀 Starting Sync to keicha-membership-system.web.app..."
bundle exec jekyll build
if [ $? -eq 0 ]; then
  echo "✅ Build successful. Deploying to Firebase..."
  npx -y firebase-tools deploy --only hosting,firestore:rules
else
  echo "❌ Build failed. Please check the errors above."
  exit 1
fi
