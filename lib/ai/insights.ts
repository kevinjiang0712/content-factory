import { callAI, getAIModels } from "./client"
import { generateInsightsPrompt } from "./prompts"
import { getCurrentConfig } from "./config-loader"
import { ArticleSummary, TopicInsight } from "@/types/ai"

/**
 * 生成选题洞察
 * @param keyword 搜索关键词
 * @param summaries 文章摘要列表
 * @param wordCloud 词云数据
 * @returns 5条选题洞察
 */
export async function generateTopicInsights({
  keyword,
  summaries,
  wordCloud,
}: {
  keyword: string
  summaries: ArticleSummary[]
  wordCloud: Array<{ word: string; count: number }>
}): Promise<TopicInsight[]> {
  try {
    // 获取配置
    const config = await getCurrentConfig()
    const models = await getAIModels()

    // 生成用户提示词
    const userPrompt = generateInsightsPrompt({
      keyword,
      summaries,
      wordCloud,
    })

    // 调用 AI
    const response = await callAI({
      model: models.insights,
      systemPrompt: config.prompts.insights,
      userPrompt,
      temperature: 0.7, // 提高创造性
      maxTokens: 4000,
    })

    // 解析 JSON 响应
    const insights = parseAIInsights(response)

    // 确保返回5条洞察
    if (insights.length < 5) {
      throw new Error(`AI 只返回了 ${insights.length} 条洞察，少于要求的5条`)
    }

    // 只取前5条
    return insights.slice(0, 5)
  } catch (error) {
    console.error("生成选题洞察失败:", error)
    throw error
  }
}

/**
 * 解析 AI 返回的洞察 JSON
 */
function parseAIInsights(response: string): TopicInsight[] {
  try {
    // 清理响应文本，移除可能的 markdown 代码块标记
    let cleanedResponse = response.trim()
    cleanedResponse = cleanedResponse.replace(/^```json\s*/i, "")
    cleanedResponse = cleanedResponse.replace(/^```\s*/, "")
    cleanedResponse = cleanedResponse.replace(/```\s*$/, "")
    cleanedResponse = cleanedResponse.trim()

    // 解析 JSON
    const parsed = JSON.parse(cleanedResponse)

    // 确保返回的是数组
    if (!Array.isArray(parsed)) {
      throw new Error("AI 返回的不是数组格式")
    }

    // 验证并转换每条洞察
    const insights: TopicInsight[] = parsed.map((item, index) => {
      // 验证必需字段
      if (!item.type || !item.title || !item.suggestedTitle) {
        throw new Error(`第 ${index + 1} 条洞察缺少必需字段`)
      }

      return {
        type: item.type,
        title: item.title,
        suggestedTitle: item.suggestedTitle,
        direction: item.direction || "",
        audience: item.audience || "",
        angle: item.angle || "",
        reasoning: item.reasoning || "",
      }
    })

    return insights
  } catch (error) {
    console.error("解析 AI 洞察响应失败:", error)
    console.error("原始响应:", response)
    throw new Error("AI 返回的数据格式不正确，请重试")
  }
}
