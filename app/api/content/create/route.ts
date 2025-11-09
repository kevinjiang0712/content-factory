import { NextRequest, NextResponse } from "next/server"
import { callAI, getAIModels } from "@/lib/ai/client"
import { getCurrentConfig } from "@/lib/ai/config-loader"
import { toast } from "sonner"

interface ContentCreationRequest {
  insight: {
    title: string
    suggestedTitle: string
    direction: string
    audience: string
    angle: string
  }
  config: {
    model: string
    style: string
    length: number
    tone: string
    customPrompt?: string
  }
}

interface ContentCreationResponse {
  success: boolean
  data?: {
    title: string
    summary: string
    content: string
    wordCount: number
    readingTime: number
    reasoning?: string  // AI的思考过程
  }
  error?: string
}

/**
 * 生成内容创作的提示词
 */
function generateContentPrompt(params: {
  insight: ContentCreationRequest['insight']
  config: ContentCreationRequest['config']
}): string {
  const { insight, config } = params

  let prompt = `请基于以下选题洞察，创作一篇完整的文章：

【洞察信息】
- 洞察标题：${insight.title}
- 建议标题：${insight.suggestedTitle}
- 内容方向：${insight.direction}
- 目标受众：${insight.audience}
- 写作角度：${insight.angle}

【创作要求】
- 内容风格：${getStyleDescription(config.style)}
- 文章长度：约${config.length}字
- 语言风格：${getToneDescription(config.tone)}
- 生成内容包含：标题、摘要、正文
- 正文需要有完整的段落结构，逻辑清晰
`

  if (config.customPrompt) {
    prompt += `\n【特殊要求】：${config.customPrompt}\n`
  }

  prompt += `
请按照以下JSON格式返回结果：
{
  "title": "文章标题",
  "summary": "文章摘要（50-100字）",
  "content": "完整的文章内容",
  "reasoning": "你的创作思考过程，包括如何理解洞察、构思内容结构、确定写作风格等"
}

注意：
1. 标题要吸引人且符合内容
2. 摘要要概括文章核心内容
3. 正文要有明确的段落划分
4. 内容要紧扣洞察主题
5. 语言要流畅自然
6. reasoning 字段详细说明你的创作思路`

  return prompt
}

function getStyleDescription(style: string): string {
  const styles: Record<string, string> = {
    professional: "专业风格，正式、严谨、学术化",
    casual: "轻松风格，口语化、亲切、易懂",
    storytelling: "故事化，叙事性强、生动有趣",
    analytical: "分析型，逻辑清晰、深度分析",
    inspirational: "励志型，正能量、激励人心",
  }
  return styles[style] || style
}

function getToneDescription(tone: string): string {
  const tones: Record<string, string> = {
    neutral: "中性客观",
    enthusiastic: "热情积极",
    formal: "正式规范",
    friendly: "友好亲切",
    authoritative: "权威可信",
  }
  return tones[tone] || tone
}

/**
 * 解析AI返回的内容创作结果
 */
function parseContentResponse(response: string): ContentCreationResponse['data'] {
  try {
    // 清理响应文本
    let cleanedResponse = response.trim()
    cleanedResponse = cleanedResponse.replace(/^```json\s*/i, "")
    cleanedResponse = cleanedResponse.replace(/^```\s*/, "")
    cleanedResponse = cleanedResponse.replace(/```\s*$/, "")
    cleanedResponse = cleanedResponse.trim()

    // 解析JSON
    const parsed = JSON.parse(cleanedResponse)

    // 验证必需字段
    if (!parsed.title || !parsed.content) {
      throw new Error("AI返回的内容格式不正确，缺少标题或正文")
    }

    // 计算字数和阅读时间
    const wordCount = parsed.content.length
    const readingTime = Math.ceil(wordCount / 300) // 假设每分钟阅读300字

    return {
      title: parsed.title,
      summary: parsed.summary || "",
      content: parsed.content,
      wordCount,
      readingTime,
      reasoning: parsed.reasoning || "",
    }
  } catch (error) {
    console.error("解析内容创作响应失败:", error)
    console.error("原始响应:", response)
    throw new Error("AI返回的数据格式不正确，请重试")
  }
}

/**
 * POST /api/content/create
 * 基于选题洞察生成内容
 */
export async function POST(request: NextRequest) {
  try {
    const body: ContentCreationRequest = await request.json()
    const { insight, config } = body

    // 验证参数
    if (!insight || !config) {
      return NextResponse.json(
        { success: false, error: "缺少必需参数" },
        { status: 400 }
      )
    }

    console.log(`[内容创作] 开始创作，模型: ${config.model}, 长度: ${config.length}字`)

    // 获取配置
    const aiConfig = await getCurrentConfig()
    if (!aiConfig.apiKey) {
      return NextResponse.json(
        { success: false, error: "未配置AI模型" },
        { status: 400 }
      )
    }

    // 生成提示词
    const userPrompt = generateContentPrompt({ insight, config })

    // 调用AI生成内容
    const response = await callAI({
      model: config.model,
      systemPrompt: "你是一个专业的内容创作者，擅长基于选题洞察创作高质量的文章。",
      userPrompt,
      temperature: 0.7,
      maxTokens: Math.max(2000, config.length * 2), // 确保有足够的token
    })

    console.log(`[内容创作] AI生成完成，响应长度: ${response.length}`)

    // 解析AI响应
    const contentData = parseContentResponse(response)

    if (!contentData) {
      throw new Error("解析内容响应失败")
    }

    console.log(`[内容创作] 解析完成，标题: ${contentData.title}, 字数: ${contentData.wordCount}`)

    return NextResponse.json({
      success: true,
      data: contentData,
    } as ContentCreationResponse)

  } catch (error) {
    console.error("[内容创作] 失败:", error)

    const errorMessage = error instanceof Error ? error.message : "内容创作失败，请重试"

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } as ContentCreationResponse,
      { status: 500 }
    )
  }
}