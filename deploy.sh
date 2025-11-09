#!/bin/bash

echo "🚀 Gemini Tera Factory - 一键部署脚本"
echo "========================================"
echo ""

# 检查 Git 配置
if ! git config user.name > /dev/null 2>&1; then
    echo "⚠️  检测到未配置 Git 用户信息"
    read -p "请输入你的名字: " username
    read -p "请输入你的邮箱: " useremail
    
    git config user.name "$username"
    git config user.email "$useremail"
    echo "✅ Git 用户信息配置完成"
    echo ""
fi

# 提交代码
echo "📝 提交代码到本地仓库..."
git add .
git commit -m "🎉 Initial commit: Gemini Tera Factory

✨ 核心功能:
- 选题分析与智能洞察
- AI 内容生成与配图  
- 手动编辑支持
- 多平台一键发布（微信公众号、小红书）
- 发布管理与记录追踪
- AI 模型配置管理"

echo "✅ 代码已提交到本地仓库"
echo ""

# 提示创建 GitHub 仓库
echo "📦 接下来需要创建 GitHub 仓库"
echo ""
echo "方式一：通过网站创建"
echo "  1. 访问 https://github.com/new"
echo "  2. Repository name: content-factory"
echo "  3. 选择 Public 或 Private"
echo "  4. 不要勾选 README 和 .gitignore"
echo "  5. 点击 Create repository"
echo ""
echo "方式二：使用 GitHub CLI (如果已安装)"
echo "  gh repo create content-factory --private --source=. --remote=origin --push"
echo ""

read -p "请输入你的 GitHub 用户名: " github_user
echo ""

# 添加远程仓库
echo "🔗 配置远程仓库..."
git remote add origin "https://github.com/$github_user/content-factory.git"
git branch -M main

echo "✅ 远程仓库配置完成"
echo ""

# 推送代码
echo "⬆️  推送代码到 GitHub..."
echo "   如果这是第一次推送，可能需要输入 GitHub 用户名和密码（或 Personal Access Token）"
echo ""
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 代码已成功推送到 GitHub!"
    echo ""
    echo "下一步："
    echo "1. 访问 https://vercel.com"
    echo "2. 使用 GitHub 账号登录"
    echo "3. 点击 'Add New...' → 'Project'"
    echo "4. 选择 'content-factory' 仓库"
    echo "5. 点击 'Deploy'"
    echo ""
    echo "更多详细信息请查看 DEPLOYMENT_GUIDE.md"
else
    echo ""
    echo "❌ 推送失败，请检查:"
    echo "1. GitHub 仓库是否已创建"
    echo "2. 用户名是否正确"
    echo "3. 是否有推送权限"
    echo ""
    echo "手动推送命令:"
    echo "git push -u origin main"
fi

