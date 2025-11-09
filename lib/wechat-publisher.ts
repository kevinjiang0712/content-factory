/**
 * 微信公众号发布功能
 * 支持创建草稿和发布文章
 */

import { getPublishPlatforms, updatePublishPlatform } from "@/lib/db"

export interface WeChatContent {
  title: string // 标题，不超过64个字节
  content: string // 内容，支持HTML
  digest?: string // 摘要，不超过120个字节
  author?: string // 作者，不超过8个字节
  thumbMediaId?: string // 封面图片素材ID
  showCoverPic?: 0 | 1 // 是否显示封面图片
  needOpenComment?: 0 | 1 // 是否打开评论
  onlyFansCanComment?: 0 | 1 // 是否只有粉丝可以评论
}

export interface WeChatPublishResult {
  success: boolean
  mediaId?: string // 素材ID
  publishId?: string // 发布任务ID
  publishedUrl?: string // 文章链接
  error?: string
}

export class WeChatPublisher {
  private appId: string
  private appSecret: string
  private accessToken?: string
  private tokenExpiresAt?: number

  constructor(appId: string, appSecret: string) {
    this.appId = appId
    this.appSecret = appSecret
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string> {
    // 如果有有效的token，直接返回
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken
    }

    try {
      const response = await fetch(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`
      )

      const data = await response.json()

      if (data.access_token) {
        this.accessToken = data.access_token
        // 提前5分钟刷新token
        this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000

        // 更新数据库中的token
        await this.updateAccessToken(data.access_token, this.tokenExpiresAt)

        return this.accessToken || ''
      } else {
        throw new Error(data.errmsg || '获取access_token失败')
      }
    } catch (error) {
      throw new Error(`获取微信访问令牌失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 更新数据库中的访问令牌
   */
  private async updateAccessToken(accessToken: string, expiresAt: number): Promise<void> {
    const platforms = getPublishPlatforms('wechat')
    const wechatPlatform = platforms.find(p => p.app_id === this.appId)

    if (wechatPlatform) {
      updatePublishPlatform(wechatPlatform.id, {
        access_token: accessToken,
        token_expires_at: expiresAt
      })
    }
  }

  /**
   * 上传图片素材
   */
  async uploadImage(imageUrl: string): Promise<string> {
    const accessToken = await this.getAccessToken()

    try {
      // 先下载图片
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error('图片下载失败')
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const formData = new FormData()
      formData.append('media', new Blob([imageBuffer]), 'image.jpg')

      const response = await fetch(
        `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=image`,
        {
          method: 'POST',
          body: formData
        }
      )

      const data = await response.json()

      if (data.media_id) {
        return data.media_id
      } else {
        throw new Error(data.errmsg || '上传图片失败')
      }
    } catch (error) {
      throw new Error(`上传微信图片失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 创建图文草稿
   */
  async createDraft(content: WeChatContent): Promise<WeChatPublishResult> {
    const accessToken = await this.getAccessToken()

    try {
      // 如果有封面图片，先上传
      if (content.thumbMediaId && content.thumbMediaId.startsWith('http')) {
        content.thumbMediaId = await this.uploadImage(content.thumbMediaId)
      }

      const requestBody = {
        articles: [{
          title: content.title,
          content: this.formatContent(content.content),
          digest: content.digest || this.generateDigest(content.content),
          author: content.author || 'AI助手',
          thumb_media_id: content.thumbMediaId || '',
          show_cover_pic: content.showCoverPic ?? 1,
          need_open_comment: content.needOpenComment ?? 0,
          only_fans_can_comment: content.onlyFansCanComment ?? 0,
          content_source_url: '', // 原文链接
          edit_content: content.content // 编辑状态下的内容
        }]
      }

      const response = await fetch(
        `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      )

      const data = await response.json()

      if (data.media_id) {
        return {
          success: true,
          mediaId: data.media_id
        }
      } else {
        return {
          success: false,
          error: data.errmsg || '创建草稿失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 发布草稿（需要公众号认证，个人账号只能创建草稿）
   */
  async publishDraft(mediaId: string): Promise<WeChatPublishResult> {
    const accessToken = await this.getAccessToken()

    try {
      const requestBody = {
        media_id: mediaId
      }

      const response = await fetch(
        `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      )

      const data = await response.json()

      if (data.publish_id) {
        // 获取发布状态
        const result = await this.getPublishStatus(data.publish_id)
        return result
      } else {
        return {
          success: false,
          error: data.errmsg || '发布失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 获取发布状态
   */
  async getPublishStatus(publishId: string): Promise<WeChatPublishResult> {
    const accessToken = await this.getAccessToken()

    try {
      const response = await fetch(
        `https://api.weixin.qq.com/cgi-bin/freepublish/get?access_token=${accessToken}&publish_id=${publishId}`
      )

      const data = await response.json()

      if (data.publish_status === '0') {
        return {
          success: true,
          publishId,
          publishedUrl: data.publish_url
        }
      } else {
        return {
          success: false,
          error: data.errmsg || '发布状态异常'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 格式化内容为微信要求的格式
   */
  private formatContent(content: string): string {
    // 将markdown图片转换为HTML
    let formattedContent = content.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">'
    )

    // 将markdown标题转换为HTML
    formattedContent = formattedContent.replace(/^### (.*$)/gim, '<h3>$1</h3>')
    formattedContent = formattedContent.replace(/^## (.*$)/gim, '<h2>$1</h2>')
    formattedContent = formattedContent.replace(/^# (.*$)/gim, '<h1>$1</h1>')

    // 将粗体转换为HTML
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // 将斜体转换为HTML
    formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>')

    // 处理段落
    formattedContent = formattedContent.replace(/\n\n/g, '</p><p>')
    formattedContent = '<p>' + formattedContent + '</p>'

    // 清理多余的标签
    formattedContent = formattedContent.replace(/<p><\/p>/g, '')
    formattedContent = formattedContent.replace(/<p>(<h[1-6]>)/g, '$1')
    formattedContent = formattedContent.replace(/(<\/h[1-6]>)<\/p>/g, '$1')

    return formattedContent
  }

  /**
   * 生成摘要
   */
  private generateDigest(content: string): string {
    // 移除markdown语法和HTML标签
    const plainText = content
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^#+\s*/g, '')
      .replace(/\n\n+/g, '\n')
      .trim()

    // 返回前50个字符作为摘要
    return plainText.substring(0, 50) + (plainText.length > 50 ? '...' : '')
  }

  /**
   * 检查公众号权限
   */
  async checkPermissions(): Promise<{ canPublish: boolean; canCreateDraft: boolean; error?: string }> {
    try {
      const accessToken = await this.getAccessToken()

      // 个人账号只能创建草稿，不能直接发布
      // 这里需要根据实际的权限返回相应结果
      return {
        canPublish: false, // 个人账号通常不能直接发布
        canCreateDraft: true // 但可以创建草稿
      }
    } catch (error) {
      return {
        canPublish: false,
        canCreateDraft: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

/**
 * 获取微信发布器实例
 */
export function getWeChatPublisher(): WeChatPublisher | null {
  const platforms = getPublishPlatforms('wechat')
  const wechatPlatform = platforms.find(p => p.app_id && p.app_secret)

  if (!wechatPlatform || !wechatPlatform.app_id || !wechatPlatform.app_secret) {
    return null
  }

  return new WeChatPublisher(wechatPlatform.app_id, wechatPlatform.app_secret)
}