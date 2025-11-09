import { NextRequest, NextResponse } from "next/server"
import { generateArticleSummaries } from "@/lib/ai/summarize"
import { generateTopicInsights } from "@/lib/ai/insights"
import { AIAnalyzeRequest, AIAnalyzeResponse } from "@/types/ai"

/**
 * AI 分析 API
 * 接收 TOP 5 文章，生成摘要和洞察
 */
export async function POST(request: NextRequest) {
  try {
    const body: AIAnalyzeRequest = await request.json()
    const { articles, wordCloud, keyword } = body

    // 验证参数
    if (!articles || articles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "文章列表不能为空",
        } as AIAnalyzeResponse,
        { status: 400 }
      )
    }

    if (!keyword) {
      return NextResponse.json(
        {
          success: false,
          error: "关键词不能为空",
        } as AIAnalyzeResponse,
        { status: 400 }
      )
    }

    console.log(`[AI分析] 开始分析 ${articles.length} 篇文章，关键词：${keyword}`)

    // 步骤 1: 生成文章摘要
    console.log("[AI分析] 步骤1: 生成文章摘要...")
    const summaries = await generateArticleSummaries(articles)
    console.log(`[AI分析] 完成！生成了 ${summaries.length} 份摘要`)

    // 步骤 2: 生成选题洞察
    console.log("[AI分析] 步骤2: 生成选题洞察...")
    const rawInsights = await generateTopicInsights({
      keyword,
      summaries,
      wordCloud,
    })

    // 为每条洞察添加原文信息和时间戳
    const createdAt = new Date().toISOString()
    const insights = rawInsights.map((insight, index) => {
      // 根据索引关联到对应的文章（TOP 5）
      const article = articles[index % articles.length]

      return {
        ...insight,
        sourceArticle: {
          title: article.title,
          url: article.url || "",
          publishTime: article.publish_time || "",
          wx_name: article.wx_name,
        },
        createdAt,
      }
    })
    console.log(`[AI分析] 完成！生成了 ${insights.length} 条洞察`)

    // 返回结果
    return NextResponse.json({
      success: true,
      summaries,
      insights,
    } as AIAnalyzeResponse)

  } catch (error) {
    console.error("[AI分析] 失败:", error)

    // 返回错误信息
    const errorMessage = error instanceof Error ? error.message : "AI分析失败，请重试"

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } as AIAnalyzeResponse,
      { status: 500 }
    )
  }
}
