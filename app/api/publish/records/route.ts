import { NextRequest, NextResponse } from "next/server"
import { getPublishRecords, updatePublishRecord } from "@/lib/db-supabase"

/**
 * 获取发布记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get("contentId") ? parseInt(searchParams.get("contentId")!) : undefined
    const platform = searchParams.get("platform") || undefined
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20

    const records = await getPublishRecords(contentId)

    return NextResponse.json({
      success: true,
      data: records,
      count: records.length
    })

  } catch (error) {
    console.error("获取发布记录失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取记录失败"
      },
      { status: 500 }
    )
  }
}

/**
 * 更新发布记录状态
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, errorMessage } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少记录ID"
        },
        { status: 400 }
      )
    }

    const success = await updatePublishRecord(id, {
      status,
      error_message: errorMessage
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: "发布记录更新成功"
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "更新失败或记录不存在"
        },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error("更新发布记录失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "更新记录失败"
      },
      { status: 500 }
    )
  }
}