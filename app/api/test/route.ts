import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "API 测试成功",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  })
}