# AI Companion

一款面向个人开发者的综合 AI 助手桌面应用，支持代码开发、项目规划和内容创作。

## 功能特性

### 多工作模式

应用支持四种工作模式，每种模式都有独特的 AI 行为优化：

| 模式 | 用途 | AI 参数 |
|------|------|---------|
| **对话** | 日常问答、知识查询 | Temperature: 0.7 |
| **代码** | 编程开发、Bug 修复 | Temperature: 0.3, MaxTokens: 8192 |
| **项目** | 项目规划、任务拆解 | Temperature: 0.5 |
| **创作** | 文案写作、翻译、头脑风暴 | Temperature: 0.8 |

### 多 AI 提供商支持

支持多种 AI 服务提供商：

- **MiniMax** - 默认提供商
- **OpenAI** - GPT 系列模型
- **Anthropic** - Claude 系列模型
- **智谱** - GLM 系列模型
- **Ollama** - 本地模型支持
- **OpenRouter** - 聚合多种模型

### 核心功能

- **会话管理** - 创建、删除、重命名对话会话
- **流式响应** - 实时显示 AI 生成内容
- **Markdown 渲染** - 支持代码高亮、表格等
- **主题切换** - 支持亮色/暗色/跟随系统
- **本地存储** - 数据保存在本地，支持导入导出

## 快速开始

### 安装

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建桌面应用
npm run tauri build
```

### 配置 AI

1. 点击侧边栏底部的 **设置** 按钮
2. 选择 AI 提供商
3. 输入 API Key
4. 可选：调整 Temperature 和 Max Tokens 参数

### 使用工作模式

1. 点击 **新建对话** 创建通用对话
2. 使用快捷按钮快速创建特定模式的会话：
   - **代码** - 专注编程任务
   - **项目** - 规划和管理项目
   - **创作** - 内容创作和翻译

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **桌面**: Tauri 2
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **Markdown**: react-markdown + react-syntax-highlighter
- **测试**: Vitest + Playwright

## 项目结构

```
src/
├── components/          # React 组件
│   ├── Chat/           # 聊天相关组件
│   └── Layout/         # 布局组件
├── pages/             # 页面组件
│   ├── ChatPage.tsx   # 聊天页面
│   └── SettingsPage.tsx # 设置页面
├── services/          # 服务层
│   ├── aiService.ts   # AI 服务
│   ├── prompts/       # 工作模式提示词
│   └── providers/     # AI 提供商实现
├── stores/            # Zustand 状态管理
├── types/             # TypeScript 类型定义
└── App.tsx            # 应用入口
```

## 测试

```bash
# 运行单元测试
npm run test:run

# 运行 E2E 测试
npm run e2e
```

## 环境变量

如需使用环境变量配置 API Key，可创建 `.env` 文件：

```env
VITE_MINIMAX_API_KEY=your-api-key
VITE_MINIMAX_MODEL=abab6.5s-chat
VITE_OPENAI_API_KEY=your-openai-key
VITE_OPENAI_MODEL=gpt-4
```

## 许可证

MIT License
