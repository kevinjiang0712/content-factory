import { NextRequest, NextResponse } from "next/server"
import { saveAnalysis, generateBatchId } from "@/lib/db-supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, timeRange, articleCount, articles, wordCloud, insights } = body

    // 验证必需参数
    if (!keyword || !articles || !wordCloud) {
      return NextResponse.json(
        { error: "缺少必需参数" },
        { status: 400 }
      )
    }

    // 生成批次ID
    const batchId = generateBatchId()

    // 保存到数据库
    try {
      const success = await saveAnalysis({
        batchId,
        keyword,
        timeRange: parseInt(timeRange) || 7,
        articleCount: parseInt(articleCount) || 20,
        totalArticles: articles?.length || 0,
        articles,
        wordCloud,
        insights: insights || [], // 添加洞察数据
      })

      if (!success) {
        return NextResponse.json(
          { error: "数据库保存失败" },
          { status: 500 }
        )
      }
    } catch (dbError) {
      console.error("数据库操作失败:", dbError)
      return NextResponse.json(
        { error: `数据库操作失败: ${dbError instanceof Error ? dbError.message : '未知错误'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      batchId,
      message: "分析结果已保存",
    })
  } catch (error) {
    console.error("Save analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    )
  }
}
