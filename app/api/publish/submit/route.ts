import { NextRequest, NextResponse } from "next/server"
import { getGeneratedContent, getGeneratedImages, savePublishRecord, updatePublishRecord } from "@/lib/db-supabase"
import { getWeChatPublisher, WeChatContent } from "@/lib/wechat-publisher"
import { getXiaohongshuPublisher, XiaohongshuContent } from "@/lib/xiaohongshu-publisher"

/**
 * 一键发布到多个平台
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentId, platforms, scheduledAt } = body

    if (!contentId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必要参数：contentId, platforms"
        },
        { status: 400 }
      )
    }

    // 获取内容
    const content = getGeneratedContent(contentId)
    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "内容不存在，请先保存内容"
        },
        { status: 404 }
      )
    }

    // 获取图片
    const images = getGeneratedImages(contentId)

    // 并行发布到各平台
    const publishPromises = platforms.map((platform: string) =>
      publishToPlatform(platform, content, images, scheduledAt)
    )

    const results = await Promise.allSettled(publishPromises)

    // 处理结果
    const publishResults = results.map((result, index) => {
      const platform = platforms[index]

      if (result.status === 'fulfilled') {
        return {
          platform,
          success: true,
          ...result.value
        }
      } else {
        return {
          platform,
          success: false,
          error: result.reason.message || result.reason
        }
      }
    })

    // 统计结果
    const successCount = publishResults.filter(r => r.success).length
    const totalCount = publishResults.length

    return NextResponse.json({
      success: successCount > 0,
      data: {
        results: publishResults,
        summary: {
          total: totalCount,
          success: successCount,
          failed: totalCount - successCount
        }
      },
      message: `发布完成：成功 ${successCount}/${totalCount} 个平台`
    })

  } catch (error) {
    console.error("一键发布失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "发布失败"
      },
      { status: 500 }
    )
  }
}

/**
 * 发布到指定平台
 */
async function publishToPlatform(
  platform: string,
  content: any,
  images: any[],
  scheduledAt?: number
): Promise<any> {
  // 创建发布记录
  const recordId = savePublishRecord({
    content_id: content.id,
    platform,
    status: 'pending',
    scheduled_at: scheduledAt,
    retry_count: 0
  })

  try {
    let result: any

    if (platform === 'wechat') {
      result = await publishToWeChat(content, images)
    } else if (platform === 'xiaohongshu') {
      result = await publishToXiaohongshu(content, images)
    } else {
      throw new Error(`不支持的平台: ${platform}`)
    }

    // 更新发布记录
    updatePublishRecord(recordId, {
      status: result.success ? 'success' : 'failed',
      platform_post_id: result.mediaId || result.postId,
      published_url: result.publishedUrl,
      error_message: result.error
    })

    return {
      recordId,
      ...result
    }

  } catch (error) {
    // 更新发布记录为失败
    updatePublishRecord(recordId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : String(error)
    })

    throw error
  }
}

/**
 * 发布到微信公众号
 */
async function publishToWeChat(content: any, images: any[]): Promise<any> {
  const publisher = getWeChatPublisher()

  if (!publisher) {
    throw new Error("微信发布器未配置，请先配置微信公众号")
  }

  // 检查权限
  const permissions = await publisher.checkPermissions()
  if (!permissions.canCreateDraft) {
    throw new Error("微信公众号权限不足，无法创建草稿")
  }

  // 构建微信内容
  const wechatContent: WeChatContent = {
    title: content.title,
    content: content.contentWithImages || content.content_text,
    digest: content.summary,
    author: 'AI创作助手',
    showCoverPic: 1,
    needOpenComment: 0,
    onlyFansCanComment: 0
  }

  // 设置封面图片（使用第一张图片）
  if (images.length > 0 && images[0].imageUrl) {
    wechatContent.thumbMediaId = images[0].imageUrl
  }

  // 创建草稿
  const draftResult = await publisher.createDraft(wechatContent)

  if (!draftResult.success) {
    throw new Error(`创建微信草稿失败: ${draftResult.error}`)
  }

  const result: any = {
    success: true,
    mediaId: draftResult.mediaId,
    action: 'draft_created',
    message: `微信公众号草稿创建成功${content.content_source === 'manual' ? '（手动编辑内容）' : '（AI生成内容）'}`
  }

  // 如果有发布权限，尝试直接发布
  if (permissions.canPublish) {
    try {
      const publishResult = await publisher.publishDraft(draftResult.mediaId!)
      if (publishResult.success) {
        result.action = 'published'
        result.publishedUrl = publishResult.publishedUrl
        result.message = '微信公众号发布成功'
      }
    } catch (error) {
      result.warning = '草稿已创建，但发布失败'
    }
  } else {
    result.warning = '个人账号只能创建草稿，请手动登录微信公众平台发布'
  }

  return result
}

/**
 * 发布到小红书
 */
async function publishToXiaohongshu(content: any, images: any[]): Promise<any> {
  const publisher = getXiaohongshuPublisher()

  // 构建小红书内容
  const xhsContent: XiaohongshuContent = {
    title: content.title,
    content: content.contentWithImages || content.content_text,
    images: images.map(img => img.imageUrl).filter(Boolean),
    tags: []
  }

  // 格式化内容
  const result = await publisher.simulatePublish(xhsContent)

  if (!result.success) {
    throw new Error(`小红书内容格式化失败: ${result.error}`)
  }

  return {
    success: true,
    postId: `xhs_${Date.now()}`,
    action: 'content_formatted',
    formattedContent: result.formattedContent,
    suggestedTags: result.suggestedTags,
    images: result.images,
    manualPublishNote: result.manualPublishNote,
    message: '小红书内容格式化成功，请手动发布到小红书APP'
  }
}