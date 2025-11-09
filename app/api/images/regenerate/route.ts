import { NextRequest, NextResponse } from "next/server"
import { getSiliconFlowClient, getPlaceholderImage } from "@/lib/siliconflow-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, negative_prompt, size } = body

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "缺少提示词" },
        { status: 400 }
      )
    }

    // 生成图片
    const client = getSiliconFlowClient()
    const result = await client.generateWithRetry({
      prompt,
      negative_prompt,
      size: size || "1024x1024",
      n: 1
    }, 2)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        imageUrl: getPlaceholderImage(),
        isPlaceholder: true
      })
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.local_path || result.url,
      localPath: result.local_path,
      isPlaceholder: false,
      generationTime: result.generation_time
    })

  } catch (error) {
    console.error("重新生成图片失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "重新生成失败",
        imageUrl: getPlaceholderImage(),
        isPlaceholder: true
      },
      { status: 500 }
    )
  }
}
