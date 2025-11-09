import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { getActiveAIConfig } from "@/lib/db-supabase"
import {
  getAnalysisPrompt,
  parseAnalysisResult,
  generateAllPrompts,
  getDefaultImagePlacement,
  type ImagePlacement
} from "@/lib/prompt-generator"
import { getSiliconFlowClient, getPlaceholderImage } from "@/lib/siliconflow-client"

interface CreateWithImagesRequest {
  insight: {
    id?: number
    title: string
    suggestedTitle: string
    direction: string
    audience: string
    angle: string
  }
  config: {
    textModel: string
    imageModel?: string
    enableImages: boolean
    style: string
    length: number
    tone: string
    customRequirements?: string
  }
}

interface ImageData {
  id: number
  paragraphIndex: number
  prompt: string
  imageUrl: string
  localPath: string | null
  isPlaceholder: boolean
  success: boolean
  error?: string
  generationTime?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateWithImagesRequest = await request.json()
    const { insight, config } = body

    // 1. 获取 AI 配置
    const aiConfig = getActiveAIConfig()
    if (!aiConfig) {
      return NextResponse.json(
        { success: false, error: "未找到激活的 AI 配置" },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey: aiConfig.api_key,
      baseURL: aiConfig.api_base_url,
    })

    // ========== 阶段 1: 生成文字内容 ==========
    const contentPrompt = `你是一个专业的内容创作者。请根据以下选题洞察创作一篇文章。

# 选题洞察
- 标题: ${insight.title}
- 建议标题: ${insight.suggestedTitle}
- 内容方向: ${insight.direction}
- 目标受众: ${insight.audience}
- 切入角度: ${insight.angle}

# 创作要求
- 文章风格: ${config.style}
- 文章长度: 约 ${config.length} 字
- 语言风格: ${config.tone}
${config.customRequirements ? `- 特殊要求: ${config.customRequirements}` : ''}

# 输出格式
请返回 JSON 格式：
{
  "title": "文章标题",
  "summary": "文章摘要（50-100字）",
  "content": "完整的文章内容，使用\\n\\n分隔段落"
}

注意：
- 文章内容应该分段清晰，每段之间用双换行符分隔
- 不要包含 Markdown 格式
- 只返回 JSON，不要有其他说明`

    const textStartTime = Date.now()
    const textResponse = await openai.chat.completions.create({
      model: config.textModel,
      messages: [{ role: "user", content: contentPrompt }],
      temperature: 0.7,
    })

    const textContent = textResponse.choices[0]?.message?.content || ""
    const textGenerationTime = Date.now() - textStartTime

    // 解析文章内容
    let articleData
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("无法提取 JSON")
      articleData = JSON.parse(jsonMatch[0])
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "解析文章内容失败" },
        { status: 500 }
      )
    }

    const { title, summary, content: articleText } = articleData

    // 如果不需要配图，直接返回
    if (!config.enableImages) {
      return NextResponse.json({
        success: true,
        data: {
          content: {
            title,
            summary,
            contentText: articleText,
            contentWithImages: articleText,
            wordCount: articleText.length,
            readingTime: Math.ceil(articleText.length / 300)
          },
          images: [],
          process: {
            textGenerationTime,
            analysisTime: 0,
            imageGenerationTime: 0,
            totalTime: textGenerationTime
          }
        }
      })
    }

    // ========== 阶段 2: 分析配图需求 ==========
    const analysisStartTime = Date.now()
    const analysisPrompt = getAnalysisPrompt(articleText, config.style)

    const analysisResponse = await openai.chat.completions.create({
      model: config.textModel,
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.3,
    })

    const analysisContent = analysisResponse.choices[0]?.message?.content || ""
    const analysisTime = Date.now() - analysisStartTime

    // 解析分析结果
    let imageAnalysis = parseAnalysisResult(analysisContent)
    if (!imageAnalysis) {
      console.warn("AI 分析失败，使用默认配图方案")
      imageAnalysis = getDefaultImagePlacement(articleText)
    }

    // 生成图片提示词
    const placementsWithPrompts = generateAllPrompts(imageAnalysis, config.style)

    // ========== 阶段 3: 生成图片 ==========
    const imageStartTime = Date.now()
    const imageClient = getSiliconFlowClient()
    const images: ImageData[] = []

    // 并发生成所有图片
    const imagePromises = placementsWithPrompts.map(async (placement, index) => {
      try {
        const result = await imageClient.generateWithRetry({
          prompt: placement.prompt!,
          size: "1024x1024",
          n: 1
        }, 2) // 最多重试2次

        return {
          id: index + 1,
          paragraphIndex: placement.paragraphIndex,
          prompt: placement.prompt!,
          imageUrl: result.local_path || result.url || getPlaceholderImage(),
          localPath: result.local_path || null,
          isPlaceholder: !result.success,
          success: result.success,
          error: result.error,
          generationTime: result.generation_time
        }
      } catch (error) {
        // 生成失败，使用占位图
        return {
          id: index + 1,
          paragraphIndex: placement.paragraphIndex,
          prompt: placement.prompt!,
          imageUrl: getPlaceholderImage(),
          localPath: null,
          isPlaceholder: true,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        }
      }
    })

    const generatedImages = await Promise.all(imagePromises)
    images.push(...generatedImages)

    const imageGenerationTime = Date.now() - imageStartTime

    // ========== 阶段 4: 插入图片到文章 ==========
    const paragraphs = articleText.split('\n\n').filter((p: string) => p.trim())

    // 从后往前插入，避免索引变化
    const sortedImages = [...images].sort((a, b) => b.paragraphIndex - a.paragraphIndex)

    sortedImages.forEach(img => {
      const insertIndex = Math.min(img.paragraphIndex + 1, paragraphs.length)
      const imageMarkdown = `\n\n![${img.prompt}](${img.imageUrl})\n\n`
      paragraphs.splice(insertIndex, 0, imageMarkdown)
    })

    const contentWithImages = paragraphs.join('\n\n')

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        content: {
          title,
          summary,
          contentText: articleText,
          contentWithImages,
          wordCount: articleText.length,
          readingTime: Math.ceil(articleText.length / 300)
        },
        images: images.map(img => ({
          id: img.id,
          paragraphIndex: img.paragraphIndex,
          prompt: img.prompt,
          imageUrl: img.imageUrl,
          isPlaceholder: img.isPlaceholder,
          success: img.success,
          error: img.error
        })),
        process: {
          textGenerationTime,
          analysisTime,
          imageGenerationTime,
          totalTime: Date.now() - textStartTime
        }
      }
    })

  } catch (error) {
    console.error("图文创作失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "图文创作失败",
      },
      { status: 500 }
    )
  }
}
