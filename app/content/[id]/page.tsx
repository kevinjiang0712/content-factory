"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Trash2, Share2, Download, Eye, ThumbsUp, MessageCircle, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function ContentDetailPage({ params }: { params: { id: string } }) {
  // Mock data
  const content = {
    id: params.id,
    title: "AI工具提升10倍创作效率的实战分享",
    subtitle: "从选题到发布的完整流程解析",
    status: "published",
    platforms: ["微信公众号", "小红书"],
    publishTime: "2025-01-15 10:30",
    author: "张三",
    tags: ["AI工具", "内容创作", "效率提升"],
    content: `
# 前言

在当今快节奏的内容创作环境中，AI工具已经成为内容创作者不可或缺的助手...

## 一、选题阶段的AI应用

### 1.1 数据洞察工具
- 使用AI分析热门话题
- 预测内容趋势
- 找到目标受众痛点

### 1.2 关键词优化
通过AI工具优化SEO关键词，提升内容曝光率。

## 二、创作阶段

### 2.1 内容大纲生成
AI可以根据主题快速生成结构化大纲...

### 2.2 内容润色优化
- 语法检查
- 表达优化
- 风格统一

## 三、发布与推广

使用AI工具进行多平台内容适配和最佳发布时间预测。

# 总结

合理使用AI工具，可以大幅提升内容创作效率...
    `.trim(),
  }

  const statistics = {
    views: 12345,
    likes: 567,
    comments: 89,
    shares: 123,
    engagement: "15.3%",
  }

  const platformStats = [
    {
      platform: "微信公众号",
      views: 8234,
      likes: 421,
      comments: 56,
      publishTime: "2025-01-15 10:30",
    },
    {
      platform: "小红书",
      views: 4111,
      likes: 146,
      comments: 33,
      publishTime: "2025-01-15 11:00",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/content">
            <Button variant="ghost" className="mb-4 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回内容列表
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-full px-3">
                  已发布
                </Badge>
                {content.platforms.map((platform) => (
                  <Badge
                    key={platform}
                    variant="outline"
                    className="border-slate-300 text-slate-700 rounded-full"
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                {content.title}
              </h1>
              {content.subtitle && (
                <p className="text-lg text-slate-600">{content.subtitle}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span>作者：{content.author}</span>
                <span>发布于：{content.publishTime}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </Button>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Link href={`/content/${params.id}/edit`}>
                <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {statistics.views.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">浏览量</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-50">
                    <ThumbsUp className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {statistics.likes.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">点赞数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {statistics.comments.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">评论数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <Share2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {statistics.shares.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">分享数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {statistics.engagement}
                    </p>
                    <p className="text-xs text-slate-500">互动率</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
              <TabsTrigger
                value="content"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                内容详情
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                数据分析
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                评论互动
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content">
              <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                <CardContent className="pt-6">
                  <div className="prose prose-slate max-w-none">
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                      {content.content}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-slate-600">标签：</span>
                      {content.tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-slate-100 text-slate-700 border-0 rounded-full"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-6">
              <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    各平台数据表现
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {platformStats.map((stat, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">{stat.platform}</h4>
                        <span className="text-xs text-slate-500">{stat.publishTime}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">浏览量</p>
                          <p className="font-semibold text-slate-900 mt-1">
                            {stat.views.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600">点赞数</p>
                          <p className="font-semibold text-slate-900 mt-1">
                            {stat.likes.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600">评论数</p>
                          <p className="font-semibold text-slate-900 mt-1">
                            {stat.comments.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                <CardContent className="pt-12 pb-12 text-center">
                  <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">暂无评论数据</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
