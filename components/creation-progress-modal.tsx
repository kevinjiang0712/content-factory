/**
 * 创作进度展示弹窗
 * 展示 4 阶段的创作过程：文字生成 → 配图分析 → 图片生成 → 内容组装
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Lightbulb,
  Image as ImageIcon,
  Layers,
  Sparkles,
  AlertCircle
} from "lucide-react"

interface CreationProgressModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: any) => void
  onError: (error: string) => void
  streamUrl: string
}

interface StageInfo {
  stage: number
  message: string
  progress: number
}

interface ImageProgress {
  index: number
  prompt: string
  url?: string
  status: 'generating' | 'success' | 'failed'
  error?: string
}

export default function CreationProgressModal({
  isOpen,
  onClose,
  onComplete,
  onError,
  streamUrl
}: CreationProgressModalProps) {
  const [currentStage, setCurrentStage] = useState<StageInfo>({
    stage: 0,
    message: '准备开始...',
    progress: 0
  })
  const [thinkingMessage, setThinkingMessage] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [analysis, setAnalysis] = useState<{ paragraphs: number; suggestedImages: number } | null>(null)
  const [images, setImages] = useState<ImageProgress[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  // 流式请求处理
  useEffect(() => {
    if (!isOpen) return

    const requestData = sessionStorage.getItem("creationRequestData")
    if (!requestData) {
      setError("缺少创作配置")
      onError("缺少创作配置")
      return
    }

    // 使用 fetch 进行流式请求
    const startStreaming = async () => {
      try {
        const response = await fetch(streamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestData,
        })

        if (!response.body) {
          throw new Error("无法获取响应流")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                switch (data.type) {
                  case 'stage':
                    setCurrentStage({
                      stage: data.stage,
                      message: data.message,
                      progress: data.progress
                    })
                    break

                  case 'thinking':
                    setThinkingMessage(data.content)
                    break

                  case 'title':
                    setTitle(data.content)
                    break

                  case 'summary':
                    setSummary(data.content)
                    break

                  case 'analysis':
                    setAnalysis({
                      paragraphs: data.paragraphs,
                      suggestedImages: data.suggestedImages
                    })
                    break

                  case 'image':
                    setImages(prev => {
                      const newImages = [...prev]
                      const existingIndex = newImages.findIndex(img => img.index === data.index)

                      const imageData: ImageProgress = {
                        index: data.index,
                        prompt: data.prompt,
                        url: data.url,
                        status: data.status,
                        error: data.error
                      }

                      if (existingIndex >= 0) {
                        newImages[existingIndex] = imageData
                      } else {
                        newImages.push(imageData)
                      }

                      return newImages
                    })
                    break

                  case 'content':
                    // 内容已生成（暂不展示，等待 complete）
                    break

                  case 'complete':
                    setIsCompleted(true)
                    onComplete(data.data)
                    break

                  case 'error':
                    setError(data.error)
                    onError(data.error)
                    break
                }
              } catch (err) {
                console.error('解析 SSE 事件失败:', err)
              }
            }
          }
        }
      } catch (err) {
        console.error('流式请求错误:', err)
        setError('连接中断，请重试')
        onError('连接中断')
      }
    }

    startStreaming()

    // Cleanup - no need to close anything since fetch is used
    return () => {
      // Cleanup if needed
    }
  }, [isOpen, streamUrl, onComplete, onError])

  if (!isOpen) return null

  const stages = [
    { id: 1, name: '文字生成', icon: FileText, color: 'text-blue-600' },
    { id: 2, name: '配图分析', icon: Lightbulb, color: 'text-amber-600' },
    { id: 3, name: '图片生成', icon: ImageIcon, color: 'text-purple-600' },
    { id: 4, name: '内容组装', icon: Layers, color: 'text-green-600' }
  ]

  const getStageStatus = (stageId: number) => {
    if (currentStage.stage > stageId) return 'completed'
    if (currentStage.stage === stageId) return 'active'
    return 'pending'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-white shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-600" />
            AI 创作中
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            {error ? '创作失败' : isCompleted ? '创作完成' : currentStage.message}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">创作失败</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                关闭
              </Button>
            </div>
          )}

          {/* 阶段进度 */}
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage.id)
              const Icon = stage.icon

              return (
                <div key={stage.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      status === 'completed' ? 'bg-green-100' :
                      status === 'active' ? 'bg-blue-100' :
                      'bg-slate-100'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : status === 'active' ? (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      ) : (
                        <Icon className={`h-5 w-5 ${stage.color} opacity-40`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          status === 'completed' ? 'text-green-900' :
                          status === 'active' ? 'text-blue-900' :
                          'text-slate-400'
                        }`}>
                          {stage.name}
                        </span>
                        {status === 'active' && currentStage.stage === stage.id && (
                          <span className="text-xs text-slate-500">
                            {currentStage.progress}%
                          </span>
                        )}
                      </div>
                      {status === 'active' && currentStage.stage === stage.id && (
                        <Progress value={currentStage.progress} className="h-1.5 mt-2" />
                      )}
                    </div>
                  </div>

                  {/* 阶段详情 */}
                  {status === 'active' && (
                    <div className="ml-11 space-y-3">
                      {/* Thinking 消息 */}
                      {thinkingMessage && (
                        <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                          <Loader2 className="h-3 w-3 animate-spin mt-0.5 flex-shrink-0" />
                          <span>{thinkingMessage}</span>
                        </div>
                      )}

                      {/* 阶段 1: 文字生成结果 */}
                      {stage.id === 1 && title && (
                        <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                          <p className="text-sm font-medium text-blue-900">{title}</p>
                          {summary && (
                            <p className="text-xs text-blue-700">{summary}</p>
                          )}
                        </div>
                      )}

                      {/* 阶段 2: 配图分析结果 */}
                      {stage.id === 2 && analysis && (
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-amber-900">
                              分析段落：<span className="font-medium">{analysis.paragraphs}</span> 个
                            </span>
                            <span className="text-amber-900">
                              配图数量：<span className="font-medium">{analysis.suggestedImages}</span> 张
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 阶段 3: 图片生成进度 */}
                      {stage.id === 3 && images.length > 0 && (
                        <div className="space-y-2">
                          {images.map((img, idx) => (
                            <div key={idx} className="bg-purple-50 p-3 rounded-lg">
                              <div className="flex items-start gap-3">
                                {img.status === 'generating' && (
                                  <Loader2 className="h-4 w-4 text-purple-600 animate-spin mt-0.5 flex-shrink-0" />
                                )}
                                {img.status === 'success' && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                )}
                                {img.status === 'failed' && (
                                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-purple-900 font-medium truncate">
                                    图片 {img.index + 1}: {img.prompt}
                                  </p>
                                  {img.error && (
                                    <p className="text-xs text-red-600 mt-1">{img.error}</p>
                                  )}
                                  {img.url && img.status === 'success' && (
                                    <img
                                      src={img.url}
                                      alt={img.prompt}
                                      className="mt-2 w-full h-32 object-cover rounded border border-purple-200"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 完成按钮 */}
          {isCompleted && (
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button onClick={onClose} className="bg-rose-600 hover:bg-rose-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                查看内容
              </Button>
            </div>
          )}

          {/* 错误时的关闭按钮 */}
          {error && !isCompleted && (
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={onClose}>
                关闭
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
