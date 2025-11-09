import { NextRequest, NextResponse } from "next/server"
import { getBatchList, getBatchCount } from "@/lib/db-supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("limit") || "10")

    // 计算 offset
    const offset = (page - 1) * pageSize

    // 获取批次列表和总数
    const batches = await getBatchList(pageSize, offset)
    const total = await getBatchCount()

    // 计算总页数
    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: {
        list: batches,
        total,
        page,
        pageSize,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Get batch list error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    )
  }
}
