import { NextResponse } from "next/server"
import { getCurrentConfig } from "@/lib/ai/config-loader"
import { getActiveAIConfig, createAIConfig } from "@/lib/db-supabase"
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
    const dbConfig = await getActiveAIConfig()

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

/**
 * POST /api/config/ai/current
 * 初始化数据库 - 创建默认 AI 配置
 */
export async function POST() {
  try {
    // 检查是否已有 AI 配置
    const existingConfig = await getActiveAIConfig()
    if (existingConfig) {
      return NextResponse.json({
        success: true,
        message: '数据库已有 AI 配置，跳过初始化'
      })
    }

    // 获取环境变量中的配置
    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1'
    const modelSummarize = process.env.OPENAI_MODEL_SUMMARIZE || 'openai/gpt-4o'
    const modelInsights = process.env.OPENAI_MODEL_INSIGHTS || 'openai/gpt-4o'

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要的环境变量：OPENAI_API_KEY 或 OPENAI_BASE_URL'
        },
        { status: 400 }
      )
    }

    // 加密 API Key
    const { encryptApiKey } = await import("@/lib/crypto")
    const encryptedKey = encryptApiKey(apiKey)

    // 创建默认 AI 配置
    const configId = await createAIConfig({
      config_name: '默认 OpenAI 配置',
      provider: 'openai',
      api_key: encryptedKey,
      api_base_url: baseUrl,
      model_summarize: modelSummarize,
      model_insights: modelInsights,
      prompt_summarize: '请将以下文章内容总结为简洁的摘要，突出主要观点和关键信息。',
      prompt_insights: '请基于以下文章内容，分析出有价值的选题洞察，包括内容方向、目标受众、切入角度等。',
      is_preset: 0,
      is_active: 1,
      last_used_at: null
    })

    console.log('✅ 成功创建默认 AI 配置，ID:', configId)

    return NextResponse.json({
      success: true,
      message: '数据库初始化完成',
      data: { configId }
    })

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '数据库初始化失败'
      },
      { status: 500 }
    )
  }
}
