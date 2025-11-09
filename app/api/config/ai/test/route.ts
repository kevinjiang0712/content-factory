import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { saveAITestLog } from "@/lib/db"

/**
 * POST /api/config/ai/test
 * 测试 AI 配置是否可用
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      config_id,
      api_key,
      api_base_url,
      model_summarize,
      model_insights,
      prompt_summarize,
      prompt_insights,
      provider,
    } = body

    // 验证必需字段
    if (!api_key || !api_base_url || !model_summarize || !model_insights) {
      return NextResponse.json(
        { success: false, error: "缺少必需字段" },
        { status: 400 }
      )
    }

    // 根据服务商设置请求头
    const headers: Record<string, string> = {}
    if (provider === "openrouter") {
      // OpenRouter 需要这些头才能正常工作
      // 同时设置两种格式以确保兼容性
      headers["HTTP-Referer"] = "https://content-factory.app"
      headers["Referer"] = "https://content-factory.app"
      headers["X-Title"] = "Content Factory"
    }

    console.log("[测试配置] Provider:", provider)
    console.log("[测试配置] Headers:", headers)
    console.log("[测试配置] API Base URL:", api_base_url)
    console.log("[测试配置] API Key (masked):", api_key.slice(0, 10) + "...")

    // 创建测试客户端
    const client = new OpenAI({
      apiKey: api_key,
      baseURL: api_base_url,
      defaultHeaders: headers,
    })

    const results = {
      summarize: { success: false, error: "", time: 0 },
      insights: { success: false, error: "", time: 0 },
    }

    // 测试摘要模型
    try {
      const startTime = Date.now()
      const response = await client.chat.completions.create({
        model: model_summarize,
        messages: [
          {
            role: "system",
            content: prompt_summarize || "你是一个专业的内容分析师。",
          },
          {
            role: "user",
            content: "请用一句话介绍你自己。",
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      })

      const endTime = Date.now()
      results.summarize.time = endTime - startTime

      if (response.choices[0]?.message?.content) {
        results.summarize.success = true

        // 保存测试日志
        if (config_id) {
          saveAITestLog({
            config_id,
            test_type: "summarize",
            is_success: 1,
            error_message: null,
            response_time: results.summarize.time,
          })
        }
      } else {
        throw new Error("模型未返回内容")
      }
    } catch (error) {
      results.summarize.success = false
      results.summarize.error = error instanceof Error ? error.message : "未知错误"

      // 保存测试日志
      if (config_id) {
        saveAITestLog({
          config_id,
          test_type: "summarize",
          is_success: 0,
          error_message: results.summarize.error,
          response_time: null,
        })
      }
    }

    // 测试洞察模型
    try {
      const startTime = Date.now()
      const response = await client.chat.completions.create({
        model: model_insights,
        messages: [
          {
            role: "system",
            content: prompt_insights || "你是一个资深的内容策划专家。",
          },
          {
            role: "user",
            content: "请用一句话介绍你自己。",
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      })

      const endTime = Date.now()
      results.insights.time = endTime - startTime

      if (response.choices[0]?.message?.content) {
        results.insights.success = true

        // 保存测试日志
        if (config_id) {
          saveAITestLog({
            config_id,
            test_type: "insights",
            is_success: 1,
            error_message: null,
            response_time: results.insights.time,
          })
        }
      } else {
        throw new Error("模型未返回内容")
      }
    } catch (error) {
      results.insights.success = false
      results.insights.error = error instanceof Error ? error.message : "未知错误"

      // 保存测试日志
      if (config_id) {
        saveAITestLog({
          config_id,
          test_type: "insights",
          is_success: 0,
          error_message: results.insights.error,
          response_time: null,
        })
      }
    }

    const allSuccess = results.summarize.success && results.insights.success

    return NextResponse.json({
      success: allSuccess,
      results,
      message: allSuccess ? "所有测试通过" : "部分测试失败",
    })
  } catch (error) {
    console.error("测试 AI 配置失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "测试失败",
      },
      { status: 500 }
    )
  }
}
