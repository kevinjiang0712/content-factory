import { NextRequest, NextResponse } from "next/server"
import { saveGeneratedContent } from "@/lib/db-supabase"

/**
 * 保存手动编辑的内容
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, summary, content, images = body } = body

    if (!title || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "标题和内容不能为空"
        },
        { status: 400 }
      )
    }

    // 计算字数和阅读时间
    const wordCount = content.length
    const readingTime = Math.ceil(wordCount / 300)

    // 保存到数据库
    const contentId = await saveGeneratedContent({
      insight_id: null, // 手动编辑不需要关联洞察
      title,
      summary: summary || null,
      content_text: content,
      content_with_images: content, // 直接使用编辑器内容
      word_count: wordCount,
      reading_time: readingTime,
      text_model: null,
      image_model: null,
      images_data: images ? JSON.stringify(images) : null,
      content_source: 'manual'
    })

    return NextResponse.json({
      success: true,
      data: {
        id: contentId,
        message: "内容保存成功"
      }
    })

  } catch (error) {
    console.error("保存内容失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "保存失败"
      },
      { status: 500 }
    )
  }
}

/**
 * 获取已保存的内容
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少内容ID参数"
        },
        { status: 400 }
      )
    }

    // 从数据库获取内容
    const db = require("@/lib/db").default
    const stmt = db.prepare(`
      SELECT * FROM generated_contents
      WHERE id = ? AND content_source = 'manual'
    `)
    const content = stmt.get(Number(id))

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "内容不存在"
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...content,
        images: content.images_data ? JSON.parse(content.images_data) : []
      }
    })

  } catch (error) {
    console.error("获取内容失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取失败"
      },
      { status: 500 }
    )
  }
}

/**
 * 更新已保存的内容
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, summary, content, images } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少内容ID参数"
        },
        { status: 400 }
      )
    }

    const db = require("@/lib/db").default

    // 计算字数和阅读时间
    const wordCount = content ? content.length : 0
    const readingTime = Math.ceil(wordCount / 300)

    const stmt = db.prepare(`
      UPDATE generated_contents
      SET title = ?, summary = ?, content_text = ?, content_with_images = ?,
          word_count = ?, reading_time = ?, images_data = ?,
          updated_at = strftime('%s', 'now') * 1000
      WHERE id = ? AND content_source = 'manual'
    `)

    const result = stmt.run(
      title,
      summary || null,
      content || null,
      content || null,
      wordCount,
      readingTime,
      images ? JSON.stringify(images) : null,
      Number(id)
    )

    if (result.changes === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "内容不存在或无更新权限"
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "内容更新成功"
      }
    })

  } catch (error) {
    console.error("更新内容失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "更新失败"
      },
      { status: 500 }
    )
  }
}

/**
 * 删除内容
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少内容ID参数"
        },
        { status: 400 }
      )
    }

    const db = require("@/lib/db").default

    const stmt = db.prepare(`
      DELETE FROM generated_contents
      WHERE id = ? AND content_source = 'manual'
    `)

    const result = stmt.run(Number(id))

    if (result.changes === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "内容不存在或无删除权限"
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "内容删除成功"
      }
    })

  } catch (error) {
    console.error("删除内容失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "删除失败"
      },
      { status: 500 }
    )
  }
}