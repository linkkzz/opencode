# macOS 安装指南

## ⚠️ 重要提示

本软件为内部使用版本，未进行代码签名。首次安装和运行时可能会看到 macOS 安全警告，**这是正常现象，可以安全继续。**

---

## 📥 安装步骤

### 方法一：从 DMG 安装（推荐）

1. **下载 DMG 文件**
   - 从分享链接下载 `.dmg` 安装包（如 `OpenCode_1.0.0_aarch64.dmg`）
   - 文件大小约 100-200MB

2. **打开 DMG 文件**
   - 双击 DMG 文件
   - 会挂载并打开一个新窗口，显示 OpenCode.app

3. **安装应用**

   **方式 A：拖拽到应用程序文件夹**
   - 将 OpenCode.app 拖拽到"应用程序"文件夹
   - 等待复制完成（需要 1-2 分钟）

   **方式 B：直接打开（测试使用）**
   - 直接双击 OpenCode.app
   - 可能需要处理安全警告（见下文）

4. **卸载 DMG**
   - 复制完成后，弹出 DMG 磁盘
   - 删除下载的 DMG 文件（可选）

---

### 方法二：直接使用 App 文件

1. **下载并解压**
   - 从分享链接下载包含 `.app` 的压缩包
   - 解压到任意位置

2. **移动到应用程序**

   ```bash
   cp -R OpenCode.app /Applications/
   ```

3. **处理安全警告并启动**

---

## 🚀 启动应用

### 首次启动

第一次启动时，macOS 会显示安全警告：

```
✕ 云无法验证"OpenCode"
云无法验证"OpenCode"是否包含恶意软件。

此软件已从互联网下载。

"云模"已检查 macOS，但在该软件上发现了潜在问题。

建议移到废纸篓。

[移到废纸篓]  [更多信息...]
```

**解决方法：**

#### 方式 1：右键打开（推荐）

1. 在 Finder 中右键点击 OpenCode.app
2. 选择 **"打开"**（不是双击！）
3. 点击 **"打开"** 确认对话框

完成后，以后可以正常双击打开。

#### 方式 2：在系统设置中允许

1. 打开 **"系统设置"** → **"隐私与安全性"**
2. 向下滚动，找到 "OpenCode 已被阻止"
3. 点击 **"仍要打开"**

#### 方式 3：使用终端（高级用户）

```bash
# 移除隔离属性
sudo xattr -cr /Applications/OpenCode.app

# 启动应用
open /Applications/OpenCode.app
```

---

### 后续启动

首次成功打开后，您就可以：

- 从 **"应用程序"** 文件夹双击打开
- 在 **Spotlight 搜索** 中搜索 "OpenCode"
- 添加到 **Dock** 栏快速访问

**不会再出现安全警告！**

---

## 🛠️ 常见问题

### Q1: 每次启动都提示安全警告？

**A:** 不应该。如果每次都提示，说明隔离属性没有被移除。尝试：

```bash
sudo xattr -rd com.apple.quarantine /Applications/OpenCode.app
```

### Q2: "应用程序已损坏"怎么办？

**A:** 这是因为 macOS 的 Gatekeeper 机制。解决方法：

```bash
# 方法 1：移除隔离属性
sudo xattr -cr /Applications/OpenCode.app

# 方法 2：完全重新签名
sudo codesign --force --deep --sign - /Applications/OpenCode.app

# 然后再打开
open /Applications/OpenCode.app
```

### Q3: 如何确认应用架构是否匹配？

**A:** 在终端运行：

```bash
file /Applications/OpenCode.app/Contents/MacOS/OpenCode
```

- 输出 `Mach-O 64-bit executable arm64` → Apple Silicon (M1/M2/M3)
- 输出 `Mach-O 64-bit executable x86_64` → Intel

**确保下载的 DMG 版本与您的 Mac 匹配！**

### Q4: 应用无法打开（点击无反应）？

**A:** 可能是权限问题。尝试：

```bash
# 检查权限
ls -la /Applications/OpenCode.app

# 修复权限
sudo chmod -R 755 /Applications/OpenCode.app
sudo chown -R $(whoami) /Applications/OpenCode.app
```

### Q5: 如何完全卸载？

**A:** 在终端运行：

```bash
# 删除应用
rm -rf /Applications/OpenCode.app

# 删除应用数据（可选）
rm -rf ~/Library/Application Support/OpenCode
rm -rf ~/Library/Caches/OpenCode
rm -rf ~/Library/Preferences/ai.opencode.desktop.plist

# 删除日志（可选）
rm -rf ~/Library/Logs/OpenCode
```

