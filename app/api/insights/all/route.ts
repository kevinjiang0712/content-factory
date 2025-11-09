import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db-supabase"

/**
 * GET /api/insights/all
 * 获取所有选题洞察（分页）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: "参数错误" },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const offset = (page - 1) * limit

    // 构建搜索条件
    const searchCondition = search
      ? `WHERE ti.title LIKE '%' || ? || '%'
         OR ti.suggested_title LIKE '%' || ? || '%'
         OR ti.direction LIKE '%' || ? || '%'
         OR ab.keyword LIKE '%' || ? || '%'`
      : ""

    const searchParams_array = search ? [search, search, search, search] : []

    // 获取洞察数据，关联批次信息
    const insightsStmt = db.prepare(`
      SELECT
        ti.id,
        ti.type,
        ti.title,
        ti.suggested_title,
        ti.direction,
        ti.audience,
        ti.angle,
        ti.source_article_title,
        ti.source_article_url,
        ti.source_article_wx_name,
        ti.created_at,
        ti.rank_index,
        ab.batch_id,
        ab.keyword as batch_keyword,
        ab.created_at as batch_created_at
      FROM topic_insights ti
      JOIN analysis_batches ab ON ti.batch_id = ab.batch_id
      ${searchCondition}
      ORDER BY ti.created_at DESC, ti.rank_index ASC
      LIMIT ? OFFSET ?
    `)

    const insights = insightsStmt.all(...searchParams_array, limit, offset)

    // 获取总数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM topic_insights ti
      JOIN analysis_batches ab ON ti.batch_id = ab.batch_id
      ${searchCondition}
    `)
    const { total } = countStmt.get(...searchParams_array) as { total: number }

    const totalPages = Math.ceil(total / limit)

    // 格式化数据
    const formattedInsights = insights.map((insight: any) => ({
      id: insight.id,
      type: insight.type,
      title: insight.title,
      suggestedTitle: insight.suggested_title,
      direction: insight.direction,
      audience: insight.audience,
      angle: insight.angle,
      sourceArticle: insight.source_article_title ? {
        title: insight.source_article_title,
        url: insight.source_article_url || "",
        wx_name: insight.source_article_wx_name || "",
      } : undefined,
      createdAt: insight.created_at,
      batchKeyword: insight.batch_keyword,
      batchId: insight.batch_id,
      rankIndex: insight.rank_index,
    }))

    return NextResponse.json({
      success: true,
      data: {
        insights: formattedInsights,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    })

  } catch (error) {
    console.error("获取洞察列表失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取洞察列表失败",
      },
      { status: 500 }
    )
  }
}