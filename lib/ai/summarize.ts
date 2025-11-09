import { callAI, getAIModels } from "./client"
import { generateSummarizePrompt } from "./prompts"
import { getCurrentConfig } from "./config-loader"
import { ArticleSummary } from "@/types/ai"

/**
 * 生成文章摘要
 * @param articles TOP 5 文章列表
 * @returns 文章摘要数组
 */
export async function generateArticleSummaries(articles: Array<{
  title: string
  content: string
  praise: number
  read: number
  wx_name: string
}>): Promise<ArticleSummary[]> {
  try {
    // 获取配置
    const config = await getCurrentConfig()
    const models = await getAIModels()

    // 生成用户提示词
    const userPrompt = generateSummarizePrompt(articles)

    // 调用 AI
    const response = await callAI({
      model: models.summarize,
      systemPrompt: config.prompts.summarize,
      userPrompt,
      temperature: 0.5, // 降低创造性，提高准确性
      maxTokens: 4000,
    })

    // 解析 JSON 响应
    const summaries = parseAISummaries(response, articles)

    return summaries
  } catch (error) {
    console.error("生成文章摘要失败:", error)
    throw error
  }
}

/**
 * 解析 AI 返回的摘要 JSON
 */
function parseAISummaries(
  response: string,
  articles: Array<{
    title: string
    content: string
    praise: number
    read: number
    wx_name: string
  }>
): ArticleSummary[] {
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
    const summariesData = Array.isArray(parsed) ? parsed : [parsed]

    // 转换为 ArticleSummary 格式
    const summaries: ArticleSummary[] = summariesData.map((item, index) => {
      const article = articles[index]
      const interactionRate = article.read > 0
        ? ((article.praise / article.read) * 100).toFixed(1)
        : "0.0"

      return {
        title: article.title,
        summary: item.summary || "",
        keyInfo: Array.isArray(item.keyInfo) ? item.keyInfo : [],
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        highlights: Array.isArray(item.highlights) ? item.highlights : [],
        originalData: {
          praise: article.praise,
          read: article.read,
          interaction: `${interactionRate}%`,
          wx_name: article.wx_name,
        },
      }
    })

    return summaries
  } catch (error) {
    console.error("解析 AI 摘要响应失败:", error)
    console.error("原始响应:", response)
    throw new Error("AI 返回的数据格式不正确，请重试")
  }
}
