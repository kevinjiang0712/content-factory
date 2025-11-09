"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Send, Eye, Sparkles, Image, Link as LinkIcon, FileText } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ModelSelectionDialogV2, { type CreationConfigV2 } from "@/components/model-selection-dialog-v2"
import InsightSelectionDialog from "@/components/insight-selection-dialog"
import CreationProgressModal from "@/components/creation-progress-modal"
import PublishDialog from "@/components/publish-dialog"
import { toast } from "sonner"

const platformOptions = [
  { value: "wechat", label: "微信公众号", icon: "📱" },
  { value: "xiaohongshu", label: "小红书", icon: "📕" },
  { value: "douyin", label: "抖音", icon: "🎵" },
  { value: "zhihu", label: "知乎", icon: "📘" },
]

const toneOptions = [
  "专业严谨", "轻松幽默", "亲切友好", "激励鼓舞", "冷静客观"
]

export default function CreateContentPage() {
  const searchParams = useSearchParams()
  const isGenerated = searchParams.get("generated") === "true"

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("write")

  // 表单数据
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)

  // 一键创作相关状态
  const [showInsightDialog, setShowInsightDialog] = useState(false)
  const [showModelDialog, setShowModelDialog] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<any>(null)
  const [creatingContent, setCreatingContent] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [streamUrl, setStreamUrl] = useState("")

  // 图片管理状态
  const [generatedImages, setGeneratedImages] = useState<any[]>([])
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)
  const [editingPrompt, setEditingPrompt] = useState("")

  // 发布相关状态
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [currentContentId, setCurrentContentId] = useState<number | null>(null)
  const [isSavedContent, setIsSavedContent] = useState(false) // 标记内容是否已保存
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false) // 标记是否有未保存的更改

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  // 检查是否有从主页生成的内容
  useEffect(() => {
    if (isGenerated) {
      const savedContent = sessionStorage.getItem("generatedContent")
      if (savedContent) {
        try {
          const contentData = JSON.parse(savedContent)
          setTitle(contentData.title || "")
          setSummary(contentData.summary || "")
          setContent(contentData.content || "")
          setWordCount(contentData.wordCount || 0)
          setReadingTime(contentData.readingTime || 0)

          toast.success("内容已自动填入", {
            description: `基于"${contentData.sourceInsight?.title || '洞察'}"生成`,
          })

          // 清除存储的内容
          sessionStorage.removeItem("generatedContent")
        } catch (error) {
          console.error("解析生成内容失败:", error)
        }
      }
    }
  }, [isGenerated])

  // 监听内容变化，标记未保存状态
  useEffect(() => {
    // 如果内容已经被保存，并且有任何更改，标记为有未保存的更改
    if (isSavedContent && (title || summary || content)) {
      setHasUnsavedChanges(true)
    }
  }, [title, summary, content, isSavedContent])

  // 处理按选题洞察一键创作
  const handleInsightSelection = () => {
    setShowInsightDialog(true)
  }

  // 确认选择洞察
  const handleInsightConfirm = (insight: any) => {
    setSelectedInsight(insight)
    setShowInsightDialog(false)
    setShowModelDialog(true)
  }

  // 确认模型配置并开始创作
  const handleModelConfirm = async (config: CreationConfigV2) => {
    if (!selectedInsight) return

    setCreatingContent(true)
    setShowModelDialog(false)

    // 保存请求数据
    const requestData = {
      insight: {
        title: selectedInsight.title,
        suggestedTitle: selectedInsight.suggestedTitle,
        direction: selectedInsight.direction,
        audience: selectedInsight.audience,
        angle: selectedInsight.angle,
      },
      config,
    }

    sessionStorage.setItem("creationRequestData", JSON.stringify(requestData))
    setStreamUrl("/api/content/create-with-images/stream")
    setShowProgressModal(true)
  }

  // 处理创作完成
  const handleCreationComplete = (data: any) => {
    setShowProgressModal(false)
    setCreatingContent(false)
    setSelectedInsight(null)

    // 设置内容
    setTitle(data.content.title)
    setSummary(data.content.summary)
    setContent(data.content.contentWithImages)
    setWordCount(data.content.wordCount)
    setReadingTime(data.content.readingTime)

    // 保存图片数据
    if (data.images && data.images.length > 0) {
      setGeneratedImages(data.images)
    }

    // 保存内容ID用于发布
    if (data.content.id) {
      setCurrentContentId(data.content.id)
      setIsSavedContent(true) // 标记为已保存的内容
      console.log("内容ID已设置:", data.content.id)
    } else {
      console.error("警告：未收到内容ID")
    }

    toast.success("内容创作完成", {
      description: `已生成 ${data.content.wordCount} 字内容${data.images?.length > 0 ? `，配图 ${data.images.length} 张` : ''}`,
    })

    // 清除临时存储
    sessionStorage.removeItem("creationConfig")
  }

  // 处理创作错误
  const handleCreationError = (error: string) => {
    setShowProgressModal(false)
    setCreatingContent(false)
    setSelectedInsight(null)

    toast.error("创作失败", {
      description: error,
    })

    // 清除临时存储
    sessionStorage.removeItem("creationRequestData")
  }

  // 图片编辑功能
  const handleDeleteImage = (imageId: number) => {
    const image = generatedImages.find(img => img.id === imageId)
    if (!image) return

    // 从内容中删除图片
    const imageMarkdown = `![${image.prompt}](${image.imageUrl})`
    const newContent = content.replace(imageMarkdown, "").replace(/\n\n\n+/g, "\n\n")
    setContent(newContent)

    // 从图片列表中删除
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId))

    toast.success("图片已删除")
  }

  const handleRegenerateImage = async (imageId: number) => {
    const image = generatedImages.find(img => img.id === imageId)
    if (!image) return

    toast.info("正在重新生成图片...")

    try {
      const response = await fetch("/api/images/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: image.prompt,
          size: "1024x1024",
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 更新图片URL
        const oldImageUrl = image.imageUrl
        const newImageUrl = result.imageUrl

        // 更新内容中的图片链接
        const newContent = content.replace(oldImageUrl, newImageUrl)
        setContent(newContent)

        // 更新图片列表
        setGeneratedImages(prev =>
          prev.map(img =>
            img.id === imageId
              ? { ...img, imageUrl: newImageUrl, isPlaceholder: result.isPlaceholder }
              : img
          )
        )

        toast.success("图片重新生成成功")
      } else {
        toast.error("图片生成失败", { description: result.error })
      }
    } catch (error) {
      console.error("重新生成图片失败:", error)
      toast.error("重新生成图片失败")
    }
  }

  const handleEditPrompt = (imageId: number) => {
    const image = generatedImages.find(img => img.id === imageId)
    if (!image) return

    setEditingImageIndex(imageId)
    setEditingPrompt(image.prompt)
  }

  const handleSavePrompt = async (imageId: number) => {
    if (!editingPrompt.trim()) {
      toast.error("提示词不能为空")
      return
    }

    toast.info("正在根据新提示词生成图片...")

    try {
      const response = await fetch("/api/images/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: editingPrompt,
          size: "1024x1024",
        }),
      })

      const result = await response.json()

      if (result.success) {
        const image = generatedImages.find(img => img.id === imageId)
        if (!image) return

        // 更新内容中的图片
        const oldImageMarkdown = `![${image.prompt}](${image.imageUrl})`
        const newImageMarkdown = `![${editingPrompt}](${result.imageUrl})`
        const newContent = content.replace(oldImageMarkdown, newImageMarkdown)
        setContent(newContent)

        // 更新图片列表
        setGeneratedImages(prev =>
          prev.map(img =>
            img.id === imageId
              ? { ...img, prompt: editingPrompt, imageUrl: result.imageUrl, isPlaceholder: result.isPlaceholder }
              : img
          )
        )

        setEditingImageIndex(null)
        setEditingPrompt("")
        toast.success("提示词已更新，图片已重新生成")
      } else {
        toast.error("图片生成失败", { description: result.error })
      }
    } catch (error) {
      console.error("更新提示词失败:", error)
      toast.error("更新提示词失败")
    }
  }

  const handleMoveImage = (imageId: number, direction: "up" | "down") => {
    const imageIndex = generatedImages.findIndex(img => img.id === imageId)
    if (imageIndex === -1) return

    const targetIndex = direction === "up" ? imageIndex - 1 : imageIndex + 1
    if (targetIndex < 0 || targetIndex >= generatedImages.length) return

    // 交换图片位置
    const newImages = [...generatedImages]
    const temp = newImages[imageIndex]
    newImages[imageIndex] = newImages[targetIndex]
    newImages[targetIndex] = temp

    setGeneratedImages(newImages)

    // TODO: 更新内容中的图片位置
    toast.success("图片位置已调整")
  }

  // 保存草稿功能
  const handleSaveDraft = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("标题和内容不能为空")
      return
    }

    try {
      toast.loading("正在保存草稿...")

      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim() || undefined,
          content: content.trim(),
          images: generatedImages
        }),
      })

      const result = await response.json()

      if (result.success) {
        setCurrentContentId(result.data.id)
        setIsSavedContent(true)
        setHasUnsavedChanges(false)
        toast.success("草稿保存成功", {
          description: "内容已保存，可以进行发布",
        })
      } else {
        toast.error("保存失败", { description: result.error })
      }
    } catch (error) {
      console.error("保存草稿失败:", error)
      toast.error("保存失败", { description: "网络错误，请重试" })
    }
  }

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

          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                创建内容
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                使用 AI 助手快速创作高质量内容
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleInsightSelection}
                disabled={creatingContent}
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50 px-6 h-11"
              >
                {creatingContent ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
                    创作中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    按选题洞察一键创作
                  </>
                )}
              </Button>
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 h-11">
                <Eye className="h-4 w-4 mr-2" />
                预览
              </Button>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 h-11"
                onClick={handleSaveDraft}
                disabled={isSavedContent && !hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                {!isSavedContent ? "保存草稿" : hasUnsavedChanges ? "保存更改" : "已保存"}
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm px-6 h-11"
                onClick={() => {
                  if (currentContentId) {
                    setShowPublishDialog(true)
                  } else {
                    if (title.trim() && content.trim()) {
                      toast.error("请先保存草稿后再进行发布", {
                        description: "点击「保存草稿」按钮保存内容",
                        action: {
                          label: "保存草稿",
                          onClick: handleSaveDraft,
                        },
                      })
                    } else {
                      toast.error("请先完成内容创作后再进行发布", {
                        description: "标题和内容不能为空",
                      })
                    }
                  }
                }}
                disabled={!title.trim() || !content.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                一键发布
                {isSavedContent && <span className="ml-1 text-green-100">✓</span>}
              </Button>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6 h-11">
                <FileText className="h-4 w-4 mr-2" />
                手动发布
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">标题</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入内容标题..."
                    className="h-12 text-lg border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">摘要</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="输入内容摘要..."
                    className="w-full h-24 p-3 border border-slate-300 rounded-lg focus:border-rose-500 focus:ring-rose-500 resize-none"
                  />
                </div>

                {/* 字数统计和状态 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-500">字数: {wordCount}</span>
                    <span className="text-slate-500">预计阅读时间: {readingTime} 分钟</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isSavedContent ? (
                      <>
                        <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                        <span className="text-slate-500">未保存</span>
                      </>
                    ) : hasUnsavedChanges ? (
                      <>
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                        <span className="text-amber-600 font-medium">有未保存更改</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-600 font-medium">已保存</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    内容编辑
                  </CardTitle>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI 优化
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-slate-100 p-1 rounded-lg mb-4">
                    <TabsTrigger
                      value="write"
                      className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-600"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      编辑
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-600"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      预览
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="write" className="space-y-4">
                    <textarea
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value)
                        setWordCount(e.target.value.length)
                        setReadingTime(Math.ceil(e.target.value.length / 300))
                      }}
                      rows={20}
                      placeholder="在这里开始写作...

支持 Markdown 格式：
- **粗体**
- *斜体*
- # 标题
- - 列表

提示：使用 AI 优化按钮让内容更加精彩！"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none resize-none text-sm leading-relaxed"
                    />

                    {/* Toolbar */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <Image className="h-4 w-4 mr-1" />
                        插入图片
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        插入链接
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview">
                    <div className="min-h-[500px] p-6 rounded-lg bg-white border border-slate-200">
                      {content ? (
                        <article className="prose prose-slate max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                          </ReactMarkdown>
                        </article>
                      ) : (
                        <p className="text-center text-slate-400 mt-20">
                          开始编辑内容后，预览将在这里显示...
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* AI Assistant */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-purple-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI 创作助手
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-purple-900">主题关键词</label>
                  <Input
                    placeholder="例如：AI 工具、内容创作"
                    className="h-11 border-purple-200 focus:border-purple-500 focus:ring-purple-500 bg-white"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-purple-900">写作语气</label>
                  <Select defaultValue="professional">
                    <SelectTrigger className="h-11 border-purple-200 focus:border-purple-500 focus:ring-purple-500 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {toneOptions.map((tone) => (
                        <SelectItem key={tone} value={tone}>
                          {tone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成内容大纲
                </Button>
              </CardContent>
            </Card>

            {/* Publish Settings */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  发布设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">发布平台</label>
                  <div className="space-y-2">
                    {platformOptions.map((platform) => (
                      <div
                        key={platform.value}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => togglePlatform(platform.value)}
                      >
                        <Checkbox
                          checked={selectedPlatforms.includes(platform.value)}
                          className="border-slate-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                        />
                        <span className="text-xl">{platform.icon}</span>
                        <span className="text-sm text-slate-700">{platform.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">发布方式</label>
                  <Select defaultValue="now">
                    <SelectTrigger className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">立即发布</SelectItem>
                      <SelectItem value="schedule">定时发布</SelectItem>
                      <SelectItem value="draft">保存为草稿</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">分类标签</label>
                  <Input
                    placeholder="添加标签，用逗号分隔"
                    className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  SEO 优化
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">SEO 描述</label>
                  <textarea
                    rows={3}
                    placeholder="简短描述内容，有助于搜索引擎收录"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none resize-none text-sm"
                  />
                  <p className="text-xs text-slate-500">0 / 160 字符</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 对话框 */}
        {/* 洞察选择对话框 */}
        <InsightSelectionDialog
          isOpen={showInsightDialog}
          onClose={() => {
            setShowInsightDialog(false)
            setSelectedInsight(null)
          }}
          onConfirm={handleInsightConfirm}
        />

        {/* 模型选择对话框 V2 */}
        <ModelSelectionDialogV2
          isOpen={showModelDialog}
          onClose={() => {
            setShowModelDialog(false)
            setSelectedInsight(null)
          }}
          onConfirm={handleModelConfirm}
          loading={creatingContent}
        />

        {/* 创作进度对话框 */}
        <CreationProgressModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          onComplete={handleCreationComplete}
          onError={handleCreationError}
          streamUrl={streamUrl}
        />

        {/* 一键发布对话框 */}
        {currentContentId && (
          <PublishDialog
            isOpen={showPublishDialog}
            onClose={() => setShowPublishDialog(false)}
            contentId={currentContentId}
            title={title}
            content={content}
            images={generatedImages}
          />
        )}
      </div>
    </div>
  )
}
