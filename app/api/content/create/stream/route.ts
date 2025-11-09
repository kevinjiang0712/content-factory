import { NextRequest } from "next/server"
import { getCurrentConfig } from "@/lib/ai/config-loader"

interface StreamChunk {
  type: "thinking" | "title" | "summary" | "content" | "error" | "complete"
  content: string
  reasoning?: string
}

/**
 * POST /api/content/create/stream
 * 流式内容创作，实时展示AI思维过程
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json()
        const { insight, config } = body

        if (!insight || !config) {
          const errorChunk: StreamChunk = {
            type: "error",
            content: "缺少必需参数"
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
          controller.close()
          return
        }

        // 获取配置
        const aiConfig = await getCurrentConfig()
        if (!aiConfig.apiKey) {
          const errorChunk: StreamChunk = {
            type: "error",
            content: "未配置AI模型"
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
          controller.close()
          return
        }

        // 发送开始思考的信号
        const thinkingStart: StreamChunk = {
          type: "thinking",
          content: "🤔 AI正在分析洞察信息..."
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(thinkingStart)}\n\n`))

        // 模拟思维过程（实际应该调用真实的AI流式API）
        await new Promise(resolve => setTimeout(resolve, 1000))
        const thinking1: StreamChunk = {
          type: "thinking",
          content: "📝 理解洞察：分析目标受众和内容方向"
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(thinking1)}\n\n`))

        await new Promise(resolve => setTimeout(resolve, 1500))
        const thinking2: StreamChunk = {
          type: "thinking",
          content: "🎯 构思内容：设计文章结构和关键论点"
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(thinking2)}\n\n`))

        await new Promise(resolve => setTimeout(resolve, 1500))
        const thinking3: StreamChunk = {
          type: "thinking",
          content: "✍️ 生成内容：按照${config.style}风格创作${config.length}字左右的文章"
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(thinking3)}\n\n`))

        // 调用真实的AI API生成内容
        try {
          const response = await fetch("http://localhost:3002/api/content/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              insight,
              config,
            }),
          })

          const data = await response.json()

          if (response.ok && data.success) {
            // 发送创作结果
            const titleChunk: StreamChunk = {
              type: "title",
              content: data.data.title
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(titleChunk)}\n\n`))

            const summaryChunk: StreamChunk = {
              type: "summary",
              content: data.data.summary
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(summaryChunk)}\n\n`))

            const contentChunk: StreamChunk = {
              type: "content",
              content: data.data.content,
              reasoning: data.data.reasoning
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(contentChunk)}\n\n`))

            // 发送完成信号
            const completeChunk: StreamChunk = {
              type: "complete",
              content: "内容创作完成！"
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeChunk)}\n\n`))
          } else {
            const errorChunk: StreamChunk = {
              type: "error",
              content: data.error || "内容创作失败"
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
          }
        } catch (error) {
          const errorChunk: StreamChunk = {
            type: "error",
            content: "调用AI服务失败"
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
        }

      } catch (error) {
        const errorChunk: StreamChunk = {
          type: "error",
          content: error instanceof Error ? error.message : "未知错误"
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}