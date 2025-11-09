"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Upload, Image, FileText, Video, Music, Download, Trash2, Eye } from "lucide-react"

const mockAssets = {
  images: [
    { id: 1, name: "AI工具配图.jpg", size: "2.3 MB", date: "2025-01-15", usage: 12 },
    { id: 2, name: "数据分析图表.png", size: "1.8 MB", date: "2025-01-14", usage: 8 },
    { id: 3, name: "社交媒体封面.jpg", size: "3.1 MB", date: "2025-01-13", usage: 15 },
    { id: 4, name: "产品展示图.png", size: "2.7 MB", date: "2025-01-12", usage: 6 },
  ],
  videos: [
    { id: 1, name: "产品演示视频.mp4", size: "45.2 MB", date: "2025-01-14", usage: 5 },
    { id: 2, name: "教程片段.mp4", size: "28.5 MB", date: "2025-01-12", usage: 3 },
  ],
  documents: [
    { id: 1, name: "选题策划文档.pdf", size: "856 KB", date: "2025-01-15", usage: 10 },
    { id: 2, name: "品牌指南.pdf", size: "1.2 MB", date: "2025-01-10", usage: 7 },
  ],
  audio: [
    { id: 1, name: "背景音乐-1.mp3", size: "4.5 MB", date: "2025-01-13", usage: 9 },
    { id: 2, name: "配音素材.mp3", size: "3.2 MB", date: "2025-01-11", usage: 4 },
  ],
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState("images")

  const getIcon = (type: string) => {
    switch (type) {
      case "images":
        return Image
      case "videos":
        return Video
      case "documents":
        return FileText
      case "audio":
        return Music
      default:
        return FileText
    }
  }

  const currentAssets = mockAssets[activeTab as keyof typeof mockAssets] || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                素材库
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                管理你的创作素材资源
              </p>
            </div>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6 h-11">
              <Upload className="h-4 w-4 mr-2" />
              上传素材
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Search */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="relative">
                <Input
                  placeholder="搜索素材..."
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
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
              <TabsTrigger
                value="images"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                <Image className="h-4 w-4 mr-2" />
                图片
              </TabsTrigger>
              <TabsTrigger
                value="videos"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                <Video className="h-4 w-4 mr-2" />
                视频
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                <FileText className="h-4 w-4 mr-2" />
                文档
              </TabsTrigger>
              <TabsTrigger
                value="audio"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
              >
                <Music className="h-4 w-4 mr-2" />
                音频
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {currentAssets.length === 0 ? (
                <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                  <CardContent className="pt-12 pb-12 text-center">
                    {(() => {
                      const Icon = getIcon(activeTab)
                      return <Icon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    })()}
                    <p className="text-slate-500 mb-4">暂无素材</p>
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
                      <Upload className="h-4 w-4 mr-2" />
                      上传第一个素材
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {currentAssets.map((asset) => (
                    <Card
                      key={asset.id}
                      className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 rounded-lg bg-slate-100">
                              {(() => {
                                const Icon = getIcon(activeTab)
                                return <Icon className="h-6 w-6 text-slate-600" />
                              })()}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 truncate">
                                {asset.name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span>{asset.size}</span>
                                <span>上传于 {asset.date}</span>
                                <Badge className="bg-slate-100 text-slate-700 border-0 rounded-full px-2 py-0">
                                  使用 {asset.usage} 次
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              预览
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              下载
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              删除
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Storage Info */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">存储空间</span>
                <span className="text-sm text-slate-600">2.5 GB / 10 GB</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "25%" }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
