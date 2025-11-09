"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, TrendingUp, Users, Target, Lightbulb } from "lucide-react"
import Link from "next/link"

export default function TopicDetailPage({ params }: { params: { id: string } }) {
  // Mock data
  const topic = {
    id: params.id,
    type: "热点型",
    title: "AI工具提效内容创作的实战案例",
    suggestedTitle: "用AI提升10倍创作效率：5个实战工具分享",
    direction: "工具推荐 + 实际案例 + 效果对比",
    audience: "内容创作者、新媒体运营",
    angle: "实用干货、数据说话",
    keywords: ["AI工具", "效率提升", "内容创作", "实战案例", "工具推荐"],
    potential: {
      trend: "95",
      competition: "中等",
      audience: "20万+",
    },
    relatedArticles: [
      { title: "GPT-4深度解析：AI如何改变内容创作", likes: 1200 },
      { title: "新媒体运营的10个实战技巧", likes: 980 },
      { title: "内容创作者必备的AI工具推荐", likes: 723 },
    ],
    outline: [
      {
        section: "一、为什么需要AI工具",
        points: [
          "内容创作面临的效率瓶颈",
          "AI工具的核心价值",
          "数据对比：使用前后的效率提升",
        ],
      },
      {
        section: "二、5个必备AI工具推荐",
        points: [
          "ChatGPT - 内容创意和大纲生成",
          "Midjourney - 配图素材快速生成",
          "Grammarly - 文本润色和语法优化",
          "Jasper - 多平台内容适配",
          "Copy.ai - 标题和文案优化",
        ],
      },
      {
        section: "三、实战案例分享",
        points: [
          "案例1：公众号文章从构思到发布全流程",
          "案例2：小红书爆款内容创作",
          "案例3：抖音视频脚本快速生成",
        ],
      },
      {
        section: "四、使用建议和注意事项",
        points: [
          "如何选择适合自己的工具",
          "避免过度依赖AI",
          "持续学习和优化流程",
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回选题分析
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-3">
              <Badge className="bg-rose-100 text-rose-700 border-0 rounded-full px-3">
                {topic.type}
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                {topic.title}
              </h1>
              <p className="text-lg text-slate-600">{topic.suggestedTitle}</p>
            </div>

            <Link href="/content/create">
              <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6 h-11">
                <FileText className="h-4 w-4 mr-2" />
                开始创作
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Topic Info */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  选题信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">内容方向</p>
                    <p className="text-sm text-slate-600">{topic.direction}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">目标受众</p>
                    <p className="text-sm text-slate-600">{topic.audience}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-700 mb-2">写作角度</p>
                    <p className="text-sm text-slate-600">{topic.angle}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">关键词</p>
                  <div className="flex flex-wrap gap-2">
                    {topic.keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        className="bg-slate-100 text-slate-700 border-0 rounded-full px-3"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Outline */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                  建议大纲
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {topic.outline.map((section, index) => (
                    <div key={index} className="space-y-3">
                      <h3 className="font-semibold text-slate-900">{section.section}</h3>
                      <ul className="space-y-2 pl-5">
                        {section.points.map((point, pointIndex) => (
                          <li
                            key={pointIndex}
                            className="text-sm text-slate-600 list-disc"
                          >
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Related Articles */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  相关爆款文章参考
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topic.relatedArticles.map((article, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-slate-400 text-sm w-5">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                          {article.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {article.likes.toLocaleString()} 赞
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Potential Score */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  选题潜力评分
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white mb-3">
                    <span className="text-3xl font-bold">{topic.potential.trend}</span>
                  </div>
                  <p className="text-sm text-slate-600">热度指数</p>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">竞争程度</p>
                      <p className="font-medium text-slate-900">{topic.potential.competition}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">潜在受众</p>
                      <p className="font-medium text-slate-900">{topic.potential.audience}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-50">
                      <Target className="h-5 w-5 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">推荐指数</p>
                      <p className="font-medium text-slate-900">⭐⭐⭐⭐⭐</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Writing Tips */}
            <Card className="bg-blue-50 border-blue-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  写作建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>开头用数据或案例吸引读者注意</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>每个工具配合实际使用场景说明</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>提供具体的使用步骤和效果对比</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>结尾总结并引导读者行动</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
