/**
 * 模型选择弹窗 V2
 * 支持文生文和文生图双模型选择
 */

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
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Sparkles, FileText, Image } from "lucide-react"
import { toast } from "sonner"

interface ModelSelectionDialogV2Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (config: CreationConfigV2) => void
  loading?: boolean
}

export interface CreationConfigV2 {
  textModel: string
  imageModel?: string
  enableImages: boolean
  style: string
  length: number
  tone: string
  customRequirements?: string
}

const styleOptions = [
  { value: "专业严谨", label: "专业严谨", description: "现代简约，专业商务风格" },
  { value: "轻松活泼", label: "轻松活泼", description: "明亮温馨，生活气息" },
  { value: "故事叙述", label: "故事叙述", description: "电影感，叙事性强" },
  { value: "数据分析", label: "数据分析", description: "科技感，数据可视化" },
  { value: "创新思路", label: "创新思路", description: "未来感，创意设计" },
]

const toneOptions = [
  { value: "中性客观", label: "中性客观" },
  { value: "热情积极", label: "热情积极" },
  { value: "正式权威", label: "正式权威" },
  { value: "友好亲切", label: "友好亲切" },
]

export default function ModelSelectionDialogV2({
  isOpen,
  onClose,
  onConfirm,
  loading = false
}: ModelSelectionDialogV2Props) {
  // 模型列表
  const [textModels, setTextModels] = useState<string[]>([])
  const [imageModels, setImageModels] = useState<string[]>([])

  // 选择的模型
  const [selectedTextModel, setSelectedTextModel] = useState("")
  const [selectedImageModel, setSelectedImageModel] = useState("")

  // 配置
  const [enableImages, setEnableImages] = useState(true)
  const [style, setStyle] = useState("专业严谨")
  const [length, setLength] = useState([1200])
  const [tone, setTone] = useState("中性客观")
  const [customRequirements, setCustomRequirements] = useState("")

  const [modelsLoading, setModelsLoading] = useState(false)

  // 获取模型列表
  useEffect(() => {
    if (isOpen) {
      fetchModels()
    }
  }, [isOpen])

  const fetchModels = async () => {
    setModelsLoading(true)
    try {
      // 获取文生文模型
      const textResponse = await fetch("/api/config/ai/models?type=text")
      if (textResponse.ok) {
        const textData = await textResponse.json()
        if (textData.success && textData.data.length > 0) {
          const models = textData.data.map((m: any) => m.model_summarize || m.model_insights).filter(Boolean)
          const unique = Array.from(new Set(models))
          setTextModels(unique)
          if (unique.length > 0) setSelectedTextModel(unique[0])
        } else {
          // Fallback: 从当前配置获取
          const fallbackResponse = await fetch("/api/config/ai/current")
          const fallbackData = await fallbackResponse.json()
          if (fallbackData.success) {
            const fallbackModels = [
              fallbackData.data.model_summarize,
              fallbackData.data.model_insights
            ].filter(Boolean)
            const unique = Array.from(new Set(fallbackModels))
            setTextModels(unique)
            if (unique.length > 0) setSelectedTextModel(unique[0])
          }
        }
      }

      // 获取文生图模型
      const imageResponse = await fetch("/api/config/ai/models?type=image")
      if (imageResponse.ok) {
        const imageData = await imageResponse.json()
        if (imageData.success && imageData.data.length > 0) {
          const models = imageData.data.map((m: any) => m.model_summarize).filter(Boolean)
          setImageModels(models)
          if (models.length > 0) setSelectedImageModel(models[0])
        } else {
          // 使用默认值
          setImageModels(["Kwai-Kolors/Kolors"])
          setSelectedImageModel("Kwai-Kolors/Kolors")
        }
      }

    } catch (error) {
      console.error("获取模型列表失败:", error)
      toast.error("获取模型列表失败")
      // 使用默认值
      setTextModels(["openai/gpt-4o"])
      setSelectedTextModel("openai/gpt-4o")
      setImageModels(["Kwai-Kolors/Kolors"])
      setSelectedImageModel("Kwai-Kolors/Kolors")
    } finally {
      setModelsLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!selectedTextModel) {
      toast.error("请选择文生文模型")
      return
    }

    if (enableImages && !selectedImageModel) {
      toast.error("请选择文生图模型")
      return
    }

    onConfirm({
      textModel: selectedTextModel,
      imageModel: enableImages ? selectedImageModel : undefined,
      enableImages,
      style,
      length: length[0],
      tone,
      customRequirements: customRequirements.trim() || undefined
    })
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
            选择模型并配置创作参数
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* 文生文模型 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium text-slate-700">文本生成模型</Label>
            </div>
            {modelsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载模型列表...
              </div>
            ) : (
              <Select value={selectedTextModel} onValueChange={setSelectedTextModel}>
                <SelectTrigger>
                  <SelectValue placeholder="选择文本生成模型" />
                </SelectTrigger>
                <SelectContent>
                  {textModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 文生图模型 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-purple-600" />
                <Label className="text-sm font-medium text-slate-700">图片生成模型</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={enableImages}
                  onCheckedChange={(checked) => setEnableImages(!!checked)}
                />
                <Label className="text-xs text-slate-600 cursor-pointer">
                  智能配图
                </Label>
              </div>
            </div>
            {enableImages && (
              <Select value={selectedImageModel} onValueChange={setSelectedImageModel}>
                <SelectTrigger>
                  <SelectValue placeholder="选择图片生成模型" />
                </SelectTrigger>
                <SelectContent>
                  {imageModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {enableImages && (
              <p className="text-xs text-slate-500">
                AI 将自动分析文章内容，智能决定配图数量（2-5张）和位置
              </p>
            )}
          </div>

          {/* 内容风格 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">内容风格</Label>
            <RadioGroup value={style} onValueChange={setStyle}>
              <div className="grid grid-cols-2 gap-3">
                {styleOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-2">
                    <RadioGroupItem value={option.value} id={`style-${option.value}`} className="mt-1" />
                    <Label htmlFor={`style-${option.value}`} className="cursor-pointer flex-1">
                      <div className="text-sm font-medium text-slate-900">{option.label}</div>
                      <div className="text-xs text-slate-500">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* 文章长度 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium text-slate-700">文章长度</Label>
              <span className="text-sm font-medium text-rose-600">{length[0]} 字</span>
            </div>
            <Slider
              value={length}
              onValueChange={setLength}
              min={500}
              max={2000}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>简短（500字）</span>
              <span>详细（2000字）</span>
            </div>
          </div>

          {/* 语言风格 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">语言风格</Label>
            <RadioGroup value={tone} onValueChange={setTone}>
              <div className="flex flex-wrap gap-3">
                {toneOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`tone-${option.value}`} />
                    <Label htmlFor={`tone-${option.value}`} className="cursor-pointer text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* 自定义要求 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">自定义要求（选填）</Label>
            <Textarea
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              placeholder="例如：重点突出数据分析，添加案例..."
              maxLength={200}
              className="min-h-[80px] resize-none"
            />
            <div className="text-xs text-slate-500 text-right">
              {customRequirements.length} / 200
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
              disabled={loading || !selectedTextModel || (enableImages && !selectedImageModel)}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  创作中...
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
