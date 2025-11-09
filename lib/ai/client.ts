import OpenAI from "openai"
import { getCurrentConfig } from "./config-loader"

/**
 * OpenAI 客户端封装
 * 支持从数据库读取配置，灵活切换服务商和模型
 */

/**
 * 根据服务商获取请求头
 */
function getHeaders(provider: string): Record<string, string> {
  switch (provider) {
    case "openrouter":
      return {
        "HTTP-Referer": "https://content-factory.app",
        "Referer": "https://content-factory.app",
        "X-Title": "Content Factory",
      }
    case "siliconflow":
    case "zhipu":
    case "qwen":
    case "ernie":
    case "deepseek":
    case "openai":
    case "custom":
    default:
      return {}
  }
}

/**
 * 获取 OpenAI 客户端实例
 * 每次调用时从配置加载层获取最新配置
 */
export async function getAIClient(): Promise<OpenAI> {
  const config = await getCurrentConfig()

  if (!config.apiKey) {
    throw new Error("未配置 API Key，请先在系统设置中配置")
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    defaultHeaders: getHeaders(config.provider),
  })
}

/**
 * 获取当前模型配置
 */
export async function getAIModels() {
  const config = await getCurrentConfig()
  return config.models
}

// AI 调用配置
export const AI_CONFIG = {
  temperature: 0.7,        // 创造性（0-2，越高越有创造性）
  maxTokens: 4000,         // 最大输出 token 数
  topP: 0.9,               // 多样性控制
}

/**
 * 通用的 AI 调用函数
 */
export async function callAI({
  model,
  systemPrompt,
  userPrompt,
  temperature = AI_CONFIG.temperature,
  maxTokens = AI_CONFIG.maxTokens,
}: {
  model: string
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
}) {
  try {
    const client = await getAIClient()
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: AI_CONFIG.topP,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error("AI 返回内容为空")
    }

    return content
  } catch (error) {
    console.error("AI 调用失败:", error)
    if (error instanceof Error) {
      throw new Error(`AI 调用失败: ${error.message}`)
    }
    throw new Error("AI 调用失败: 未知错误")
  }
}
