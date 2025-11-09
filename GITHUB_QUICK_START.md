# 🚀 GitHub 快速上手指南

> **3 分钟上手** - 最简单的方式将代码推送到 GitHub

---

## 📋 方式一：自动化脚本（最简单）

### 运行快速开始脚本

```bash
chmod +x scripts/github-quickstart.sh
./scripts/github-quickstart.sh
```

这个脚本会自动：
- ✅ 检查 Git 配置
- ✅ 初始化仓库
- ✅ 引导你配置远程仓库
- ✅ 提交并推送代码

**全程引导式操作，无需记忆命令！**

---

## 📋 方式二：手动操作（学习推荐）

### 步骤 1：创建 GitHub 仓库（5分钟）

1. 访问 https://github.com/new
2. 填写：
   - Repository name: `content-factory`
   - Description: `智能内容创作平台`
   - 选择 **Private** (私有)
3. **不要勾选**任何选项（README、.gitignore、License）
4. 点击 **Create repository**
5. **复制仓库地址**（SSH 或 HTTPS）

**SSH 地址示例：** `git@github.com:你的用户名/content-factory.git`
**HTTPS 地址示例：** `https://github.com/你的用户名/content-factory.git`

### 步骤 2：配置 Git（首次）

```bash
# 设置用户名
git config --global user.name "你的名字"

# 设置邮箱
git config --global user.email "your.email@example.com"

# 验证配置
git config --list
```

### 步骤 3：初始化并推送

```bash
# 进入项目目录
cd /Users/jiangchenxiang1/Desktop/content-factory

# 1️⃣ 初始化 Git 仓库（如果还没初始化）
git init

# 2️⃣ 添加所有文件
git add .

# 3️⃣ 创建首次提交
git commit -m "Initial commit: 内容工厂项目初始化"

# 4️⃣ 连接远程仓库（替换为你的仓库地址）
git remote add origin git@github.com:你的用户名/content-factory.git

# 5️⃣ 设置默认分支
git branch -M main

# 6️⃣ 推送到 GitHub
git push -u origin main
```

**完成！** 🎉 访问你的 GitHub 仓库，应该能看到所有代码了。

---

## 🔄 日常使用（每次修改后）

### 方式 A：使用快捷命令（推荐）

```bash
# 自动添加、提交、推送（一键完成）
npm run git:push

# 或带自定义提交信息
npm run git:push "修复了登录 bug"
```

### 方式 B：手动执行

```bash
# 1. 查看修改
git status

# 2. 添加修改
git add .

# 3. 提交
git commit -m "描述你的修改"

# 4. 推送
git push
```

**就这么简单！**

---

## 🛠️ 可用的快捷命令

我已经在 `package.json` 中配置了以下快捷命令：

```bash
# 快速推送（自动 add + commit + push）
npm run git:push
npm run git:push "自定义提交信息"

# 查看状态
npm run git:status

# 查看提交历史（最近 10 条）
npm run git:log

# 同步（先拉取再推送）
npm run git:sync
```

---

## 🔐 推荐：配置 SSH 密钥（更安全）

### 为什么用 SSH？

- ✅ 不用每次输入密码
- ✅ 更安全
- ✅ GitHub 推荐方式

### 配置步骤（5分钟）

#### 1. 生成 SSH 密钥

```bash
# 生成密钥（替换为你的邮箱）
ssh-keygen -t ed25519 -C "your.email@example.com"

# 提示时直接按回车（使用默认路径）
# 密码短语可留空（直接回车）
```

#### 2. 添加到 ssh-agent

```bash
# 启动 ssh-agent
eval "$(ssh-agent -s)"

# 添加私钥
ssh-add ~/.ssh/id_ed25519
```

#### 3. 复制公钥

```bash
# macOS
pbcopy < ~/.ssh/id_ed25519.pub

# Linux
cat ~/.ssh/id_ed25519.pub
# 然后手动复制输出

# Windows (Git Bash)
clip < ~/.ssh/id_ed25519.pub
```

#### 4. 添加到 GitHub

1. 访问 https://github.com/settings/keys
2. 点击 **New SSH key**
3. Title: 填写设备名（如 "MacBook Pro"）
4. Key: 粘贴刚才复制的公钥
5. 点击 **Add SSH key**

#### 5. 测试连接

```bash
ssh -T git@github.com
```

**成功提示：** `Hi 你的用户名! You've successfully authenticated...`

#### 6. 切换到 SSH（如果之前用的 HTTPS）

```bash
git remote set-url origin git@github.com:你的用户名/content-factory.git
```

---

## ❓ 常见问题

### Q1: 推送时提示 "Permission denied"

**解决方法：**
```bash
# 1. 检查 SSH 连接
ssh -T git@github.com

# 2. 如果失败，重新配置 SSH 密钥（见上方）
```

### Q2: 推送时提示 "rejected"

**原因：** 远程有更新，本地不是最新的

**解决方法：**
```bash
# 先拉取远程更新
git pull --rebase

# 然后推送
git push
```

### Q3: 不小心提交了敏感文件（.env）

**立即操作：**
```bash
# 1. 从 Git 历史中删除
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. 强制推送
git push origin --force --all

# 3. 立即更改泄露的密钥/密码
```

### Q4: 忘记提交信息怎么办？

```bash
# 修改最后一次提交信息
git commit --amend -m "新的提交信息"

# 强制推送（如果已推送）
git push --force
```

### Q5: 如何回退到之前的版本？

```bash
# 查看提交历史
git log --oneline

# 回退到指定提交（保留修改）
git reset --soft 提交ID

# 回退到指定提交（丢弃修改）⚠️ 危险
git reset --hard 提交ID
```

---

## 📚 更多资源

- **完整文档**: `docs/GITHUB_SETUP.md`
- **Git 教程**: https://learngitbranching.js.org/
- **GitHub 文档**: https://docs.github.com/

---

## 🎯 下一步

1. ✅ 完成初次推送
2. 📱 安装 GitHub Desktop（可选）: https://desktop.github.com/
3. 🔔 开启 GitHub 通知，及时了解协作动态
4. 📖 阅读完整文档了解更多高级功能

---

## 💡 专业提示

### 提交信息规范

使用规范的提交信息，方便追踪：

```bash
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/配置更新
```

**示例：**
```bash
git commit -m "feat: 添加用户登录功能"
git commit -m "fix: 修复文章保存失败的问题"
git commit -m "docs: 更新安装说明"
```

### 分支管理

```bash
# 创建新分支（用于开发新功能）
git checkout -b feature/新功能名称

# 切换回主分支
git checkout main

# 合并分支
git merge feature/新功能名称

# 删除分支
git branch -d feature/新功能名称
```

---

**🎉 恭喜！你已经掌握了 GitHub 的基本使用！**

**记住日常三步走：**
1. `git add .`
2. `git commit -m "提交信息"`
3. `git push`

**或者一键搞定：**
```bash
npm run git:push "提交信息"
```

---

**更新时间**: 2025-11-08
