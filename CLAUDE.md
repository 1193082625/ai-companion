# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

AI Companion 是一款面向个人开发者的综合 AI 助手桌面应用，支持代码开发、项目规划和内容创作。基于 Tauri 2 + React 19 + TypeScript 构建。

支持多 AI 提供商：MiniMax、OpenAI、Anthropic、智谱、Ollama、OpenRouter

## 命令

```bash
# 开发
npm run dev              # 启动 Vite 开发服务器
npm run dev:tauri         # 以开发模式启动 Tauri

# 构建
npm run build            # 构建前端 (tsc && vite build)
npm run build:tauri      # 构建 Tauri 桌面应用

# 其他
npm run preview          # 预览构建结果
```

## 架构

### 前端 (React + TypeScript)

- **框架**: React 19 + TypeScript + Vite
- **状态管理**: Zustand (`src/stores/`)
- **样式**: Tailwind CSS
- **Markdown**: react-markdown + react-syntax-highlighter + remark-gfm

#### 目录结构

| 目录 | 说明 |
|------|------|
| `src/pages/` | 页面组件 (ChatPage, SettingsPage) |
| `src/components/` | 共享组件 |
| `src/stores/` | Zustand 状态管理 |
| `src/services/` | AI 服务层 |
| `src/services/providers/` | AI 提供商实现 |
| `src/types/` | TypeScript 类型定义 |

#### 状态管理

- `appStore.ts`: 应用全局状态 (当前视图、工作模式、侧边栏)
- `chatStore.ts`: 聊天相关状态
- `settingsStore.ts`: 设置相关状态

#### AI 服务 (`src/services/`)

- `aiService.ts`: 统一 AI 服务入口，支持流式/非流式对话
- `providers/`: 各 AI 提供商实现
  - `base.ts`: 基类定义
  - `minimax.ts`: MiniMax 实现
  - `openai.ts`: OpenAI 实现
  - `ollama.ts`: Ollama 本地模型实现

### 后端 (Rust/Tauri)

- **框架**: Tauri 2
- **入口**: `src-tauri/src/main.rs`
- **库**: `src-tauri/src/lib.rs`

插件:
- `tauri-plugin-shell`: Shell 命令支持
- `tauri-plugin-http`: HTTP 请求支持

## 类型定义 (`src/types/index.ts`)

核心类型:
- `Message`: 聊天消息
- `ChatSession`: 聊天会话
- `AIProvider`: AI 提供商枚举
- `AIConfig`: AI 配置
- `AppSettings`: 应用设置
- `WorkMode`: 工作模式 (chat | code | project | content)
