import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 检查环境变量
    const envVars = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已配置' : '❌ 缺失',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已配置' : '❌ 缺失',
      databaseType: process.env.DATABASE_TYPE || '❌ 缺失',
      openaiKey: process.env.OPENAI_API_KEY ? '✅ 已配置' : '❌ 缺失',
      baseUrl: process.env.OPENAI_BASE_URL || '❌ 缺失',
      encryptionKey: process.env.ENCRYPTION_KEY ? '✅ 已配置' : '❌ 缺失',
    }

    // 尝试导入 supabase
    let supabaseStatus = '❌ 导入失败'
    try {
      const { supabase } = await import('../../lib/supabase')
      supabaseStatus = '✅ 导入成功'
    } catch (error) {
      supabaseStatus = `❌ 导入错误: ${error instanceof Error ? error.message : '未知错误'}`
    }

    // 尝试导入数据库模块
    let dbStatus = '❌ 导入失败'
    try {
      const { getActiveAIConfig } = await import('../../lib/db-supabase')
      dbStatus = '✅ 导入成功'
    } catch (error) {
      dbStatus = `❌ 导入错误: ${error instanceof Error ? error.message : '未知错误'}`
    }

    return NextResponse.json({
      success: true,
      message: "环境变量诊断",
      environment: envVars,
      supabase: supabaseStatus,
      database: dbStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '诊断失败',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}