"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Eye, FileText, Star } from "lucide-react"

const templateCategories = ["全部", "公众号", "小红书", "抖音", "知乎"]

const mockTemplates = [
  {
    id: 1,
    title: "产品测评模板",
    category: "小红书",
    description: "适用于产品开箱、使用体验分享",
    usage: 1234,
    rating: 4.8,
    tags: ["测评", "种草", "好物"],
  },
  {
    id: 2,
    title: "干货教程模板",
    category: "公众号",
    description: "适合技术教程、知识分享类内容",
    usage: 2345,
    rating: 4.9,
    tags: ["教程", "干货", "学习"],
  },
  {
    id: 3,
    title: "情感故事模板",
    category: "公众号",
    description: "情感共鸣类文章，引发读者共情",
    usage: 1890,
    rating: 4.7,
    tags: ["情感", "故事", "共鸣"],
  },
  {
    id: 4,
    title: "视频脚本模板",
    category: "抖音",
    description: "短视频脚本框架，含开头、正文、结尾",
    usage: 3456,
    rating: 4.9,
    tags: ["脚本", "短视频", "爆款"],
  },
  {
    id: 5,
    title: "问答类模板",
    category: "知乎",
    description: "适合回答知乎问题，逻辑清晰",
    usage: 987,
    rating: 4.6,
    tags: ["问答", "专业", "深度"],
  },
  {
    id: 6,
    title: "节日营销模板",
    category: "小红书",
    description: "节日热点营销内容模板",
    usage: 1567,
    rating: 4.8,
    tags: ["营销", "节日", "热点"],
  },
]

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("全部")

  const filteredTemplates = mockTemplates.filter(
    (template) => activeCategory === "全部" || template.category === activeCategory
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                内容模板库
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                精选优质内容模板，快速启动创作
              </p>
            </div>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6 h-11">
              <Plus className="h-4 w-4 mr-2" />
              创建模板
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Search & Filter */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <div className="relative">
                <Input
                  placeholder="搜索模板..."
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

          {/* Category Tabs */}
          <div className="flex gap-2 flex-wrap">
            {templateCategories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className={
                  activeCategory === category
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-slate-100 text-slate-700 border-0 rounded-full px-3">
                      {template.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-slate-700">{template.rating}</span>
                    </div>
                  </div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    {template.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-slate-200 text-slate-600 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500">
                      {template.usage.toLocaleString()} 次使用
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        预览
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        使用
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
