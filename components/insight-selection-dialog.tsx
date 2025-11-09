"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface InsightSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (insight: InsightData) => void
}

interface InsightData {
  id: number
  type: string
  title: string
  suggestedTitle: string
  direction: string
  audience: string
  angle: string
  sourceArticle?: {
    title: string
    url: string
    wx_name: string
  }
  createdAt: string
  batchKeyword: string
}

export default function InsightSelectionDialog({
  isOpen,
  onClose,
  onConfirm
}: InsightSelectionDialogProps) {
  const [insights, setInsights] = useState<InsightData[]>([])
  const [selectedInsight, setSelectedInsight] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // 防抖处理搜索词
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // 获取所有洞察数据
  useEffect(() => {
    if (isOpen) {
      fetchInsights()
    }
  }, [isOpen, page, debouncedSearchTerm])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const searchParam = debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : ""
      const response = await fetch(`/api/insights/all?page=${page}&limit=20${searchParam}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setInsights(data.data.insights)
        setTotalPages(data.data.pagination.totalPages)
        setTotalCount(data.data.pagination.total)
      } else {
        toast.error("获取洞察列表失败")
      }
    } catch (error) {
      console.error("获取洞察列表失败:", error)
      toast.error("获取洞察列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 搜索时重置到第一页
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleConfirm = () => {
    if (!selectedInsight) {
      toast.error("请选择一个洞察")
      return
    }

    const selectedInsightData = insights.find(i => i.id.toString() === selectedInsight)
    if (selectedInsightData) {
      onConfirm(selectedInsightData)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-white shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-600" />
            选择选题洞察
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            选择一个洞察作为创作基础，AI将基于此生成内容
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* 搜索框 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">搜索洞察</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索洞察标题、内容方向或关键词..."
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <p className="text-xs text-slate-500">
                搜索到 {totalCount} 条结果
              </p>
            )}
          </div>

          {/* 洞察列表 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">
              洞察列表 (当前页 {insights.length} 个，共 {totalCount} 个)
            </Label>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-sm text-slate-500">加载中...</div>
              </div>
            ) : insights.length > 0 ? (
              <RadioGroup value={selectedInsight} onValueChange={setSelectedInsight}>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <RadioGroupItem
                        value={insight.id.toString()}
                        id={`insight-${insight.id}`}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="border-rose-200 text-rose-700 bg-rose-50 rounded-full px-2 py-0.5 text-xs"
                          >
                            {insight.type}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            关键词: {insight.batchKeyword}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(insight.createdAt)}
                          </span>
                        </div>

                        <Label
                          htmlFor={`insight-${insight.id}`}
                          className="text-sm font-medium text-slate-900 cursor-pointer line-clamp-2"
                        >
                          {insight.title}
                        </Label>

                        <div className="mt-2 text-xs text-slate-600 space-y-1">
                          <p><strong>建议标题:</strong> {insight.suggestedTitle}</p>
                          <p><strong>内容方向:</strong> {insight.direction}</p>
                          <p><strong>目标受众:</strong> {insight.audience}</p>
                        </div>

                        {insight.sourceArticle && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-blue-700 font-medium">参考原文:</span>
                              {insight.sourceArticle.url && (
                                <a
                                  href={insight.sourceArticle.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <span className="line-clamp-1">{insight.sourceArticle.title}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">
                  {searchTerm ? "未找到匹配的洞察" : "暂无洞察数据"}
                </p>
                <p className="text-xs mt-1">
                  {searchTerm ? "尝试其他搜索词" : "请先进行选题分析"}
                </p>
              </div>
            )}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <span className="text-sm text-slate-600 flex items-center">
                第 {page} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedInsight || loading}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              确认选择
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}