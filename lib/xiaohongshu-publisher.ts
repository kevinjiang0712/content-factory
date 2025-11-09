/**
 * 小红书发布功能
 * 由于小红书API限制，主要提供内容格式化和辅助功能
 */

export interface XiaohongshuContent {
  title: string // 标题，最多20个字符
  content: string // 正文，最多1000个字符
  images: string[] // 图片URL列表，最多9张
  tags: string[] // 标签，最多5个
}

export interface XiaohongshuPublishResult {
  success: boolean
  formattedContent?: string
  suggestedTags?: string[]
  images?: string[]
  error?: string
  manualPublishNote?: string
}

export class XiaohongshuPublisher {
  /**
   * 格式化内容为小红书格式
   */
  formatContent(title: string, content: string, images: string[]): XiaohongshuPublishResult {
    try {
      // 处理标题
      const formattedTitle = this.formatTitle(title)

      // 处理内容
      const formattedContent = this.formatContentForXHS(content)

      // 生成建议标签
      const suggestedTags = this.generateTags(title + ' ' + content)

      // 处理图片
      const processedImages = this.processImages(images)

      const finalContent = this.buildXHSContent(formattedTitle, formattedContent, suggestedTags)

      return {
        success: true,
        formattedContent: finalContent,
        suggestedTags,
        images: processedImages,
        manualPublishNote: '小红书需要手动发布。请复制下方内容到小红书APP，然后上传图片并添加标签。'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 格式化标题
   */
  private formatTitle(title: string): string {
    // 移除markdown格式
    let formatted = title.replace(/[#*_`]/g, '').trim()

    // 确保不超过20个字符
    if (formatted.length > 20) {
      formatted = formatted.substring(0, 17) + '...'
    }

    return formatted
  }

  /**
   * 格式化内容为小红书风格
   */
  private formatContentForXHS(content: string): string {
    // 移除markdown图片语法（小红书图片需要单独上传）
    let formatted = content.replace(/!\[.*?\]\(.*?\)/g, '[图片]')

    // 转换markdown为小红书风格
    formatted = formatted.replace(/^### (.*$)/gim, '🔸 $1')
    formatted = formatted.replace(/^## (.*$)/gim, '🔹 $1')
    formatted = formatted.replace(/^# (.*$)/gim, '✨ $1')

    // 处理粗体和斜体
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '$1')
    formatted = formatted.replace(/\*(.*?)\*/g, '$1')

    // 添加小红书风格的表情符号
    formatted = this.addXHSStyleEmojis(formatted)

    // 处理段落
    formatted = formatted.replace(/\n\n+/g, '\n\n')

    // 确保不超过1000个字符
    if (formatted.length > 980) { // 留一些空间给标签
      formatted = formatted.substring(0, 977) + '...'
    }

    return formatted.trim()
  }

  /**
   * 添加小红书风格表情符号
   */
  private addXHSStyleEmojis(content: string): string {
    // 为不同类型的内容添加适当的表情
    const lines = content.split('\n')
    const formattedLines = lines.map(line => {
      line = line.trim()
      if (!line) return line

      // 为开头添加表情
      if (!/^[\p{Emoji}]/u.test(line)) {
        if (line.includes('AI') || line.includes('人工智能')) {
          return '🤖 ' + line
        } else if (line.includes('图片') || line.includes('照片')) {
          return '📸 ' + line
        } else if (line.includes('分享') || line.includes('介绍')) {
          return '📝 ' + line
        } else if (line.includes('技术') || line.includes('方法')) {
          return '💡 ' + line
        } else if (line.includes('体验') || line.includes('感受')) {
          return '✨ ' + line
        } else if (/^\d+[.、]/.test(line)) {
          return '🔹 ' + line
        } else {
          return '📌 ' + line
        }
      }
      return line
    })

    return formattedLines.join('\n')
  }

  /**
   * 生成建议标签
   */
  private generateTags(content: string): string[] {
    const keywords = [
      'AI创作', '内容创作', '智能写作', 'AI助手', '自动化',
      '自媒体', '内容营销', '文案创作', '小红书运营',
      '工作效率', '创作工具', '数字化转型'
    ]

    // 从内容中提取关键词
    const words = content.toLowerCase().split(/\s+/)
    const relevantTags: string[] = []

    // 匹配关键词
    keywords.forEach(keyword => {
      if (words.some(word => word.includes(keyword.toLowerCase().substring(0, 3)))) {
        relevantTags.push(keyword)
      }
    })

    // 确保最多5个标签
    return relevantTags.slice(0, 5)
  }

  /**
   * 处理图片
   */
  private processImages(images: string[]): string[] {
    // 最多9张图片
    return images.slice(0, 9).filter(url => url && url.startsWith('http'))
  }

  /**
   * 构建小红书内容格式
   */
  private buildXHSContent(title: string, content: string, tags: string[]): string {
    let xhsContent = `${title}\n\n${content}\n\n`

    // 添加标签
    if (tags.length > 0) {
      xhsContent += tags.map(tag => `#${tag}`).join(' ')
    }

    return xhsContent
  }

  /**
   * 模拟发布（实际需要手动发布）
   */
  async simulatePublish(content: XiaohongshuContent): Promise<XiaohongshuPublishResult> {
    // 格式化内容
    const result = this.formatContent(content.title, content.content, content.images)

    if (!result.success) {
      return result
    }

    // 返回模拟发布结果
    return {
      ...result,
      success: true,
      manualPublishNote: `
📱 小红书发布步骤：
1. 复制下方格式化内容
2. 打开小红书APP
3. 点击发布按钮
4. 粘贴内容
5. 上传图片（建议3-9张）
6. 添加话题标签
7. 设置发布信息

💡 提示：小红书建议使用高质量的原创图片，并添加相关话题标签获得更多曝光。
      `
    }
  }

  /**
   * 生成下载指南
   */
  generateDownloadGuide(images: string[]): string {
    if (images.length === 0) {
      return "暂无图片需要下载"
    }

    return `
📸 图片下载指南：
1. 右键点击图片选择"另存为"
2. 或使用浏览器下载功能
3. 建议保存为JPG或PNG格式
4. 确保图片清晰度，小红书建议尺寸：1080x1440像素

📝 图片顺序：请按照内容中的[图片]标记顺序上传图片
    `
  }
}

/**
 * 获取小红书发布器实例
 */
export function getXiaohongshuPublisher(): XiaohongshuPublisher {
  return new XiaohongshuPublisher()
}