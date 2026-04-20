#!/bin/bash
# Tribunal Tester Utility

echo "🧪 [Tester] Initializing dry-run..."

# Detect language and run basic check
if [ -f "package.json" ]; then
    echo "📦 Node.js project detected. Running type-check..."
    npm run type-check || echo "⚠️ Type-check failed or script missing."
elif [ -f "requirements.txt" ]; then
    echo "🐍 Python project detected. Running lint check..."
    flake8 . || echo "⚠️ Flake8 check failed or not installed."
fi

echo "✅ [Tester] Environment scan complete."