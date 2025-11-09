# 🚀 Gemini Tera Factory - 智能内容创作与发布管理平台

一个基于 AI 的全栈内容创作和发布管理系统，支持选题分析、智能内容生成、多平台一键发布等功能。

## ✨ 核心功能

### 📊 选题分析
- 关键词分析与热点抓取
- 词云可视化
- 智能选题推荐
- 多维度数据洞察

### ✍️ 内容创作
- **AI 内容生成**：基于洞察一键生成高质量文章
- **AI 配图**：自动生成相关配图
- **手动编辑**：支持 Markdown 格式编辑
- **实时预览**：所见即所得的编辑体验
- **智能优化**：AI 辅助内容优化

### 📱 多平台发布
- **微信公众号**：自动创建草稿（支持 API 配置）
- **小红书**：智能内容格式化和发布指南
- **一键发布**：同时发布到多个平台
- **发布记录**：完整的发布历史追踪
- **状态管理**：实时发布状态监控

### 🎨 其他功能
- 内容管理
- 发布日历
- 数据洞察
- AI 模型管理
- 平台配置管理

## 🛠️ 技术栈

- **前端框架**: Next.js 16.0.1 (App Router)
- **UI 库**: React 19, Tailwind CSS, shadcn/ui
- **数据库**: SQLite (better-sqlite3)
- **AI 集成**: 支持多种 AI 模型配置
- **图片生成**: 集成图片生成 API
- **部署**: Vercel

## 📦 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# AI API 配置（可选，在系统设置中配置）
# OPENAI_API_KEY=your_api_key_here
# OPENAI_BASE_URL=https://api.openai.com/v1

# 图片生成 API（可选）
# IMAGE_API_KEY=your_image_api_key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 📂 项目结构

```
content-factory/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── content/           # 内容管理页面
│   ├── publish/           # 发布管理页面
│   ├── settings/          # 设置页面
│   └── layout.tsx         # 根布局
├── components/            # React 组件
│   ├── ui/               # UI 基础组件
│   └── ...               # 业务组件
├── lib/                   # 工具库
│   ├── db.ts             # 数据库操作
│   └── ...               # 其他工具
├── data/                  # 数据目录（不提交到 Git）
└── public/               # 静态资源
```

## 🔐 安全说明

- `.env.local` 文件包含敏感信息，已在 `.gitignore` 中排除
- 数据库文件 (`data/`) 不会提交到代码仓库
- 请妥善保管 API 密钥和平台配置信息

## 🚢 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署完成！

详细步骤请参考部署文档。

## 📝 使用说明

### 选题分析
1. 输入关键词
2. 选择分析时间范围和文章数量
3. 点击开始分析
4. 查看词云和洞察结果

### 内容创作
1. 选择洞察或手动创建
2. 配置 AI 模型（可选）
3. 生成或编辑内容
4. 保存草稿

### 一键发布
1. 在发布管理中配置平台
2. 在内容创作页面点击"一键发布"
3. 选择发布平台
4. 查看发布结果

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 作者

Created with ❤️ by Claude Code

---

**注意**: 这是一个演示项目，部分功能需要配置相应的 API 密钥才能使用。
