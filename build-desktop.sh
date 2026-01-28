#!/bin/bash

# ============================================================
# OpenCode Desktop Build Script
# 支持 macOS 和 Windows 构建（ macOS 本地构建 macOS，
# 或触发 GitHub Actions 构建 Windows）
# ============================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="${SCRIPT_DIR}/packages/desktop"
cd "$SCRIPT_DIR"

echo ""
echo "============================================================"
echo -e "${BLUE}OpenCode Desktop 构建脚本${NC}"
echo "============================================================"
echo ""

# 检测操作系统
OS_NAME="$(uname)"
case "$OS_NAME" in
    Darwin)
        PLATFORM="macos"
        ;;
    Linux)
        PLATFORM="linux"
        ;;
    *)
        echo -e "${RED}错误：不支持的操作系统: ${OS_NAME}${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}检测到平台：${PLATFORM}${NC}"
echo ""

# 显示菜单
echo "请选择构建选项："
echo ""
echo "  1) macOS 本地构建（当前：$PLATFORM）"
echo "  2) 构建 Windows（通过 GitHub Actions）"
echo "  3) macOS 本地构建 + 触发 Windows 构建"
echo "  4) 查看构建日志"
echo "  5) 下载构建产物"
echo "  6) 退出"
echo ""
read -p "请输入选项 [1-6]: " CHOICE
echo ""

