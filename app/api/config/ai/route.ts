import { NextRequest, NextResponse } from "next/server"
import {
  getAllAIConfigs,
  getActiveAIConfig,
  createAIConfig,
  updateAIConfig,
  activateAIConfig,
  deleteAIConfig,
  getAllAIConfigTemplates,
} from "@/lib/db"
import { encryptApiKey, maskApiKey, decryptApiKey } from "@/lib/crypto"
import { refreshConfigCache } from "@/lib/ai/config-loader"
import { SYSTEM_PROMPT_SUMMARIZE, SYSTEM_PROMPT_INSIGHTS } from "@/lib/ai/prompts"

/**
 * GET /api/config/ai
 * 获取所有 AI 配置
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    // 获取配置模板
    if (type === "templates") {
      const templates = getAllAIConfigTemplates()
      return NextResponse.json({ success: true, data: templates })
    }

    // 获取当前激活的配置
    if (type === "active") {
      const activeConfig = getActiveAIConfig()
      if (!activeConfig) {
        return NextResponse.json({ success: true, data: null })
      }

      // 解密并遮罩 API Key
      try {
        const decrypted = decryptApiKey(activeConfig.api_key)
        return NextResponse.json({
          success: true,
          data: {
            ...activeConfig,
            api_key: maskApiKey(decrypted),
          },
        })
      } catch (error) {
        console.error("解密 API Key 失败:", error)
        return NextResponse.json({
          success: false,
          error: "配置数据已损坏",
        })
      }
    }

    // 获取所有配置
    const configs = getAllAIConfigs()

    // 遮罩所有配置的 API Key
    const maskedConfigs = configs.map((config) => {
      try {
        const decrypted = decryptApiKey(config.api_key)
        return {
          ...config,
          api_key: maskApiKey(decrypted),
        }
      } catch (error) {
        return {
          ...config,
          api_key: "****",
        }
      }
    })

    return NextResponse.json({ success: true, data: maskedConfigs })
  } catch (error) {
    console.error("获取 AI 配置失败:", error)
    return NextResponse.json(
      { success: false, error: "获取配置失败" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/config/ai
 * 创建或更新 AI 配置
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      config_name,
      provider,
      api_key,
      api_base_url,
      model_summarize,
      model_insights,
      prompt_summarize,
      prompt_insights,
      is_active,
    } = body

    // 验证必需字段
    if (!config_name || !provider || !api_key || !api_base_url || !model_summarize || !model_insights) {
      return NextResponse.json(
        { success: false, error: "缺少必需字段" },
        { status: 400 }
      )
    }

    // 加密 API Key
    const encryptedKey = encryptApiKey(api_key)

    // 使用默认提示词（如果未提供）
    const finalPromptSummarize = prompt_summarize || SYSTEM_PROMPT_SUMMARIZE
    const finalPromptInsights = prompt_insights || SYSTEM_PROMPT_INSIGHTS

    if (id) {
      // 更新现有配置
      const success = updateAIConfig(id, {
        config_name,
        provider,
        api_key: encryptedKey,
        api_base_url,
        model_summarize,
        model_insights,
        prompt_summarize: finalPromptSummarize,
        prompt_insights: finalPromptInsights,
      })

      if (!success) {
        return NextResponse.json(
          { success: false, error: "更新配置失败" },
          { status: 500 }
        )
      }

      // 如果需要激活
      if (is_active) {
        activateAIConfig(id)
        refreshConfigCache()
      }

      return NextResponse.json({
        success: true,
        message: "配置已更新",
        id,
      })
    } else {
      // 创建新配置
      const newId = createAIConfig({
        config_name,
        provider,
        api_key: encryptedKey,
        api_base_url,
        model_summarize,
        model_insights,
        prompt_summarize: finalPromptSummarize,
        prompt_insights: finalPromptInsights,
        is_preset: 0,
        is_active: is_active ? 1 : 0,
        last_used_at: null,
      })

      // 如果需要激活
      if (is_active) {
        activateAIConfig(newId)
        refreshConfigCache()
      }

      return NextResponse.json({
        success: true,
        message: "配置已创建",
        id: newId,
      })
    }
  } catch (error) {
    console.error("保存 AI 配置失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "保存配置失败",
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/config/ai
 * 激活指定配置
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (action === "activate") {
      if (!id) {
        return NextResponse.json(
          { success: false, error: "缺少配置 ID" },
          { status: 400 }
        )
      }

      const success = activateAIConfig(id)
      if (!success) {
        return NextResponse.json(
          { success: false, error: "激活配置失败" },
          { status: 500 }
        )
      }

      // 刷新配置缓存
      refreshConfigCache()

      return NextResponse.json({
        success: true,
        message: "配置已激活",
      })
    }

    return NextResponse.json(
      { success: false, error: "未知操作" },
      { status: 400 }
    )
  } catch (error) {
    console.error("操作 AI 配置失败:", error)
    return NextResponse.json(
      { success: false, error: "操作失败" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/config/ai
 * 删除配置
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少配置 ID" },
        { status: 400 }
      )
    }

    const success = deleteAIConfig(parseInt(id))
    if (!success) {
      return NextResponse.json(
        { success: false, error: "删除配置失败（可能是预设配置）" },
        { status: 400 }
      )
    }

    // 刷新配置缓存
    refreshConfigCache()

    return NextResponse.json({
      success: true,
      message: "配置已删除",
    })
  } catch (error) {
    console.error("删除 AI 配置失败:", error)
    return NextResponse.json(
      { success: false, error: "删除配置失败" },
      { status: 500 }
    )
  }
}
