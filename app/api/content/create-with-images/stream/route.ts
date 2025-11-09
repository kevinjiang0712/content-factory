import { NextRequest } from "next/server"
import OpenAI from "openai"
import { getActiveAIConfig, saveGeneratedContent, saveGeneratedImage } from "@/lib/db-supabase"
import {
  getAnalysisPrompt,
  parseAnalysisResult,
  generateAllPrompts,
  getDefaultImagePlacement,
} from "@/lib/prompt-generator"
import { getSiliconFlowClient, getPlaceholderImage } from "@/lib/siliconflow-client"

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const body = await request.json()
        const { insight, config } = body

        // 获取 AI 配置
        const aiConfig = await getActiveAIConfig()
        if (!aiConfig) {
          sendEvent({ type: "error", error: "未找到激活的 AI 配置" })
          controller.close()
          return
        }

        const openai = new OpenAI({
          apiKey: aiConfig.api_key,
          baseURL: aiConfig.api_base_url,
        })

        // ========== 阶段 1: 生成文字 ==========
        sendEvent({ type: "stage", stage: 1, message: "生成文字内容", progress: 0 })
        sendEvent({ type: "thinking", content: "正在分析选题洞察..." })

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

注意：只返回 JSON，不要有其他说明`

        sendEvent({ type: "thinking", content: "正在创作文章..." })

        const textResponse = await openai.chat.completions.create({
          model: config.textModel,
          messages: [{ role: "user", content: contentPrompt }],
          temperature: 0.7,
        })

        const textContent = textResponse.choices[0]?.message?.content || ""

        // 解析文章
        let articleData
        try {
          const jsonMatch = textContent.match(/\{[\s\S]*\}/)
          if (!jsonMatch) throw new Error("无法提取 JSON")
          articleData = JSON.parse(jsonMatch[0])
        } catch (error) {
          sendEvent({ type: "error", error: "解析文章内容失败" })
          controller.close()
          return
        }

        const { title, summary, content: articleText } = articleData

        sendEvent({ type: "stage", stage: 1, message: "文字生成完成", progress: 100 })
        sendEvent({ type: "title", content: title })
        sendEvent({ type: "summary", content: summary })

        // 如果不需要配图
        if (!config.enableImages) {
          sendEvent({ type: "content", content: articleText })
          sendEvent({
            type: "complete",
            data: {
              content: {
                title,
                summary,
                contentText: articleText,
                contentWithImages: articleText,
                wordCount: articleText.length,
                readingTime: Math.ceil(articleText.length / 300)
              },
              images: []
            }
          })
          controller.close()
          return
        }

        // ========== 阶段 2: 分析配图 ==========
        sendEvent({ type: "stage", stage: 2, message: "分析配图需求", progress: 0 })
        sendEvent({ type: "thinking", content: "正在分析文章结构..." })

        const analysisPrompt = getAnalysisPrompt(articleText, config.style)
        const analysisResponse = await openai.chat.completions.create({
          model: config.textModel,
          messages: [{ role: "user", content: analysisPrompt }],
          temperature: 0.3,
        })

        const analysisContent = analysisResponse.choices[0]?.message?.content || ""
        let imageAnalysis = parseAnalysisResult(analysisContent)

        if (!imageAnalysis) {
          sendEvent({ type: "thinking", content: "使用默认配图方案..." })
          imageAnalysis = getDefaultImagePlacement(articleText)
        }

        sendEvent({
          type: "analysis",
          paragraphs: imageAnalysis.totalParagraphs,
          suggestedImages: imageAnalysis.suggestedImageCount
        })

        const placementsWithPrompts = generateAllPrompts(imageAnalysis, config.style)

        sendEvent({ type: "stage", stage: 2, message: "配图方案确定", progress: 100 })

        // ========== 阶段 3: 生成图片 ==========
        sendEvent({
          type: "stage",
          stage: 3,
          message: `生成图片 (0/${placementsWithPrompts.length})`,
          progress: 0
        })

        const imageClient = getSiliconFlowClient()
        const images: any[] = []

        for (let i = 0; i < placementsWithPrompts.length; i++) {
          const placement = placementsWithPrompts[i]

          sendEvent({
            type: "image",
            index: i,
            prompt: placement.prompt!,
            status: "generating"
          })

          try {
            const result = await imageClient.generateWithRetry({
              prompt: placement.prompt!,
              size: "1024x1024",
              n: 1
            }, 2)

            const imageData = {
              id: i + 1,
              paragraphIndex: placement.paragraphIndex,
              prompt: placement.prompt!,
              imageUrl: result.local_path || result.url || getPlaceholderImage(),
              localPath: result.local_path || null,
              isPlaceholder: !result.success,
              success: result.success,
              error: result.error
            }

            images.push(imageData)

            sendEvent({
              type: "image",
              index: i,
              url: imageData.imageUrl,
              status: result.success ? "success" : "failed",
              error: result.error
            })

          } catch (error) {
            const imageData = {
              id: i + 1,
              paragraphIndex: placement.paragraphIndex,
              prompt: placement.prompt!,
              imageUrl: getPlaceholderImage(),
              localPath: null,
              isPlaceholder: true,
              success: false,
              error: error instanceof Error ? error.message : '未知错误'
            }

            images.push(imageData)

            sendEvent({
              type: "image",
              index: i,
              url: getPlaceholderImage(),
              status: "failed",
              error: imageData.error
            })
          }

          const progress = Math.round(((i + 1) / placementsWithPrompts.length) * 100)
          sendEvent({
            type: "stage",
            stage: 3,
            message: `生成图片 (${i + 1}/${placementsWithPrompts.length})`,
            progress
          })
        }

        // ========== 阶段 4: 组装内容 ==========
        sendEvent({ type: "stage", stage: 4, message: "组装内容", progress: 0 })
        sendEvent({ type: "thinking", content: "正在将图片插入文章..." })

        const paragraphs = articleText.split('\n\n').filter((p: string) => p.trim())
        const sortedImages = [...images].sort((a, b) => b.paragraphIndex - a.paragraphIndex)

        sortedImages.forEach(img => {
          const insertIndex = Math.min(img.paragraphIndex + 1, paragraphs.length)
          const imageMarkdown = `\n\n![${img.prompt}](${img.imageUrl})\n\n`
          paragraphs.splice(insertIndex, 0, imageMarkdown)
        })

        const contentWithImages = paragraphs.join('\n\n')

        sendEvent({ type: "stage", stage: 4, message: "组装完成", progress: 100 })
        sendEvent({ type: "content", content: contentWithImages })

        // 保存到数据库
        const contentData = {
          insight_id: config.insight.id,
          title,
          summary,
          content_text: articleText,
          content_with_images: contentWithImages,
          word_count: articleText.length,
          reading_time: Math.ceil(articleText.length / 300),
          text_model: config.textModel,
          image_model: config.imageModel,
          images_data: null,
          content_source: 'ai' as 'ai' | 'manual'
        }

        const contentId = await saveGeneratedContent(contentData)

        // 保存图片记录
        for (const img of images) {
          await saveGeneratedImage({
            content_id: contentId,
            paragraph_index: img.paragraphIndex,
            prompt: img.prompt,
            negative_prompt: img.negative_prompt || '',
            image_url: img.imageUrl,
            local_path: img.localPath || '',
            is_placeholder: img.isPlaceholder ? 1 : 0,
            generation_time: img.generationTime || null
          })
        }

        // 完成
        sendEvent({
          type: "complete",
          data: {
            content: {
              id: contentId,
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
              localPath: img.localPath,
              isPlaceholder: img.isPlaceholder,
              success: img.success,
              error: img.error
            }))
          }
        })

        controller.close()

      } catch (error) {
        console.error("流式创作失败:", error)
        sendEvent({
          type: "error",
          error: error instanceof Error ? error.message : "创作失败"
        })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
