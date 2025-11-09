import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 检查基本环境变量
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasDbType = !!process.env.DATABASE_TYPE
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    console.log('环境变量检查:', {
      hasSupabaseUrl,
      hasSupabaseKey,
      hasDbType,
      hasOpenAI
    })

    return NextResponse.json({
      success: true,
      message: "简单测试成功",
      envCheck: {
        supabaseUrl: hasSupabaseUrl ? '✅' : '❌',
        supabaseKey: hasSupabaseKey ? '✅' : '❌',
        dbType: hasDbType ? '✅' : '❌',
        openAI: hasOpenAI ? '✅' : '❌'
      }
    })
  } catch (error) {
    console.error('简单测试错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}