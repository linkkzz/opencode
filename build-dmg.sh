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

# 1. 设置默认版本号
DEFAULT_VERSION="0.0.1"
CURRENT_VERSION=$DEFAULT_VERSION
echo "📌 Starting version: ${CURRENT_VERSION}"
echo ""

# 2. 用户确认是否 bump 版本号
echo -e "${YELLOW}Do you want to bump the version number?${NC}"
echo "  (y) Yes, increment patch version (e.g., 0.0.1 → 0.0.2)"
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
echo "🔨 Building..."
echo "========================================="
echo ""

bun x @tauri-apps/cli build \
  --bundles app \
  --target aarch64-apple-darwin \
  --no-sign
echo -e "${GREEN}✓ Tauri app built (unsigned)${NC}"

echo ""
echo "========================================="
echo "📦 Build Artifacts:"
echo "========================================="

APP_PATH="src-tauri/target/aarch64-apple-darwin/release/bundle/macos/CloudModel Desktop.app"
TEMP_DMG_DIR="/tmp/cloudmodel-dmg-$$"
TEMP_RW_DMG="/tmp/cloudmodel-rw-$$$.dmg"
TEMP_MOUNT_DIR="/tmp/cloudmodel-mount-$$"
FINAL_DMGS_DIR="src-tauri/target/aarch64-apple-darwin/release/bundle/dmg"
FINAL_DMG_PATH="${FINAL_DMGS_DIR}/CloudModel Desktop_${NEW_VERSION}_aarch64.dmg"

# Remove Gatekeeper-blocking keys from Info.plist
if [ -d "$APP_PATH" ]; then
  INFO_PLIST="${APP_PATH}/Contents/Info.plist"
  if [ -f "$INFO_PLIST" ]; then
    plutil -remove CSResourcesFileMapped "$INFO_PLIST" 2>/dev/null || true
    plutil -remove LSRequiresCarbon "$INFO_PLIST" 2>/dev/null || true
    echo -e "${GREEN}✓ Removed Gatekeeper-blocking keys from Info.plist${NC}"
  fi
  
  # Remove quarantine attributes and resign
  echo -e "${YELLOW}Removing quarantine attributes from app...${NC}"
  xattr -cr "$APP_PATH" 2>/dev/null || true
  
  echo -e "${YELLOW}Resigning app with ad-hoc signature...${NC}"
  codesign --force --deep --sign - "$APP_PATH" 2>/dev/null || true
  echo -e "${GREEN}✓ App processed for distribution${NC}"
fi

# Create DMG manually from cleaned app
if [ -d "$APP_PATH" ]; then
  echo -e "${YELLOW}Creating DMG from cleaned app...${NC}"
  
  rm -rf "$TEMP_DMG_DIR"
  mkdir -p "$TEMP_DMG_DIR"
  mkdir -p "$FINAL_DMGS_DIR"
  
  # Remove attributes from source app before copying
  xattr -cr "$APP_PATH" 2>/dev/null || true
  
  cp -R "$APP_PATH" "$TEMP_DMG_DIR/"
  
  # Create read-write DMG first
  APP_SIZE=$(du -sm "$TEMP_DMG_DIR" | cut -f1)
  DMG_SIZE=$((APP_SIZE + 20))
  
  hdiutil create -volname "CloudModel Desktop" \
    -size "${DMG_SIZE}m" \
    -type UDIF \
    -fs "HFS+" \
    -ov \
    "$TEMP_RW_DMG"
  
  # Mount the RW DMG
  rm -rf "$TEMP_MOUNT_DIR"
  mkdir -p "$TEMP_MOUNT_DIR"
  hdiutil attach -readwrite -mountpoint "$TEMP_MOUNT_DIR" "$TEMP_RW_DMG" > /dev/null 2>&1
  
  # Copy app to mounted DMG
  cp -R "$TEMP_DMG_DIR/CloudModel Desktop.app" "$TEMP_MOUNT_DIR/"
  
  # Remove attributes from app inside DMG
  xattr -cr "${TEMP_MOUNT_DIR}/CloudModel Desktop.app" 2>/dev/null || true
  
  # Unmount
  hdiutil detach "$TEMP_MOUNT_DIR" > /dev/null 2>&1
  
  # Convert to read-only compressed DMG
  hdiutil convert "$TEMP_RW_DMG" \
    -format UDZO \
    -imagekey zlib-level=9 \
    -o "$FINAL_DMG_PATH" > /dev/null 2>&1
  
  rm -rf "$TEMP_DMG_DIR"
  rm -f "$TEMP_RW_DMG"
  rm -rf "$TEMP_MOUNT_DIR"
  
  # Verify the DMG was created
  if [ -f "$FINAL_DMG_PATH" ]; then
    DMG_SIZE=$(ls -lh "$FINAL_DMG_PATH" | awk '{print $5}')
    echo -e "${GREEN}✓ DMG created (${DMG_SIZE})${NC}"
  else
    echo -e "${RED}✗ Failed to create DMG${NC}"
    exit 1
  fi
fi

DMG_PATH="$FINAL_DMG_PATH"

if [ -f "$DMG_PATH" ]; then
  echo "$(pwd)/${DMG_PATH}"
fi

if [ -d "$APP_PATH" ]; then
  echo "$(pwd)/${APP_PATH}"
fi

echo ""
echo "========================================="
echo "✨ Build completed successfully!"
echo "========================================="
