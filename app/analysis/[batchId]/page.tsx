"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react"
import { toast } from "sonner"
import { exportBatchToExcel } from "@/lib/export-excel"

interface Article {
  id: number
  title: string
  content: string | null
  praise: number
  read_count: number
  interaction_rate: number
  wx_name: string | null
  url: string | null
  short_link: string | null
  publish_time: number | null
}

interface WordCloudItem {
  id: number
  word: string
  count: number
  rank_index: number
}

interface BatchDetail {
  batch_id: string
  keyword: string
  time_range: number
  article_count: number
  total_articles: number
  created_at: number
  articles: Article[]
  wordCloud: WordCloudItem[]
}

export default function BatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.batchId as string

  const [loading, setLoading] = useState(true)
  const [batch, setBatch] = useState<BatchDetail | null>(null)
  const [topByLikes, setTopByLikes] = useState<Article[]>([])
  const [topByInteraction, setTopByInteraction] = useState<Article[]>([])

  useEffect(() => {
    fetchBatchDetail()
  }, [batchId])

  const fetchBatchDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analysis/detail/${batchId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        const batchData = data.data
        setBatch(batchData)

        // 生成 TOP 排行
        const sortedByLikes = [...batchData.articles]
          .sort((a, b) => b.praise - a.praise)
          .slice(0, 5)

        const sortedByInteraction = [...batchData.articles]
          .sort((a, b) => b.interaction_rate - a.interaction_rate)
          .slice(0, 5)

        setTopByLikes(sortedByLikes)
        setTopByInteraction(sortedByInteraction)
      } else {
        toast.error("批次不存在")
        // 3秒后返回首页
        setTimeout(() => {
          router.push("/#history-section")
        }, 3000)
      }
    } catch (error) {
      console.error("获取批次详情失败:", error)
      toast.error("加载失败", {
        description: "网络异常，请稍后重试",
      })
      setTimeout(() => {
        router.push("/#history-section")
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!batch) return

    try {
      exportBatchToExcel({
        keyword: batch.keyword,
        analysisTime: new Date(batch.created_at).toLocaleString("zh-CN"),
        timeRange: `最近${batch.time_range}天`,
        totalArticles: batch.total_articles,
        articles: batch.articles.map((article) => ({
          title: article.title,
          wx_name: article.wx_name || "未知",
          praise: article.praise,
          read_count: article.read_count,
          interaction_rate: article.interaction_rate,
          publish_time: article.publish_time,
          url: article.url || article.short_link || "",
        })),
      })

      toast.success("导出成功")
    } catch (error) {
      console.error("导出失败:", error)
      toast.error("导出失败", {
        description: "请稍后重试",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">加载中...</div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">批次不存在</p>
          <p className="text-sm text-slate-400">即将返回列表...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-8">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            选题分析
          </Link>
          <span>/</span>
          <Link href="/#history-section" className="hover:text-slate-900 transition-colors">
            历史报告
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">批次详情</span>
        </div>

        {/* 批次信息卡片 */}
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">批次详情</h1>
                  <Badge className="bg-rose-100 text-rose-700 border-0 rounded-full px-3">
                    {batch.keyword}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">分析时间</p>
                    <p className="text-slate-900 font-medium mt-1">
                      {new Date(batch.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">时间范围</p>
                    <p className="text-slate-900 font-medium mt-1">最近{batch.time_range}天</p>
                  </div>
                  <div>
                    <p className="text-slate-500">文章总数</p>
                    <p className="text-slate-900 font-medium mt-1">{batch.total_articles}篇</p>
                  </div>
                  <div>
                    <p className="text-slate-500">批次ID</p>
                    <p className="text-slate-900 font-medium mt-1 font-mono text-xs">
                      {batch.batch_id.slice(-8)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={() => router.push("/#history-section")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回列表
                </Button>
                <Button
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* TOP文章排行 */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  TOP 文章（按点赞数）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topByLikes.map((article, index) => (
                    <div
                      key={article.id}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-400 text-sm w-6">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 line-clamp-2 mb-1">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{article.wx_name || "未知"}</span>
                          <span>{article.praise.toLocaleString()} 赞</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  TOP 互动文章（按互动率）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topByInteraction.map((article, index) => (
                    <div
                      key={article.id}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-400 text-sm w-6">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 line-clamp-2 mb-1">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{article.wx_name || "未知"}</span>
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-full px-2 py-0">
                            {(article.interaction_rate * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 热门关键词云 */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                热门关键词云
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {batch.wordCloud.map((item) => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="bg-slate-100 text-slate-700 border-0 rounded-full px-4 py-2"
                    style={{
                      fontSize: `${Math.min(16 + item.count / 10, 24)}px`,
                    }}
                  >
                    {item.word}
                    <span className="ml-2 text-xs text-slate-500">({item.count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 选题洞察推荐 */}
          {batch.insights && batch.insights.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  选题洞察推荐
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {batch.insights.map((insight) => (
                    <div key={insight.id} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <Badge className="bg-rose-100 text-rose-700 border-0 rounded-full px-3 py-1">
                          {insight.type}
                        </Badge>
                        <h4 className="font-semibold text-slate-900 flex-1">{insight.title}</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                          <span className="font-medium text-slate-600 min-w-[70px]">建议标题:</span>
                          <span className="text-slate-700">{insight.suggested_title}</span>
                        </div>
                        {insight.direction && (
                          <div className="flex gap-2">
                            <span className="font-medium text-slate-600 min-w-[70px]">内容方向:</span>
                            <span className="text-slate-700">{insight.direction}</span>
                          </div>
                        )}
                        {insight.audience && (
                          <div className="flex gap-2">
                            <span className="font-medium text-slate-600 min-w-[70px]">目标受众:</span>
                            <span className="text-slate-700">{insight.audience}</span>
                          </div>
                        )}
                        {insight.angle && (
                          <div className="flex gap-2">
                            <span className="font-medium text-slate-600 min-w-[70px]">写作角度:</span>
                            <span className="text-slate-700">{insight.angle}</span>
                          </div>
                        )}
                        {insight.reasoning && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                            <span className="font-medium text-slate-600 text-xs block mb-1">💡 推理依据:</span>
                            <span className="text-xs text-slate-600 leading-relaxed">{insight.reasoning}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 文章明细列表 */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                文章明细列表（共 {batch.total_articles} 篇）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        序号
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        标题
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        公众号
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                        点赞数
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                        阅读数
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                        互动率
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        发布时间
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.articles.map((article, index) => (
                      <tr
                        key={article.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-slate-600">{index + 1}</td>
                        <td className="py-3 px-4 text-sm text-slate-900 max-w-md">
                          <div className="line-clamp-2">{article.title}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {article.wx_name || "未知"}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900 text-right">
                          {article.praise.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900 text-right">
                          {article.read_count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-full px-2 py-0">
                            {(article.interaction_rate * 100).toFixed(2)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {article.publish_time
                            ? new Date(article.publish_time).toLocaleString("zh-CN", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "未知"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {(article.url || article.short_link) && (
                            <a
                              href={article.url || article.short_link || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-rose-600 hover:text-rose-700 text-sm"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
