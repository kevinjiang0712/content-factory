"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TrendingUp, TrendingDown, Eye, ThumbsUp, MessageCircle, Share2, Download, FileText } from "lucide-react"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7days")
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    try {
      const days = timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90
      const response = await fetch(`/api/stats?timeRange=${days}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("获取统计数据异常:", error)
    }
  }

  // 格式化数字
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  // 准备周数据（中文星期）
  const weeklyData = stats ? stats.daily.map((item: any, index: number) => {
    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
    const date = new Date(item.date)
    return {
      day: dayNames[date.getDay()],
      views: item.views,
      likes: item.likes
    }
  }) : []

  const keyMetrics = stats ? [
    {
      label: "总浏览量",
      value: formatNumber(stats.global.totalViews),
      change: "+12.5%",
      trend: "up" as const,
      icon: Eye,
    },
    {
      label: "总点赞数",
      value: formatNumber(stats.global.totalLikes),
      change: "+8.3%",
      trend: "up" as const,
      icon: ThumbsUp,
    },
    {
      label: "总评论数",
      value: "[无数据源]",
      change: "",
      trend: "down" as const,
      icon: MessageCircle,
    },
    {
      label: "总分享数",
      value: "[无数据源]",
      change: "",
      trend: "up" as const,
      icon: Share2,
    },
  ] : []

  const topContent = stats ? stats.topArticles.byInteraction.map((article: any) => ({
    title: article.title,
    platform: article.wx_name || "未知",
    views: article.read_count,
    likes: article.praise,
    engagement: `${(article.interaction_rate * 100).toFixed(1)}%`,
  })) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                数据洞察
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                深入了解你的内容表现
              </p>
            </div>
            <div className="flex gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48 h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">最近7天</SelectItem>
                  <SelectItem value="30days">最近30天</SelectItem>
                  <SelectItem value="90days">最近90天</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 h-11">
                <Download className="h-4 w-4 mr-2" />
                导出报告
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyMetrics.map((metric, index) => (
              <Card key={index} className="bg-white border-slate-200 shadow-sm rounded-xl">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">{metric.label}</p>
                      <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                      {metric.change && (
                        <div className="flex items-center gap-1">
                          {metric.trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-rose-600" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              metric.trend === "up" ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {metric.change}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <metric.icon className="h-5 w-5 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly Trend */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">
                本周数据趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.map((data: any, index: number) => {
                  const maxViews = Math.max(...weeklyData.map((d: any) => d.views))
                  const viewsPercent = (data.views / maxViews) * 100
                  const likesPercent = (data.likes / (maxViews / 10)) * 100

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 w-16">{data.day}</span>
                        <div className="flex-1 mx-4">
                          <div className="h-8 rounded-lg bg-slate-100 overflow-hidden flex items-center">
                            <div
                              className="h-full bg-rose-200 flex items-center justify-end px-3 transition-all"
                              style={{ width: `${viewsPercent}%` }}
                            >
                              <span className="text-xs font-medium text-rose-800">
                                {data.views.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-slate-500 text-xs w-24 text-right">
                          {data.likes.toLocaleString()} 赞
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Platform Performance */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">
                平台表现
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">[无数据源]</p>
                <p className="text-xs mt-1">数据库暂无平台字段</p>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Content */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">
                Top 表现内容
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topContent.map((content: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-slate-400 text-sm w-6 mt-1">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-900 line-clamp-1">
                        {content.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{content.platform}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="font-medium text-slate-900">
                          {content.views.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">浏览</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">
                          {content.likes.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">点赞</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-full px-3">
                        {content.engagement}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
