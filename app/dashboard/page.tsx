"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  TrendingUp,
  TrendingDown,
  FileText,
  Calendar,
  Users,
  Target,
  ArrowRight,
} from "lucide-react"

const recentContent = [
  {
    id: 1,
    title: "AI工具提升10倍创作效率",
    status: "published",
    platform: "微信公众号",
    date: "2025-01-15",
    views: 12345,
    likes: 567,
  },
  {
    id: 2,
    title: "新媒体运营技巧分享",
    status: "draft",
    platform: "",
    date: "2025-01-15",
    views: 0,
    likes: 0,
  },
  {
    id: 3,
    title: "内容创作实战案例",
    status: "scheduled",
    platform: "小红书",
    date: "2025-01-20",
    views: 0,
    likes: 0,
  },
]

const upcomingSchedule = [
  {
    id: 1,
    title: "产品测评：最新AI工具",
    platform: "小红书",
    date: "2025-01-20",
    time: "10:00",
  },
  {
    id: 2,
    title: "干货分享：内容创作技巧",
    platform: "微信公众号",
    date: "2025-01-22",
    time: "14:00",
  },
]

const platformData = [
  { platform: "微信公众号", posts: 45, engagement: "12.5%" },
  { platform: "小红书", posts: 38, engagement: "15.3%" },
  { platform: "抖音", posts: 52, engagement: "18.7%" },
  { platform: "知乎", posts: 21, engagement: "9.2%" },
]

const statusConfig = {
  draft: { label: "草稿", color: "bg-slate-100 text-slate-700" },
  scheduled: { label: "定时", color: "bg-blue-100 text-blue-700" },
  published: { label: "已发布", color: "bg-emerald-100 text-emerald-700" },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats")
      const data = await response.json()

      if (response.ok && data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("获取统计数据异常:", error)
    }
  }

  // 格式化数字（K, M）
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const keyMetrics = stats ? [
    {
      label: "总内容数",
      value: stats.global.totalArticles.toString(),
      change: "+12",
      trend: "up" as const,
      icon: FileText,
    },
    {
      label: "总浏览量",
      value: formatNumber(stats.global.totalViews),
      change: "+18.5%",
      trend: "up" as const,
      icon: Eye,
    },
    {
      label: "总互动数",
      value: formatNumber(stats.global.totalLikes),
      change: "+8.3%",
      trend: "up" as const,
      icon: ThumbsUp,
    },
    {
      label: "平均互动率",
      value: `${(stats.global.avgInteractionRate * 100).toFixed(1)}%`,
      change: "-2.1%",
      trend: "down" as const,
      icon: Target,
    },
  ] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              工作台
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              你好，张三！这是你的内容创作概览
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyMetrics.map((metric, index) => (
              <Card key={index} className="bg-white border-slate-200 shadow-sm rounded-xl">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">{metric.label}</p>
                      <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
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
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <metric.icon className="h-5 w-5 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Content */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    最近内容
                  </CardTitle>
                  <Link href="/content">
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                      查看全部
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentContent.map((content) => (
                  <div
                    key={content.id}
                    className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-medium text-slate-900 line-clamp-1">
                        {content.title}
                      </h4>
                      <Badge
                        className={`${
                          statusConfig[content.status as keyof typeof statusConfig].color
                        } border-0 rounded-full px-2 py-0 text-xs`}
                      >
                        {statusConfig[content.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {content.platform && <span>{content.platform}</span>}
                      <span>{content.date}</span>
                      {content.status === "published" && (
                        <>
                          <span>{content.views.toLocaleString()} 浏览</span>
                          <span>{content.likes.toLocaleString()} 赞</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Schedule */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    即将发布
                  </CardTitle>
                  <Link href="/schedule">
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                      查看日历
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingSchedule.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <h4 className="text-sm font-medium text-slate-900 mb-2">{item.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <Badge className="bg-slate-100 text-slate-700 border-0 rounded-full px-2 py-0">
                        {item.platform}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{item.date} {item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingSchedule.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">暂无发布计划</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Platform Performance */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">
                  平台表现
                </CardTitle>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                    查看详情
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">[无数据源]</p>
                <p className="text-xs mt-1">数据库暂无平台字段</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-rose-900 mb-1">开始创作新内容</h3>
                  <p className="text-sm text-rose-700">使用模板快速开始，或从头创建</p>
                </div>
                <div className="flex gap-3">
                  <Link href="/templates">
                    <Button variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100">
                      选择模板
                    </Button>
                  </Link>
                  <Link href="/content/create">
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
                      立即创作
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
