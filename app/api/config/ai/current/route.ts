import { NextResponse } from "next/server"
import { getCurrentConfig } from "@/lib/ai/config-loader"
import { getActiveAIConfig } from "@/lib/db-supabase"
import { maskApiKey } from "@/lib/crypto"

/**
 * GET /api/config/ai/current
 * 获取当前生效的 AI 配置（包括数据库配置和环境变量回退）
 */
export async function GET() {
  try {
    // 获取当前生效的配置
    const config = await getCurrentConfig()

    // 检查是否有数据库配置
    const dbConfig = getActiveAIConfig()

    // 判断配置来源
    const source = dbConfig ? "database" : "environment"
    const configName = dbConfig ? dbConfig.config_name : "环境变量默认配置"

    // 遮罩 API Key
    const maskedKey = maskApiKey(config.apiKey)

    // 估算 token 消耗（简单估算）
    const estimatedTokens = {
      summarize: "约 500-1000 tokens/文章",
      insights: "约 2000-4000 tokens/批次",
      total: "预计本次分析消耗 15,000-25,000 tokens"
    }

    return NextResponse.json({
      success: true,
      data: {
        source,
        config_name: configName,
        provider: config.provider,
        api_base_url: config.baseURL,
        api_key: maskedKey,
        model_summarize: config.models.summarize,
        model_insights: config.models.insights,
        estimated_tokens: estimatedTokens,
        has_config: config.apiKey !== "",
      },
    })
  } catch (error) {
    console.error("获取当前配置失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取配置失败",
      },
      { status: 500 }
    )
  }
}
