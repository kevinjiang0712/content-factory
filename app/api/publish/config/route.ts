import { NextRequest, NextResponse } from "next/server"
import { getPublishPlatforms, savePublishPlatform, updatePublishPlatform } from "@/lib/db"

/**
 * 获取或更新发布平台配置
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get("platform") as 'wechat' | 'xiaohongshu' | null

    const platforms = getPublishPlatforms(platform || undefined)

    // 脱敏处理，不返回敏感信息
    const safePlatforms = platforms.map(p => ({
      ...p,
      app_secret: p.app_secret ? p.app_secret.substring(0, 8) + '...' : undefined,
      access_token: p.access_token ? '***' : undefined,
      refresh_token: p.refresh_token ? '***' : undefined,
      webhook_secret: p.webhook_secret ? '***' : undefined
    }))

    return NextResponse.json({
      success: true,
      data: safePlatforms,
      count: safePlatforms.length
    })

  } catch (error) {
    console.error("获取发布平台配置失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取配置失败"
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, platform_name, app_id, app_secret } = body

    if (!platform || !platform_name || !app_id || !app_secret) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必要参数：platform, platform_name, app_id, app_secret"
        },
        { status: 400 }
      )
    }

    const platformConfig = {
      platform,
      platform_name,
      app_id,
      app_secret,
      is_active: 1
    }

    const id = savePublishPlatform(platformConfig)

    return NextResponse.json({
      success: true,
      data: { id, ...platformConfig },
      message: "发布平台配置保存成功"
    })

  } catch (error) {
    console.error("保存发布平台配置失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "保存配置失败"
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少配置ID"
        },
        { status: 400 }
      )
    }

    const success = updatePublishPlatform(id, updates)

    if (success) {
      return NextResponse.json({
        success: true,
        message: "发布平台配置更新成功"
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "更新失败或配置不存在"
        },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error("更新发布平台配置失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "更新配置失败"
      },
      { status: 500 }
    )
  }
}