case "$CHOICE" in
    1|macos|local)
        # macOS 本地构建
        if [[ "$PLATFORM" != "macos" ]]; then
            echo -e "${RED}错误：macOS 本地构建只能在 macOS 上运行${NC}"
            exit 1
        fi
        
        echo "============================================================"
        echo -e "${BLUE}开始 macOS 本地构建...${NC}"
        echo "============================================================"
        echo ""
        
        # 运行现有的 build-dmg.sh 脚本
        if [[ -f "$SCRIPT_DIR/build-dmg.sh" ]]; then
            bash "$SCRIPT_DIR/build-dmg.sh"
        else
            echo "错误：未找到 build-dmg.sh 脚本"
            exit 1
        fi
        
        echo ""
        echo -e "${GREEN}✓ macOS 构建完成！${NC}"
        ;;
        
    2|windows|gh)
        # 通过 GitHub Actions 构建 Windows
        echo "============================================================"
        echo -e "${BLUE}请求 GitHub Actions 构建 Windows 版本...${NC}"
        echo "============================================================"
        echo ""
        
        if ! command -v gh &> /dev/null; then
            echo -e "${RED}错误：未安装 GitHub CLI (gh)${NC}"
            echo ""
            echo "请先安装 GitHub CLI："
            echo "  brew install gh"
            echo ""
            echo "然后登录："
            echo "  gh auth login"
            exit 1
        fi
        
        if ! gh auth status &> /dev/null; then
            echo -e "${RED}错误：未登录 GitHub CLI${NC}"
            echo ""
            echo "请先登录："
            echo "  gh auth login"
            exit 1
        fi
        
        echo "是否手动触发 Windows 构建？[Y/n]"
        read -r CONFIRM
        
        if [[ "${CONFIRM}" =~ ^[Nn]$ ]]; then
            echo "已取消"
            exit 0
        fi
        
        echo ""
        echo "正在触发构建..."
        gh workflow run build-windows-desktop.yml || {
            # 如果 workflow 不存在，提示用户创建
            echo -e "${YELLOW}错误：未找到 build-windows-desktop.yml workflow${NC}"
            echo ""
            echo "请确保："
            echo "  1. 已将此仓库 fork 到您的 GitHub 账户"
            echo "  2. 已添加 .github/workflows/build-windows-desktop.yml 文件"
            echo ""
            exit 1
        }
        
        echo -e "${GREEN}✓ 构建请求已发送！${NC}"
        echo ""
        echo "查看构建状态："
        echo "  gh run list --workflow=build-windows-desktop.yml"
        echo "  gh run watch"
        echo ""
        echo "查看 Actions 页面："
        echo "  $(git remote get-url fork 2>/dev/null || git remote get-url origin 2>/dev/null | sed 's|\.git$||')/actions"
        ;;
        
    3|both|all)
        # macOS 本地构建 + 触发 Windows 构建
        if [[ "$PLATFORM" != "macos" ]]; then
            echo -e "${RED}错误：macOS 本地构建只能在 macOS 上运行${NC}"
            exit 1
        fi
        
        echo "============================================================"
        echo -e "${BLUE}开始 macOS 本地构建...${NC}"
        echo "============================================================"
        echo ""
        
        # macOS 本地构建
        if [[ -f "$SCRIPT_DIR/build-dmg.sh" ]]; then
            bash "$SCRIPT_DIR/build-dmg.sh"
        else
            echo "错误：未找到 build-dmg.sh 脚本"
            exit 1
        fi
        
        echo ""
        echo "============================================================"
        echo -e "${BLUE}请求 GitHub Actions 构建 Windows 版本...${NC}"
        echo "============================================================"
        echo ""
        
        if ! command -v gh &> /dev/null; then
            echo -e "${YELLOW}警告：未安装 GitHub CLI，跳过 Windows 构建${NC}"
        elif ! gh auth status &> /dev/null; then
            echo -e "${YELLOW}警告：未登录 GitHub CLI，跳过 Windows 构建${NC}"
        else
            gh workflow run build-windows-desktop.yml && {
                echo -e "${GREEN}✓ Windows 构建请求已发送！${NC}"
            } || {
                echo -e "${YELLOW}警告：Windows 构建请求失败${NC}"
            }
        fi
        
        echo ""
        echo -e "${GREEN}✓ 构建流程完成！${NC}"
        ;;
        
    4|logs)
        # 查看构建日志
        echo "============================================================"
        echo -e "${BLUE}构建日志${NC}"
        echo "============================================================"
        echo ""
        
        if ! command -v gh &> /dev/null; then
            echo -e "${RED}错误：未安装 GitHub CLI${NC}"
            exit 1
        fi
        
        if ! gh auth status &> /dev/null; then
            echo -e "${RED}错误：未登录 GitHub CLI${NC}"
            exit 1
        fi
        
        echo "最近的 Windows 构建运行："
        echo ""
        gh run list --workflow=build-windows-desktop.yml --limit 10 || echo "  (无历史运行)"
        
        echo ""
        echo "最近的 macOS 构建运行："
        echo ""
        gh run list --workflow=build-macos-desktop.yml --limit 10 2>/dev/null || echo "  (无历史运行)"
        ;;
        
    5|download)
        # 下载构建产物
        echo "============================================================"
        echo -e "${BLUE}下载构建产物${NC}"
        echo "============================================================"
        echo ""
        
        if ! command -v gh &> /dev/null; then
            echo -e "${RED}错误：未安装 GitHub CLI${NC}"
            exit 1
        fi
        
        if ! gh auth status &> /dev/null; then
            echo -e "${RED}错误：未登录 GitHub CLI${NC}"
            exit 1
        fi
        
        echo "列出可用的构建产物："
        echo ""
        
        # 选择构建运行
        SELECTED_RUN=$(gh run list --workflow=build-windows-desktop.yml --limit 10 | tail -n +2 | head -n 5)
        if [[ -z "$SELECTED_RUN" ]]; then
            echo "未找到 Windows 构建运行"
            exit 1
        fi
        
        echo "$SELECTED_RUN"
        echo ""
        
        RUN_ID=$(echo "$SELECTED_RUN" | head -n 1 | awk '{print $7}')
        echo "选择要下载的运行 ID（或输入 ID）："
        read -p "> " INPUT_RUN_ID
        
        RUN_ID="${INPUT_RUN_ID:-$RUN_ID}"
        
        echo ""
        echo "正在下载构建产物..."
        if gh run download "$RUN_ID"; then
            echo -e "${GREEN}✓ 下载完成！${NC}"
            echo ""
            ls -lh | grep -i "opencode-desktop"
        else
            echo -e "${RED}下载失败${NC}"
            exit 1
        fi
        ;;
        
    6|exit|quit)
        echo "退出"
        exit 0
        ;;
        
    *)
        echo -e "${RED}无效选项${NC}"
        exit 1
        ;;
esac

echo ""
echo "============================================================"
echo -e "${GREEN}执行完成！${NC}"
echo "============================================================"
echo ""
