import { NextRequest, NextResponse } from "next/server"
import { getAIConfigsByType } from "@/lib/db-supabase"

/**
 * 获取模型列表API
 * 根据模型类型返回相应的配置列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as "text" | "image" | "multimodal" | null

    if (!type) {
      return NextResponse.json(
        { success: false, error: "缺少 type 参数" },
        { status: 400 }
      )
    }

    // 获取指定类型的模型配置
    const configs = getAIConfigsByType(type)

    return NextResponse.json({
      success: true,
      data: configs,
      count: configs.length
    })

  } catch (error) {
    console.error("获取模型列表失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取模型列表失败"
      },
      { status: 500 }
    )
  }
}
