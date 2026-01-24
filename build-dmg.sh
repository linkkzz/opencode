#!/bin/bash

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 进入 desktop 目录
cd "$(dirname "$0")/packages/desktop"

echo "========================================="
echo "📦 CloudModel Desktop Build Script"
echo "========================================="
echo ""

# 1. 读取当前版本号
CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
echo "📌 Current version: ${CURRENT_VERSION}"
echo ""

# 2. 用户确认是否 bump 版本号
echo -e "${YELLOW}Do you want to bump the version number?${NC}"
echo "  (y) Yes, increment patch version (e.g., 1.1.25 → 1.1.26)"
echo "  (n) No, keep current version"
echo "  (s) Specify custom version"
echo ""
read -p "Choose option [y/n/s]: " CHOICE

# 3. 处理版本号
NEW_VERSION="$CURRENT_VERSION"
case $CHOICE in
  [yY])
    # 版本号格式：1.1.25
    MAJOR=$(echo $CURRENT_VERSION | cut -d. -f1)
    MINOR=$(echo $CURRENT_VERSION | cut -d. -f2)
    PATCH=$(echo $CURRENT_VERSION | cut -d. -f3)
    NEW_PATCH=$((PATCH + 1))
    NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}"
    echo -e "${GREEN}✓ Bumped to version: ${NEW_VERSION}${NC}"
    ;;
  [sS])
    read -p "Enter new version (format: 1.1.26): " NEW_VERSION
    if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo -e "${RED}❌ Invalid version format. Using current version.${NC}"
      NEW_VERSION="$CURRENT_VERSION"
    else
      echo -e "${GREEN}✓ Custom version: ${NEW_VERSION}${NC}"
    fi
    ;;
  *)
    echo -e "${GREEN}✓ Keeping current version: ${CURRENT_VERSION}${NC}"
    ;;
esac

# 更新 package.json
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
  sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
  echo -e "${GREEN}✓ Updated package.json${NC}"
fi

echo ""
echo "========================================="
echo "🔨 Starting build process..."
echo "========================================="
echo ""

# 4. 构建前端（跳过类型检查）
echo "Step 1/4: Building frontend..."
bun x vite build
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# 5. 构建 Tauri 应用
echo "Step 2/4: Building Tauri app (ARM64)..."
bun x @tauri-apps/cli build --bundles app,dmg --target aarch64-apple-darwin
echo -e "${GREEN}✓ Tauri app built${NC}"
echo ""

# 6. Ad-hoc 签名
echo "Step 3/4: Signing app..."
cd src-tauri/target/release/bundle/macos
codesign --force --deep --sign - "CloudModel Desktop.app"
cd ../../../../../..
echo -e "${GREEN}✓ App signed${NC}"
echo ""

# 7. 显示构建结果
echo "Step 4/4: Build complete!"
echo ""
echo "========================================="
echo "📦 Build Artifacts:"
echo "========================================="
echo ""

DMG_PATH="src-tauri/target/release/bundle/dmg/CloudModel Desktop_${NEW_VERSION}_aarch64.dmg"
APP_PATH="src-tauri/target/release/bundle/macos/CloudModel Desktop.app"

if [ -f "$DMG_PATH" ]; then
  DMG_SIZE=$(du -h "$DMG_PATH" | cut -f1)
  echo -e "${GREEN}✓ DMG Package:${NC}"
  echo "  File: $DMG_PATH"
  echo "  Size: $DMG_SIZE"
  echo ""
fi

if [ -d "$APP_PATH" ]; then
  APP_SIZE=$(du -sh "$APP_PATH" | cut -f1)
  echo -e "${GREEN}✓ Application:${NC}"
  echo "  File: $APP_PATH"
  echo "  Size: $APP_SIZE"
  echo ""
fi

echo "========================================="
echo "✨ Build completed successfully!"
echo "========================================="
