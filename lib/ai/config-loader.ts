/**
 * AI 配置加载层
 * 负责从数据库读取配置，如果没有则使用环境变量和默认值
 */

import { getActiveAIConfig } from "../db-supabase"
import { decryptApiKey } from "../crypto"
import { SYSTEM_PROMPT_SUMMARIZE, SYSTEM_PROMPT_INSIGHTS } from "./prompts"

// AI 配置接口
export interface LoadedAIConfig {
  apiKey: string
  baseURL: string
  models: {
    summarize: string
    insights: string
  }
  prompts: {
    summarize: string
    insights: string
  }
  provider: string
}

// 全局配置缓存
let cachedConfig: LoadedAIConfig | null = null

/**
 * 从环境变量获取默认配置
 */
function getDefaultConfig(): LoadedAIConfig {
  const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"

  // 根据 baseURL 判断 provider
  let provider = "openai"
  if (baseURL.includes("openrouter.ai")) {
    provider = "openrouter"
  } else if (baseURL.includes("siliconflow")) {
    provider = "siliconflow"
  }

  return {
    apiKey: process.env.OPENAI_API_KEY || "",
    baseURL,
    models: {
      summarize: process.env.OPENAI_MODEL_SUMMARIZE || "gpt-4o-mini",
      insights: process.env.OPENAI_MODEL_INSIGHTS || "gpt-4o",
    },
    prompts: {
      summarize: SYSTEM_PROMPT_SUMMARIZE,
      insights: SYSTEM_PROMPT_INSIGHTS,
    },
    provider,
  }
}

/**
 * 从数据库加载激活的配置
 */
async function loadActiveConfig(): Promise<LoadedAIConfig> {
  try {
    const activeConfig = await getActiveAIConfig()

    if (!activeConfig) {
      console.log("[AI Config] 未找到激活的配置，使用环境变量默认值")
      return getDefaultConfig()
    }

    // 解密 API Key
    let decryptedKey: string
    try {
      decryptedKey = decryptApiKey(activeConfig.api_key)
    } catch (error) {
      console.error("[AI Config] API Key 解密失败，使用环境变量")
      return getDefaultConfig()
    }

    console.log(`[AI Config] 已加载配置: ${activeConfig.config_name} (${activeConfig.provider})`)

    return {
      apiKey: decryptedKey,
      baseURL: activeConfig.api_base_url,
      models: {
        summarize: activeConfig.model_summarize,
        insights: activeConfig.model_insights,
      },
      prompts: {
        summarize: activeConfig.prompt_summarize,
        insights: activeConfig.prompt_insights,
      },
      provider: activeConfig.provider,
    }
  } catch (error) {
    console.error("[AI Config] 加载配置失败，使用环境变量默认值:", error)
    return getDefaultConfig()
  }
}

/**
 * 获取当前配置（带缓存）
 * @returns 当前AI配置
 */
export async function getCurrentConfig(): Promise<LoadedAIConfig> {
  if (!cachedConfig) {
    cachedConfig = await loadActiveConfig()
  }
  return cachedConfig
}

/**
 * 刷新配置缓存
 * 在保存/更新/激活配置后调用
 */
export function refreshConfigCache(): void {
  cachedConfig = null
  console.log("[AI Config] 配置缓存已刷新")
}

/**
 * 预加载配置（可选，用于应用启动时）
 */
export async function preloadConfig(): Promise<void> {
  console.log("[AI Config] 预加载配置...")
  await getCurrentConfig()
}
