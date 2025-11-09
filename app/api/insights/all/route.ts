import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

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

    const offset = (page - 1) * limit

    // 构建查询
    let query = supabase
      .from('topic_insights')
      .select(`
        id,
        type,
        title,
        suggested_title,
        direction,
        audience,
        angle,
        source_article_title,
        source_article_url,
        source_article_wx_name,
        created_at,
        rank_index,
        batch_id,
        analysis_batches!inner (
          batch_id,
          keyword
        )
      `, { count: 'exact' })

    // 添加搜索条件
    if (search) {
      query = query.or(`title.ilike.%${search}%,suggested_title.ilike.%${search}%,direction.ilike.%${search}%`)
    }

    // 排序和分页
    const { data: insights, error, count } = await query
      .order('created_at', { ascending: false })
      .order('rank_index', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase 查询错误:', error)
      throw error
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    // 格式化数据
    const formattedInsights = (insights || []).map((insight: any) => ({
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
      batchKeyword: insight.analysis_batches?.keyword || '',
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