"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Settings, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface ModelSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (config: CreationConfig) => void
  loading?: boolean
  insight?: {
    title: string
    suggestedTitle: string
    direction: string
    audience: string
    angle: string
  }
}

interface CreationConfig {
  model: string
  style: string
  length: number
  tone: string
  customPrompt?: string
}

const defaultStyles = [
  { value: "professional", label: "专业风格", description: "正式、严谨、学术化" },
  { value: "casual", label: "轻松风格", description: "口语化、亲切、易懂" },
  { value: "storytelling", label: "故事化", description: "叙事性强、生动有趣" },
  { value: "analytical", label: "分析型", description: "逻辑清晰、深度分析" },
  { value: "inspirational", label: "励志型", description: "正能量、激励人心" },
]

const defaultTones = [
  { value: "neutral", label: "中性" },
  { value: "enthusiastic", label: "热情" },
  { value: "formal", label: "正式" },
  { value: "friendly", label: "友好" },
  { value: "authoritative", label: "权威" },
]

const lengthDescriptions = {
  500: "简短精炼（适合快速阅读）",
  1000: "中等篇幅（适合深度阅读）",
  1500: "详细阐述（适合专业分析）",
  2000: "全面深入（适合专题文章）",
}

export default function ModelSelectionDialog({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  insight
}: ModelSelectionDialogProps) {
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [style, setStyle] = useState("professional")
  const [length, setLength] = useState([1000])
  const [tone, setTone] = useState("neutral")
  const [customPrompt, setCustomPrompt] = useState("")
  const [modelsLoading, setModelsLoading] = useState(false)

  // 获取可用模型列表
  useEffect(() => {
    if (isOpen) {
      fetchModels()
    }
  }, [isOpen])

  const fetchModels = async () => {
    setModelsLoading(true)
    try {
      const response = await fetch("/api/config/ai/current")
      const data = await response.json()

      if (response.ok && data.success) {
        const rawModels = [
          data.data.model_summarize,
          data.data.model_insights
        ].filter(Boolean)

        // 去重处理
        const uniqueModels = Array.from(new Set(rawModels))
        setModels(uniqueModels)
        if (uniqueModels.length > 0) {
          setSelectedModel(uniqueModels[0])
        }
      }
    } catch (error) {
      console.error("获取模型列表失败:", error)
      toast.error("获取模型列表失败")
    } finally {
      setModelsLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!selectedModel) {
      toast.error("请选择一个模型")
      return
    }

    const config: CreationConfig = {
      model: selectedModel,
      style,
      length: length[0],
      tone,
      customPrompt: customPrompt.trim() || undefined,
    }

    onConfirm(config)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-600" />
            一键创作配置
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            选择AI模型和创作参数，生成高质量内容
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* 洞察信息预览 */}
          {insight && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <h4 className="text-sm font-medium text-rose-900 mb-2">基于的洞察：</h4>
              <div className="text-xs text-rose-700 space-y-1">
                <p><strong>标题：</strong>{insight.title}</p>
                <p><strong>建议标题：</strong>{insight.suggestedTitle}</p>
                <p><strong>内容方向：</strong>{insight.direction}</p>
                <p><strong>目标受众：</strong>{insight.audience}</p>
              </div>
            </div>
          )}

          {/* 模型选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">选择AI模型</Label>
            {modelsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载模型列表...
              </div>
            ) : models.length > 0 ? (
              <RadioGroup value={selectedModel} onValueChange={setSelectedModel}>
                {models.map((model, index) => (
                  <div key={`${model}-${index}`} className="flex items-center space-x-2">
                    <RadioGroupItem value={model} id={model} />
                    <Label htmlFor={model} className="text-sm text-slate-700">
                      {model}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-sm text-rose-600">
                未找到可用模型，请先配置AI模型
              </div>
            )}
          </div>

          {/* 内容风格 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">内容风格</Label>
            <div className="grid grid-cols-2 gap-2">
              {defaultStyles.map((styleOption) => (
                <div
                  key={styleOption.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    style === styleOption.value
                      ? "border-rose-300 bg-rose-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setStyle(styleOption.value)}
                >
                  <div className="text-sm font-medium text-slate-900">
                    {styleOption.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {styleOption.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 文章长度 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">
              文章长度: {length[0]} 字
            </Label>
            <Slider
              value={length}
              onValueChange={setLength}
              min={500}
              max={2000}
              step={250}
              className="w-full"
            />
            <div className="text-xs text-slate-500">
              {lengthDescriptions[length[0] as keyof typeof lengthDescriptions]}
            </div>
          </div>

          {/* 语言风格 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">语言风格</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {defaultTones.map((toneOption) => (
                  <SelectItem key={toneOption.value} value={toneOption.value}>
                    {toneOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 自定义要求 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">自定义要求（可选）</Label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="例如：加入具体案例、增加数据支撑、使用比喻手法等..."
              className="min-h-[80px] resize-none"
              maxLength={200}
            />
            <div className="text-xs text-slate-500 text-right">
              {customPrompt.length}/200
            </div>
          </div>

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
              disabled={loading || !selectedModel || modelsLoading}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  开始创作
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}