"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, FileText, Clock, Check, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data
const mockContents = [
  {
    id: 1,
    title: "AI工具提升10倍创作效率的实战分享",
    status: "published",
    platform: "微信公众号",
    publishTime: "2025-01-15 10:30",
    views: 12345,
    likes: 567,
  },
  {
    id: 2,
    title: "新媒体运营的底层逻辑与方法论",
    status: "draft",
    platform: "",
    publishTime: "",
    views: 0,
    likes: 0,
  },
  {
    id: 3,
    title: "内容创作者必备的10个AI工具推荐",
    status: "scheduled",
    platform: "小红书",
    publishTime: "2025-01-20 14:00",
    views: 0,
    likes: 0,
  },
  {
    id: 4,
    title: "从0到100万粉丝的成长之路",
    status: "published",
    platform: "抖音",
    publishTime: "2025-01-12 16:45",
    views: 89456,
    likes: 3421,
  },
  {
    id: 5,
    title: "如何打造爆款视频内容",
    status: "draft",
    platform: "",
    publishTime: "",
    views: 0,
    likes: 0,
  },
]

const statusConfig = {
  draft: { label: "草稿", color: "bg-slate-100 text-slate-700" },
  scheduled: { label: "定时发布", color: "bg-blue-100 text-blue-700" },
  published: { label: "已发布", color: "bg-emerald-100 text-emerald-700" },
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("all")

  const filteredContents = mockContents.filter((content) => {
    if (activeTab === "all") return true
    return content.status === activeTab
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                内容管理
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                创作、编辑和发布你的内容
              </p>
            </div>
            <Link href="/content/create">
              <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6 h-11">
                <Plus className="h-4 w-4 mr-2" />
                创建内容
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          {/* Filters & Search */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="搜索内容标题..."
                    className="pr-10 h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-slate-100"
                  >
                    <Search className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full md:w-48 h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有平台</SelectItem>
                    <SelectItem value="wechat">微信公众号</SelectItem>
                    <SelectItem value="xiaohongshu">小红书</SelectItem>
                    <SelectItem value="douyin">抖音</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="latest">
                  <SelectTrigger className="w-full md:w-48 h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">最新创建</SelectItem>
                    <SelectItem value="views">浏览量</SelectItem>
                    <SelectItem value="likes">点赞数</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                全部
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                草稿
              </TabsTrigger>
              <TabsTrigger
                value="scheduled"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                定时发布
              </TabsTrigger>
              <TabsTrigger
                value="published"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                已发布
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6 space-y-4">
              {filteredContents.length === 0 ? (
                <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                  <CardContent className="pt-12 pb-12 text-center">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">暂无内容</p>
                  </CardContent>
                </Card>
              ) : (
                filteredContents.map((content) => (
                  <Card
                    key={content.id}
                    className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge
                              className={`${
                                statusConfig[content.status as keyof typeof statusConfig].color
                              } border-0 rounded-full px-3 py-0.5`}
                            >
                              {statusConfig[content.status as keyof typeof statusConfig].label}
                            </Badge>
                            {content.platform && (
                              <span className="text-xs text-slate-500">{content.platform}</span>
                            )}
                          </div>

                          <h3 className="text-lg font-semibold text-slate-900">
                            {content.title}
                          </h3>

                          <div className="flex items-center gap-6 text-sm text-slate-500">
                            {content.publishTime && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>{content.publishTime}</span>
                              </div>
                            )}
                            {content.status === "published" && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <Eye className="h-4 w-4" />
                                  <span>{content.views.toLocaleString()} 浏览</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span>👍</span>
                                  <span>{content.likes.toLocaleString()} 赞</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 text-slate-600 hover:bg-slate-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-slate-200">
                              <DropdownMenuItem className="text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                                <Eye className="h-4 w-4 mr-2" />
                                预览
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                                <FileText className="h-4 w-4 mr-2" />
                                复制
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
