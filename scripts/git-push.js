#!/usr/bin/env node

/**
 * Git 快捷推送脚本
 * 自动执行 add、commit、push 操作
 *
 * 使用方法:
 *   npm run git:push
 *   npm run git:push "自定义提交信息"
 */

const { execSync } = require('child_process')
const readline = require('readline')

// 获取命令行参数
const args = process.argv.slice(2)
const customMessage = args[0]

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset)
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    })
  } catch (error) {
    if (!options.ignoreError) {
      throw error
    }
    return null
  }
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function main() {
  log('cyan', '\n🚀 Git 快捷推送脚本\n')

  // 1. 检查是否是 Git 仓库
  const isGitRepo = exec('git rev-parse --is-inside-work-tree', {
    silent: true,
    ignoreError: true
  })

  if (!isGitRepo) {
    log('red', '❌ 错误: 当前目录不是 Git 仓库')
    log('yellow', '💡 提示: 请先运行 git init 初始化仓库')
    process.exit(1)
  }

  // 2. 检查是否有远程仓库
  const remotes = exec('git remote', { silent: true, ignoreError: true })
  if (!remotes || remotes.trim() === '') {
    log('red', '❌ 错误: 未配置远程仓库')
    log('yellow', '💡 提示: 请先运行以下命令添加远程仓库:')
    log('yellow', '   git remote add origin <仓库地址>')
    process.exit(1)
  }

  // 3. 检查是否有修改
  const status = exec('git status --porcelain', { silent: true })
  if (!status || status.trim() === '') {
    log('green', '✅ 没有需要提交的修改')

    // 检查是否有未推送的提交
    const unpushed = exec('git log @{u}.. --oneline', {
      silent: true,
      ignoreError: true
    })

    if (unpushed && unpushed.trim() !== '') {
      log('yellow', '\n⚠️  发现未推送的提交:')
      console.log(unpushed)

      const answer = await prompt('是否推送到远程仓库? (y/n): ')
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        log('blue', '\n📤 推送到远程仓库...')
        exec('git push')
        log('green', '\n✅ 推送成功!')
      } else {
        log('yellow', '⏭️  跳过推送')
      }
    }

    process.exit(0)
  }

  // 4. 显示修改状态
  log('blue', '📝 当前修改:')
  exec('git status --short')

  // 5. 添加所有修改
  log('blue', '\n➕ 添加所有修改到暂存区...')
  exec('git add .')
  log('green', '✅ 已添加')

  // 6. 生成或使用提交信息
  let commitMessage = customMessage

  if (!commitMessage) {
    // 自动生成提交信息
    const changedFiles = exec('git diff --cached --name-only', { silent: true })
      .trim()
      .split('\n')

    const fileCount = changedFiles.filter(f => f).length
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    // 分析修改类型
    let changeType = 'Update'
    const hasNewFiles = changedFiles.some(f => f.includes('新增') || f.startsWith('A '))
    const hasDeletes = changedFiles.some(f => f.includes('删除') || f.startsWith('D '))

    if (hasNewFiles && !hasDeletes) {
      changeType = 'Add'
    } else if (hasDeletes && !hasNewFiles) {
      changeType = 'Remove'
    } else if (hasNewFiles && hasDeletes) {
      changeType = 'Refactor'
    }

    commitMessage = `${changeType}: 更新代码 (${fileCount} 个文件) - ${timestamp}`
  }

  log('yellow', `\n💬 提交信息: ${commitMessage}`)

  // 7. 提交
  log('blue', '\n📦 提交更改...')
  exec(`git commit -m "${commitMessage}"`)
  log('green', '✅ 提交成功')

  // 8. 推送到远程
  log('blue', '\n📤 推送到远程仓库...')

  // 检查是否需要设置上游分支
  const currentBranch = exec('git branch --show-current', { silent: true }).trim()
  const upstreamBranch = exec(`git rev-parse --abbrev-ref ${currentBranch}@{upstream}`, {
    silent: true,
    ignoreError: true
  })

  if (!upstreamBranch) {
    log('yellow', `⚠️  分支 "${currentBranch}" 未设置上游分支，将自动设置`)
    exec(`git push -u origin ${currentBranch}`)
  } else {
    exec('git push')
  }

  log('green', '\n✅ 推送成功!')

  // 9. 显示最新提交
  log('blue', '\n📊 最新提交:')
  exec('git log -1 --oneline --decorate')

  log('cyan', '\n🎉 完成!')
}

// 错误处理
main().catch((error) => {
  log('red', '\n❌ 错误:', error.message)

  if (error.message.includes('rejected')) {
    log('yellow', '\n💡 提示: 远程仓库有更新，请先拉取:')
    log('yellow', '   git pull --rebase')
    log('yellow', '   然后重新运行此脚本')
  } else if (error.message.includes('Permission denied')) {
    log('yellow', '\n💡 提示: SSH 密钥配置有问题，请检查:')
    log('yellow', '   ssh -T git@github.com')
  }

  process.exit(1)
})
