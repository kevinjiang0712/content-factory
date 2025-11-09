#!/bin/bash

# ================================
# GitHub 快速开始脚本
# 一键初始化并推送代码到 GitHub
# ================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_color() {
  color=$1
  shift
  echo -e "${color}$@${NC}"
}

print_header() {
  echo ""
  print_color "$CYAN" "================================"
  print_color "$CYAN" "$1"
  print_color "$CYAN" "================================"
  echo ""
}

print_step() {
  print_color "$BLUE" "📝 $1"
}

print_success() {
  print_color "$GREEN" "✅ $1"
}

print_error() {
  print_color "$RED" "❌ $1"
}

print_warning() {
  print_color "$YELLOW" "⚠️  $1"
}

# 主函数
main() {
  print_header "🚀 GitHub 快速开始脚本"

  # 1. 检查 Git 是否安装
  print_step "检查 Git 是否安装..."
  if ! command -v git &> /dev/null; then
    print_error "Git 未安装，请先安装 Git"
    print_warning "macOS: 运行 'git --version' 会提示安装"
    print_warning "Linux: sudo apt-get install git"
    print_warning "Windows: 下载 https://git-scm.com/download/win"
    exit 1
  fi
  print_success "Git 已安装: $(git --version)"

  # 2. 检查是否已配置 Git 用户信息
  print_step "检查 Git 配置..."
  git_user=$(git config --global user.name 2>/dev/null || echo "")
  git_email=$(git config --global user.email 2>/dev/null || echo "")

  if [ -z "$git_user" ] || [ -z "$git_email" ]; then
    print_warning "Git 用户信息未配置"
    echo ""
    read -p "请输入你的名字: " user_name
    read -p "请输入你的邮箱: " user_email

    git config --global user.name "$user_name"
    git config --global user.email "$user_email"
    print_success "Git 用户信息配置完成"
  else
    print_success "Git 用户: $git_user <$git_email>"
  fi

  # 3. 检查是否已初始化仓库
  print_step "检查 Git 仓库状态..."
  if [ ! -d ".git" ]; then
    print_warning "Git 仓库未初始化"
    read -p "是否初始化 Git 仓库? (y/n): " init_repo
    if [ "$init_repo" = "y" ] || [ "$init_repo" = "Y" ]; then
      git init
      print_success "Git 仓库初始化完成"
    else
      print_error "已取消"
      exit 1
    fi
  else
    print_success "Git 仓库已初始化"
  fi

  # 4. 检查是否有远程仓库
  print_step "检查远程仓库..."
  if ! git remote get-url origin &> /dev/null; then
    print_warning "远程仓库未配置"
    echo ""
    print_color "$YELLOW" "请按照以下步骤操作:"
    print_color "$YELLOW" "1. 访问 https://github.com/new"
    print_color "$YELLOW" "2. 创建新仓库 (仓库名建议: content-factory)"
    print_color "$YELLOW" "3. 选择 Private (私有)"
    print_color "$YELLOW" "4. 不要勾选任何选项 (README, .gitignore, License)"
    print_color "$YELLOW" "5. 创建完成后，复制仓库地址"
    echo ""
    read -p "请输入 GitHub 仓库地址: " repo_url

    git remote add origin "$repo_url"
    print_success "远程仓库配置完成: $repo_url"
  else
    repo_url=$(git remote get-url origin)
    print_success "远程仓库: $repo_url"
  fi

  # 5. 检查 .gitignore
  print_step "检查 .gitignore 文件..."
  if [ ! -f ".gitignore" ]; then
    print_warning ".gitignore 文件不存在，建议创建"
    read -p "是否创建默认 .gitignore? (y/n): " create_gitignore
    if [ "$create_gitignore" = "y" ] || [ "$create_gitignore" = "Y" ]; then
      # 创建基本的 .gitignore
      cat > .gitignore << 'EOF'
# 依赖
node_modules/

# Next.js
.next/
out/

# 环境变量
.env*

# 数据库
*.db
data/

# 系统文件
.DS_Store
EOF
      print_success ".gitignore 创建完成"
    fi
  else
    print_success ".gitignore 已存在"
  fi

  # 6. 检查是否有未提交的修改
  print_step "检查代码状态..."
  if [ -z "$(git status --porcelain)" ]; then
    print_warning "没有需要提交的修改"

    # 检查是否有未推送的提交
    if git log @{u}.. &> /dev/null && [ -n "$(git log @{u}.. --oneline)" ]; then
      print_warning "有未推送的提交"
      read -p "是否推送到远程? (y/n): " do_push
      if [ "$do_push" = "y" ] || [ "$do_push" = "Y" ]; then
        git push
        print_success "推送成功!"
      fi
    else
      print_success "代码已是最新状态"
    fi
    exit 0
  fi

  # 7. 显示修改状态
  echo ""
  print_color "$BLUE" "📊 当前修改:"
  git status --short
  echo ""

  # 8. 确认是否继续
  read -p "是否提交并推送以上修改? (y/n): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    print_warning "已取消"
    exit 0
  fi

  # 9. 添加所有修改
  print_step "添加所有修改到暂存区..."
  git add .
  print_success "已添加所有修改"

  # 10. 输入提交信息
  echo ""
  read -p "请输入提交信息 (留空自动生成): " commit_msg
  if [ -z "$commit_msg" ]; then
    file_count=$(git diff --cached --name-only | wc -l | tr -d ' ')
    timestamp=$(date '+%Y-%m-%d %H:%M')
    commit_msg="Update: 更新代码 (${file_count} 个文件) - ${timestamp}"
  fi

  # 11. 提交
  print_step "提交更改..."
  git commit -m "$commit_msg"
  print_success "提交成功: $commit_msg"

  # 12. 推送到远程
  print_step "推送到远程仓库..."

  # 获取当前分支
  current_branch=$(git branch --show-current)

  # 检查是否需要设置上游分支
  if ! git rev-parse --abbrev-ref "$current_branch@{upstream}" &> /dev/null; then
    print_warning "分支 '$current_branch' 未设置上游分支"
    print_step "设置上游分支并推送..."
    git push -u origin "$current_branch"
  else
    git push
  fi

  print_success "推送成功!"

  # 13. 显示最新提交
  echo ""
  print_color "$BLUE" "📊 最新提交:"
  git log -1 --oneline --decorate
  echo ""

  # 14. 显示仓库地址
  print_header "🎉 完成!"
  print_color "$GREEN" "你的代码已成功推送到 GitHub!"
  echo ""
  print_color "$CYAN" "仓库地址: $repo_url"
  echo ""
  print_color "$YELLOW" "💡 后续使用:"
  print_color "$YELLOW" "   快速推送: npm run git:push"
  print_color "$YELLOW" "   查看状态: npm run git:status"
  print_color "$YELLOW" "   查看日志: npm run git:log"
  echo ""
}

# 运行主函数
main
