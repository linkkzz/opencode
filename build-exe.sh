#!/bin/bash

set -e  # 遇到错误立即退出

# 进入 desktop 目录
cd "$(dirname "$0")/packages/desktop"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "📦 CloudModel Desktop Windows Build Script"
echo "========================================="
echo ""

# 1. 设置默认版本号
DEFAULT_VERSION="0.0.1"
CURRENT_VERSION=$DEFAULT_VERSION
echo "📌 Starting version: ${CURRENT_VERSION}"
echo ""

# 2. 用户确认是否 bump 版本号
echo -e "${YELLOW}Do you want to bump the version number?${NC}"
echo "  (y) Yes, increment patch version (e.g., 0.0.1 -> 0.0.2)"
echo "  (n) No, keep current version"
echo "  (s) Specify custom version"
echo ""
read -p "Choose option [y/n/s]: " CHOICE

# 3. 处理版本号
NEW_VERSION="$CURRENT_VERSION"
case $CHOICE in
  [yY])
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
      echo -e "${RED}✗ Invalid version format. Using current version.${NC}"
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
  sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
  rm -f package.json.bak
  echo -e "${GREEN}✓ Updated package.json${NC}"
fi

echo ""
echo "========================================="
echo "🔨 Building..."
echo "========================================="
echo ""

bun x @tauri-apps/cli build \
  --bundles nsis \
  --target x86_64-pc-windows-msvc

echo -e "${GREEN}✓ Tauri app built${NC}"

echo ""
echo "========================================="
echo "📦 Build Artifacts:"
echo "========================================="

EXE_DIR="src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis"

# 查找并显示生成的 exe 文件
if [ -d "$EXE_DIR" ]; then
  EXE_FILE=$(find "$EXE_DIR" -name "*.exe" -type f | head -n 1)
  if [ -f "$EXE_FILE" ]; then
    EXE_SIZE=$(ls -lh "$EXE_FILE" | awk '{print $5}')
    echo -e "${GREEN}✓ Installer created (${EXE_SIZE})${NC}"
    echo ""
    echo "-----------------------------------------"
    echo "📂 Output Path:"
    echo "-----------------------------------------"
    echo "$(pwd)/${EXE_FILE}"
    echo ""
    if [ -f "${EXE_FILE}.sha256" ]; then
      echo "$(pwd)/${EXE_FILE}.sha256"
    fi
    echo "-----------------------------------------"
  else
    echo -e "${RED}✗ No installer found in build directory${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ Build directory not found: $EXE_DIR${NC}"
  exit 1
fi

echo ""
echo "========================================="
echo "✨ Build completed successfully!"
echo "========================================="
