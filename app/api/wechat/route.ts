import { NextRequest, NextResponse } from "next/server"
import { WechatApiResponse, WechatSearchParams } from "@/types/wechat-api"

const API_URL = "https://www.dajiala.com/fbmain/monitor/v3/kw_search"
const API_KEY = "JZLa6c63dd3d9517d45"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kw, sort_type = 1, mode = 1, period = 7, page = 1, any_kw = "", ex_kw = "", type = 1 } = body as WechatSearchParams

    // 验证必需参数
    if (!kw) {
      return NextResponse.json(
        { error: "关键词不能为空" },
        { status: 400 }
      )
    }

    // 调用第三方API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kw,
        sort_type,
        mode,
        period,
        page,
        key: API_KEY,
        any_kw,
        ex_kw,
        verifycode: "",
        type,
      }),
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`)
    }

    const data: WechatApiResponse = await response.json()

    // 添加调试日志
    console.log("API Response:", JSON.stringify(data, null, 2))

    // 检查API返回的code: 0 表示成功，其他值表示失败
    const codeNum = Number(data.code)
    if (codeNum !== 0) {
      console.error("API返回错误状态:", data.code, data.msg)
      return NextResponse.json(
        { error: `API错误 (code: ${data.code}): ${data.msg || "未知错误"}` },
        { status: 400 }
      )
    }

    // 检查是否有数据
    if (!data.data || data.data.length === 0) {
      console.warn("API返回成功但无数据")
      return NextResponse.json(
        { error: "未找到相关文章数据" },
        { status: 404 }
      )
    }

    console.log(`✓ API调用成功: 获取到 ${data.data.length} 篇文章`)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Wechat API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    )
  }
}