---

## 🔄 更新应用

### 手动更新

1. 下载新的 DMG 文件
2. 按照上述方法安装
3. **替换旧版本：**

   ```bash
   rm -rf /Applications/OpenCode.app
   cp -R /Volumes/OpenCode/OpenCode.app /Applications/
   ```

4. 首次运行新版本时可能需要处理安全警告

### 自动更新

- 应用内置自动更新检查
- 发现新版本时会提示下载
- 下载后手动安装即可

---

## 📋 系统要求

- **操作系统：**
  - macOS 11.0 (Big Sur) 或更高版本
  - 支持 Intel 和 Apple Silicon (M1/M2/M3)

- **磁盘空间：** 至少 500MB 可用空间
- **内存：** 建议 4GB 以上

**注意：** macOS 10.x (旧版本) 可能无法运行

---

## 🎨 快捷键

| 功能     | 快捷键            |
| -------- | ----------------- |
| 新建对话 | `Cmd + N`         |
| 打开文件 | `Cmd + O`         |
| 搜索     | `Cmd + Shift + F` |
| 全屏     | `Cmd + Ctrl + F`  |
| 隐藏应用 | `Cmd + H`         |
| 退出应用 | `Cmd + Q`         |

---

## 🔧 高级设置

### 允许应用访问特定权限

首次使用某些功能时，macOS 会提示请求权限：

**需要授权的功能：**

- 📁 访问文件系统（代码分析）
- 🌐 网络访问（API 调用）
- ⌨️ 键盘输入（可选）

**授权步骤：**

1. 打开 **"系统设置"** → **"隐私与安全性"**
2. 找到相关权限类别
3. 确保已勾选 OpenCode.app

### 添加到"允许的应用"

在系统设置中：

1. **"隐私与安全性"** → **"自动化"**
2. 确保 OpenCode 在允许列表中

---

## 📞 需要帮助？

如果遇到问题：

1. **查看日志**

   ```bash
   # 查看应用日志
   cat ~/Library/Logs/OpenCode/*.log

   # 或者使用 Console.app
   open /Applications/Utilities/Console.app
   ```

2. **收集系统信息**

   ```bash
   # macOS 版本
   sw_vers

   # 架构信息
   uname -m
   ```

3. **联系技术支持**
   - 提供错误截图
   - 提供系统信息
   - 提供日志文件

---

## 🔒 安全说明

### 为什么提示警告？

- 应用未使用 **Apple Developer ID Application** 证书签名
- Apple 无法验证发布者身份
- 这是**内部企业应用未签名安装**的常见情况
- 证书每年费用 $99，内部使用未购买

### 如何验证应用安全性？

1. **检查文件来源**
   - 确认从企业内部渠道下载
   - 联系 IT 部门确认文件完整性

2. **查看文件哈希值**（如果 IT 提供）

   ```bash
   shasum -a 256 ~/Downloads/OpenCode*.dmg
   ```

3. **使用 Gatekeeper 检查**
   ```bash
   spctl -a -vvv /Applications/OpenCode.app
   ```
   可能输出：`rejected: source=Unnotarized Developer ID`

---

## ✅ 安装后的验证

安装完成后，您可以：

1. **验证应用版本**
   - 打开 OpenCode
   - 菜单栏 → "OpenCode" → "关于 OpenCode"
   - 确认版本号和架构

2. **测试基本功能**
   - 创建新对话
   - 上传文件
   - 代码分析

3. **检查自动更新**
   - 打开设置
   - 确认自动更新功能已启用

---

## 📖 相关文档

- [安装指南 (Windows)](./INSTALL_WINDOWS.md)
- [使用手册](./USER_GUIDE.md)
- [常见问题](./FAQ.md)

---

## 💡 优化建议

### 提升性能

1. **分配足够内存**
   - 首次启动会加载模型到内存
   - 建议关闭其他占用内存的应用

2. **使用 SSD 硬盘**
   - 确保应用和数据在 SSD 上
   - 显著提升性能

3. **定期清理缓存**
   ```bash
   rm -rf ~/Library/Caches/OpenCode/*
   ```

### 常用配置

**调整模型资源占用**

- 打开设置
- 找到"模型"选项
- 根据设备性能调整参数

**自定义工作区**

- 调整窗口布局
- 设置首选语言
- 配置快捷键

---

**最后更新：** 2026-01-28
