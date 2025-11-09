import { NextRequest, NextResponse } from "next/server"
import { getBatchDetail, deleteBatch } from "@/lib/db-supabase"

// GET 获取批次详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batch_id: string }> }
) {
  try {
    const { batch_id } = await params
    const batchId = batch_id

    const detail = getBatchDetail(batchId)

    if (!detail) {
      return NextResponse.json(
        { error: "批次不存在" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: detail,
    })
  } catch (error) {
    console.error("Get batch detail error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    )
  }
}

// DELETE 删除批次
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ batch_id: string }> }
) {
  try {
    const { batch_id } = await params
    const batchId = batch_id

    const success = deleteBatch(batchId)

    if (!success) {
      return NextResponse.json(
        { error: "删除失败或批次不存在" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "批次已删除",
    })
  } catch (error) {
    console.error("Delete batch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    )
  }
}
