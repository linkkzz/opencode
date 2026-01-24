#!/bin/bash

set -e  # 遇到错误立即退出

# 进入 desktop 目录
cd "$(dirname "$0")/packages/desktop"

echo "🚀 Starting CloudModel Desktop development server..."
echo "📂 Working directory: $(pwd)"
echo ""
echo "The app will open automatically."
echo "Press Ctrl+C to stop the server."
echo ""

bun run tauri dev
