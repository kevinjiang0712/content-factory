import { NextRequest, NextResponse } from "next/server"
import { getGlobalStats, getDailyStats, getTopArticles, getTopWords } from "@/lib/db-supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") // e.g., "7", "30", "90"

    const timeRangeDays = timeRange ? parseInt(timeRange) : undefined

    // 获取全局统计
    const globalStats = await getGlobalStats(timeRangeDays)

    // 获取每日趋势（最近7天）
    const dailyStats = await getDailyStats(7)

    // 获取TOP文章
    const topLikes = await getTopArticles("praise", 5)
    const topViews = await getTopArticles("read_count", 5)
    const topInteraction = await getTopArticles("interaction_rate", 5)

    // 获取热词
    const topWords = await getTopWords(10)

    return NextResponse.json({
      success: true,
      data: {
        global: globalStats,
        daily: dailyStats,
        topArticles: {
          byLikes: topLikes,
          byViews: topViews,
          byInteraction: topInteraction,
        },
        topWords,
      },
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    )
  }
}
