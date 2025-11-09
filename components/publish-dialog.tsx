/**
 * 一键发布弹窗组件
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Clock,
  Settings,
  ExternalLink,
  Copy,
  Download,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface PublishDialogProps {
  isOpen: boolean
  onClose: () => void
  contentId: number
  title: string
  content: string
  images: Array<{ id: number; prompt: string; imageUrl: string }>
}

interface PlatformConfig {
  platform: string
  name: string
  enabled: boolean
  configured: boolean
}

interface PublishResult {
  platform: string
  success: boolean
  mediaId?: string
  publishedUrl?: string
  formattedContent?: string
  suggestedTags?: string[]
  manualPublishNote?: string
  warning?: string
  message: string
}

export default function PublishDialog({
  isOpen,
  onClose,
  contentId,
  title,
  content,
  images
}: PublishDialogProps) {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([
    { platform: 'wechat', name: '微信公众号', enabled: true, configured: false },
    { platform: 'xiaohongshu', name: '小红书', enabled: true, configured: false }
  ])
  const [scheduledTime, setScheduledTime] = useState<string>('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResults, setPublishResults] = useState<PublishResult[]>([])
  const [currentTab, setCurrentTab] = useState('platforms')
  const [copiedContent, setCopiedContent] = useState(false)

  // 加载平台配置状态
  useEffect(() => {
    if (isOpen) {
      loadPlatformConfigs()
    }
  }, [isOpen])

  const loadPlatformConfigs = async () => {
    try {
      const response = await fetch('/api/publish/config')
      const data = await response.json()

      if (data.success) {
        const configuredPlatforms = data.data.map((p: any) => p.platform)
        setPlatforms(prev => prev.map(platform => ({
          ...platform,
          configured: configuredPlatforms.includes(platform.platform)
        })))
      }
    } catch (error) {
      console.error('加载平台配置失败:', error)
    }
  }

  const handlePlatformToggle = (platform: string) => {
    setPlatforms(prev => prev.map(p =>
      p.platform === platform ? { ...p, enabled: !p.enabled } : p
    ))
  }

  const handlePublish = async () => {
    const enabledPlatforms = platforms.filter(p => p.enabled && p.configured)
    if (enabledPlatforms.length === 0) {
      toast.error('请选择并配置至少一个发布平台')
      return
    }

    setIsPublishing(true)
    setPublishResults([])

    try {
      const requestData = {
        contentId,
        platforms: enabledPlatforms.map(p => p.platform),
        scheduledAt: scheduledTime ? new Date(scheduledTime).getTime() : undefined
      }

      const response = await fetch('/api/publish/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()

      if (data.success) {
        setPublishResults(data.data.results)
        setCurrentTab('results')

        const { success, failed } = data.data.summary
        if (success > 0 && failed === 0) {
          toast.success(`发布成功：${success} 个平台`)
        } else if (success > 0) {
          toast.warning(`部分成功：${success} 个平台成功，${failed} 个平台失败`)
        } else {
          toast.error('发布失败：所有平台都无法发布')
        }
      } else {
        toast.error(data.error || '发布失败')
      }
    } catch (error) {
      console.error('发布失败:', error)
      toast.error('发布失败，请稍后重试')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedContent(true)
    toast.success('内容已复制到剪贴板')
    setTimeout(() => setCopiedContent(false), 2000)
  }

  const handleDownloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.click()
  }

  const getResultIcon = (result: PublishResult) => {
    if (result.success) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getPlatformBadge = (platform: string) => {
    const styles: Record<string, { label: string; color: string }> = {
      wechat: { label: '微信公众号', color: 'bg-green-100 text-green-800' },
      xiaohongshu: { label: '小红书', color: 'bg-pink-100 text-pink-800' }
    }
    const style = styles[platform] || { label: platform, color: 'bg-gray-100 text-gray-800' }
    return <Badge className={style.color}>{style.label}</Badge>
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            一键发布内容
          </DialogTitle>
          <DialogDescription>
            选择发布平台，系统会自动适配各平台格式要求
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="platforms">发布平台</TabsTrigger>
            <TabsTrigger value="schedule">定时发布</TabsTrigger>
            <TabsTrigger value="results" disabled={publishResults.length === 0}>
              发布结果
            </TabsTrigger>
          </TabsList>

          {/* 平台选择 */}
          <TabsContent value="platforms" className="space-y-4">
            <div className="space-y-4">
              {platforms.map((platform) => (
                <Card key={platform.platform} className={`border-l-4 ${
                  platform.configured ? 'border-l-green-500' : 'border-l-gray-300'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={platform.platform}
                          checked={platform.enabled}
                          onCheckedChange={() => handlePlatformToggle(platform.platform)}
                          disabled={!platform.configured}
                        />
                        <Label htmlFor={platform.platform} className="flex items-center gap-2">
                          <span>{platform.name}</span>
                          {getPlatformBadge(platform.platform)}
                        </Label>
                      </div>
                      {platform.configured ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-gray-500">未配置</span>
                      )}
                    </div>
                  </CardHeader>
                  {!platform.configured && (
                    <CardContent className="pt-0">
                      <Alert>
                        <AlertDescription>
                          请先在"设置 → 发布管理"中配置{platform.name}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !platforms.some(p => p.enabled && p.configured)}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    发布中...
                  </>
                ) : (
                  '立即发布'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* 定时发布 */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  定时发布设置
                </CardTitle>
                <CardDescription>
                  设置内容在指定时间自动发布
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scheduled-time">发布时间</Label>
                  <Input
                    id="scheduled-time"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                {scheduledTime && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      内容将在 {new Date(scheduledTime).toLocaleString()} 自动发布
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setScheduledTime('')}>
                清除定时
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !platforms.some(p => p.enabled && p.configured)}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    设置定时...
                  </>
                ) : (
                  '设置定时发布'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* 发布结果 */}
          <TabsContent value="results" className="space-y-4">
            <div className="space-y-4">
              {publishResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getResultIcon(result)}
                        <div>
                          <CardTitle className="text-lg">{getPlatformBadge(result.platform)}</CardTitle>
                          <CardDescription>{result.message}</CardDescription>
                        </div>
                      </div>
                      {result.publishedUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={result.publishedUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            查看
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  {(result.formattedContent || result.suggestedTags) && (
                    <CardContent className="space-y-4">
                      {result.formattedContent && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">格式化内容</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyContent(result.formattedContent!)}
                            >
                              {copiedContent ? '已复制' : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          <Textarea
                            value={result.formattedContent}
                            readOnly
                            className="text-sm"
                            rows={6}
                          />
                        </div>
                      )}

                      {result.suggestedTags && result.suggestedTags.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">建议标签</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {result.suggestedTags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.manualPublishNote && (
                        <Alert>
                          <AlertDescription>{result.manualPublishNote}</AlertDescription>
                        </Alert>
                      )}

                      {images.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">相关图片</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {images.map((image, imgIndex) => (
                              <div key={imgIndex} className="relative group">
                                <img
                                  src={image.imageUrl}
                                  alt={image.prompt}
                                  className="w-20 h-20 object-cover rounded border"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleDownloadImage(image.imageUrl, `image_${imgIndex + 1}.jpg`)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.warning && (
                        <Alert>
                          <AlertDescription>{result.warning}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={onClose}>
                完成
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}