#!/bin/bash
# Universal Tribunal Tester Utility

echo "🧪 [Tester] Detecting environment..."

if [ -f "package.json" ]; then
    echo "📦 Node.js/Bun detected."
    [ -f "bun.lockb" ] && bun test || npm test
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo "🐍 Python detected. Running pytest..."
    pytest || python -m unittest
elif [ -f "go.mod" ]; then
    echo "🐹 Go detected. Running tests..."
    go test ./...
elif [ -f "Cargo.toml" ]; then
    echo "🦀 Rust detected. Running cargo test..."
    cargo test
elif [ -f "Makefile" ]; then
    echo "🛠️ Makefile found. Running 'make test'..."
    make test
else
    echo "❓ No standard test runner detected. Please run tests manually."
    exit 1
fi

echo "✅ [Tester] Execution complete."