# 📘 Vercel 部署完整指南

## 第一步：配置 Git 用户信息

在终端运行以下命令（替换为你的信息）：

```bash
git config --global user.name "你的名字"
git config --global user.email "your.email@example.com"
```

或者只在当前项目设置（不加 --global）：

```bash
git config user.name "你的名字"
git config user.email "your.email@example.com"
```

## 第二步：提交代码到本地仓库

```bash
# 查看文件状态
git status

# 提交所有文件
git commit -m "🎉 Initial commit: Gemini Tera Factory - 智能内容创作与发布管理平台"
```

## 第三步：创建 GitHub 仓库

### 方式一：通过 GitHub 网站

1. 访问 [https://github.com/new](https://github.com/new)
2. 填写仓库信息：
   - **Repository name**: `content-factory` 或你喜欢的名字
   - **Description**: `智能内容创作与发布管理平台`
   - **Visibility**: 选择 `Public` 或 `Private`
   - **不要**勾选 "Add a README file"
   - **不要**勾选 "Add .gitignore"
3. 点击 "Create repository"

### 方式二：使用 GitHub CLI（如果已安装）

```bash
# 创建私有仓库
gh repo create content-factory --private --source=. --remote=origin --push

# 或创建公开仓库
gh repo create content-factory --public --source=. --remote=origin --push
```

## 第四步：推送代码到 GitHub

如果通过网站创建仓库，GitHub 会显示命令，按照提示操作：

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/content-factory.git

# 推送代码
git branch -M main
git push -u origin main
```

**验证推送成功**：
访问你的 GitHub 仓库页面，应该能看到所有代码文件。

## 第五步：部署到 Vercel

### 1. 访问 Vercel 并登录

访问 [https://vercel.com](https://vercel.com)，使用 GitHub 账号登录。

### 2. 导入项目

1. 点击 "Add New..." → "Project"
2. 在 "Import Git Repository" 中找到你的 `content-factory` 仓库
3. 点击 "Import"

### 3. 配置项目

Vercel 会自动识别这是一个 Next.js 项目，使用以下默认配置：

- **Framework Preset**: Next.js
- **Root Directory**: ./
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

**不需要修改这些设置**，直接点击 "Deploy"。

### 4. 配置环境变量（可选）

如果你的项目需要 API 密钥等环境变量：

1. 在部署前，点击 "Environment Variables"
2. 添加你需要的变量，例如：
   - `OPENAI_API_KEY` = `your-api-key`
   - `OPENAI_BASE_URL` = `https://api.openai.com/v1`

### 5. 开始部署

点击 "Deploy" 按钮，Vercel 会：
1. 克隆你的 GitHub 仓库
2. 安装依赖
3. 构建项目
4. 部署到全球 CDN

**部署时间**：通常 2-3 分钟

### 6. 访问你的应用

部署成功后，Vercel 会提供一个 URL，格式如：
- `https://content-factory-xxx.vercel.app`

点击 "Visit" 访问你的在线应用！

## 第六步：配置自定义域名（可选）

1. 在 Vercel 项目页面，点击 "Settings" → "Domains"
2. 输入你的域名（如 `your-domain.com`）
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟到几小时）

## 第七步：配置数据库（重要）

由于 SQLite 是文件数据库，在 Vercel 的无服务器环境中：

**选项 1：使用 Vercel Postgres（推荐）**

```bash
# 在 Vercel 项目中添加 Postgres 数据库
# Settings → Storage → Create Database → Postgres
```

**选项 2：使用其他云数据库**
- Supabase（免费）
- PlanetScale（免费）
- Railway（免费）

**选项 3：使用 Vercel KV 存储（键值存储）**

适合简单场景，需要修改数据访问层。

## 持续部署

配置完成后，每次你推送代码到 GitHub：

```bash
git add .
git commit -m "描述你的更改"
git push
```

Vercel 会自动：
1. 检测到新的推送
2. 自动构建和部署
3. 几分钟后更新就会上线

## 查看部署状态

- **部署日志**：Vercel Dashboard → Deployments
- **构建日志**：点击具体部署 → Build Logs
- **运行日志**：点击具体部署 → Function Logs

## 回滚部署

如果新部署有问题：
1. 访问 Vercel Dashboard → Deployments
2. 找到之前的成功部署
3. 点击 "..." → "Promote to Production"

## 常见问题

### Q1: 部署失败怎么办？
A: 查看 Build Logs，通常是依赖安装或构建错误。

### Q2: 数据库文件丢失？
A: Vercel 是无状态的，不能使用 SQLite 文件。需要使用云数据库。

### Q3: 环境变量没生效？
A: 确保在 Vercel 的 Environment Variables 中配置，并重新部署。

### Q4: 如何更新代码？
A: 只需 `git push`，Vercel 会自动部署。

## 最佳实践

1. **使用环境变量**：不要在代码中硬编码敏感信息
2. **数据库迁移**：考虑从 SQLite 迁移到云数据库
3. **监控**：启用 Vercel Analytics 监控应用性能
4. **备份**：定期备份数据库数据
5. **测试**：先在预览环境测试，再推送到生产环境

## 下一步

- [ ] 配置自定义域名
- [ ] 迁移到云数据库
- [ ] 添加 API 密钥
- [ ] 配置 Vercel Analytics
- [ ] 设置 GitHub Actions（可选）

---

🎉 恭喜！你的应用已经成功部署到云端！
