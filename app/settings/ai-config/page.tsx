"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface AIConfig {
  id: number
  config_name: string
  provider: string
  api_key: string
  api_base_url: string
  model_summarize: string
  model_insights: string
  prompt_summarize: string
  prompt_insights: string
  model_type?: string
  is_active: number
  last_used_at: number | null
}

interface Template {
  id: number
  template_name: string
  provider: string
  api_base_url: string
  model_summarize: string
  model_insights: string
  description: string | null
  is_free: number
}

export default function AIConfigPage() {
  const [activeConfig, setActiveConfig] = useState<AIConfig | null>(null)
  const [allConfigs, setAllConfigs] = useState<AIConfig[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [selectedModelType, setSelectedModelType] = useState<string>("all")

  // 表单数据
  const [formData, setFormData] = useState({
    config_name: "",
    provider: "",
    api_key: "",
    api_base_url: "",
    model_summarize: "",
    model_insights: "",
    prompt_summarize: "",
    prompt_insights: "",
    model_type: "text",
  })

  // 加载数据
  useEffect(() => {
    loadConfigs()
    loadTemplates()
  }, [])

  const loadConfigs = async () => {
    try {
      const [activeRes, allRes] = await Promise.all([
        fetch("/api/config/ai?type=active"),
        fetch("/api/config/ai"),
      ])

      const activeData = await activeRes.json()
      const allData = await allRes.json()

      if (activeData.success) {
        setActiveConfig(activeData.data)
      }

      if (allData.success) {
        setAllConfigs(allData.data)
      }
    } catch (error) {
      console.error("加载配置失败:", error)
      toast.error("加载配置失败")
    }
  }

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/config/ai?type=templates")
      const data = await res.json()

      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error("加载模板失败:", error)
    }
  }

  // 过滤配置
  const filteredConfigs = selectedModelType === "all"
    ? allConfigs
    : allConfigs.filter(config => config.model_type === selectedModelType)

  // 使用模板
  const useTemplate = (template: Template) => {
    setFormData({
      config_name: `${template.template_name}-配置`,
      provider: template.provider,
      api_key: "",
      api_base_url: template.api_base_url,
      model_summarize: template.model_summarize,
      model_insights: template.model_insights,
      prompt_summarize: "",
      prompt_insights: "",
      model_type: "text",
    })
    setIsEditing(true)
  }

  // 保存配置
  const handleSave = async (activate: boolean) => {
    if (!formData.config_name || !formData.api_key || !formData.api_base_url) {
      toast.error("请填写必需字段")
      return
    }

    try {
      const res = await fetch("/api/config/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          is_active: activate ? 1 : 0,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(activate ? "配置已保存并激活" : "配置已保存")
        setIsEditing(false)
        loadConfigs()

        // 清空表单
        setFormData({
          config_name: "",
          provider: "",
          api_key: "",
          api_base_url: "",
          model_summarize: "",
          model_insights: "",
          prompt_summarize: "",
          prompt_insights: "",
          model_type: "text",
        })
      } else {
        toast.error(data.error || "保存失败")
      }
    } catch (error) {
      console.error("保存配置失败:", error)
      toast.error("保存配置失败")
    }
  }

  // 激活配置
  const handleActivate = async (id: number) => {
    try {
      const res = await fetch("/api/config/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "activate" }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success("配置已激活")
        loadConfigs()
      } else {
        toast.error(data.error || "激活失败")
      }
    } catch (error) {
      console.error("激活配置失败:", error)
      toast.error("激活配置失败")
    }
  }

  // 测试配置
  const handleTest = async () => {
    if (!formData.api_key || !formData.api_base_url) {
      toast.error("请填写 API Key 和 API 地址")
      return
    }

    setIsTesting(true)
    toast.info("正在测试配置，请稍候...")

    try {
      const res = await fetch("/api/config/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: formData.api_key,
          api_base_url: formData.api_base_url,
          model_summarize: formData.model_summarize,
          model_insights: formData.model_insights,
          prompt_summarize: formData.prompt_summarize,
          prompt_insights: formData.prompt_insights,
          provider: formData.provider,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(
          `测试通过！摘要模型: ${data.results.summarize.time}ms，洞察模型: ${data.results.insights.time}ms`
        )
      } else {
        let errorMsg = "测试失败：\n"
        if (!data.results.summarize.success) {
          errorMsg += `摘要模型: ${data.results.summarize.error}\n`
        }
        if (!data.results.insights.success) {
          errorMsg += `洞察模型: ${data.results.insights.error}`
        }
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error("测试配置失败:", error)
      toast.error("测试失败，请检查配置")
    } finally {
      setIsTesting(false)
    }
  }

  // 获取模型类型标签
  const getModelTypeBadge = (modelType?: string) => {
    const typeMap: Record<string, { label: string; color: string }> = {
      text: { label: "文生文", color: "bg-blue-100 text-blue-800" },
      image: { label: "文生图", color: "bg-purple-100 text-purple-800" },
      multimodal: { label: "多模态", color: "bg-green-100 text-green-800" },
    }
    const type = typeMap[modelType || "text"]
    return <Badge className={`${type.color} text-xs`}>{type.label}</Badge>
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">AI 配置管理</h1>

      {/* 模型类型筛选 */}
      <Tabs value={selectedModelType} onValueChange={setSelectedModelType} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="text">文生文</TabsTrigger>
          <TabsTrigger value="image">文生图</TabsTrigger>
          <TabsTrigger value="multimodal">多模态</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前激活的配置 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>当前激活配置</CardTitle>
        </CardHeader>
        <CardContent>
          {activeConfig ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-lg">{activeConfig.config_name}</p>
                    {getModelTypeBadge(activeConfig.model_type)}
                  </div>
                  <p className="text-sm text-gray-600">服务商: {activeConfig.provider}</p>
                  <p className="text-sm text-gray-600">API 地址: {activeConfig.api_base_url}</p>
                  <p className="text-sm text-gray-600">
                    模型: {activeConfig.model_summarize} / {activeConfig.model_insights}
                  </p>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  已激活
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">暂无激活的配置，使用环境变量默认值</p>
          )}
        </CardContent>
      </Card>

      {/* 历史配置列表 */}
      {filteredConfigs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>历史配置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredConfigs.map((config) => (
                <div
                  key={config.id}
                  className={`p-4 border rounded-lg ${
                    config.is_active ? "border-green-500 bg-green-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{config.config_name}</p>
                        {getModelTypeBadge(config.model_type)}
                      </div>
                      <p className="text-sm text-gray-600">{config.provider} - {config.api_base_url}</p>
                    </div>
                    {!config.is_active && (
                      <Button
                        size="sm"
                        onClick={() => handleActivate(config.id)}
                      >
                        激活
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 模板选择 */}
      {!isEditing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>从模板创建配置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                  onClick={() => useTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold">{template.template_name}</p>
                    {template.is_free === 1 && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        免费
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <p className="text-xs text-gray-500">
                    {template.model_summarize} / {template.model_insights}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 配置表单 */}
      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>新建配置</CardTitle>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                取消
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>配置名称 *</Label>
                <Input
                  value={formData.config_name}
                  onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
                  placeholder="如：OpenRouter-GPT4"
                />
              </div>
              <div>
                <Label>服务商</Label>
                <Input
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="如：openrouter"
                />
              </div>
              <div>
                <Label>模型类型 *</Label>
                <Select value={formData.model_type} onValueChange={(value) => setFormData({ ...formData, model_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择模型类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文生文</SelectItem>
                    <SelectItem value="image">文生图</SelectItem>
                    <SelectItem value="multimodal">多模态</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>API Key *</Label>
              <Input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="sk-..."
              />
            </div>

            <div>
              <Label>API 地址 *</Label>
              <Input
                value={formData.api_base_url}
                onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>摘要模型 *</Label>
                <Input
                  value={formData.model_summarize}
                  onChange={(e) => setFormData({ ...formData, model_summarize: e.target.value })}
                  placeholder="gpt-4o-mini"
                />
              </div>
              <div>
                <Label>洞察模型 *</Label>
                <Input
                  value={formData.model_insights}
                  onChange={(e) => setFormData({ ...formData, model_insights: e.target.value })}
                  placeholder="gpt-4o"
                />
              </div>
            </div>

            <div>
              <Label>摘要提示词（可选，留空使用默认值）</Label>
              <Textarea
                value={formData.prompt_summarize}
                onChange={(e) => setFormData({ ...formData, prompt_summarize: e.target.value })}
                placeholder="你是一个专业的内容分析师..."
                rows={4}
              />
            </div>

            <div>
              <Label>洞察提示词（可选，留空使用默认值）</Label>
              <Textarea
                value={formData.prompt_insights}
                onChange={(e) => setFormData({ ...formData, prompt_insights: e.target.value })}
                placeholder="你是一个资深的内容策划专家..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleTest}
                disabled={isTesting}
                variant="outline"
              >
                {isTesting ? "测试中..." : "测试配置"}
              </Button>
              <Button onClick={() => handleSave(false)}>
                保存
              </Button>
              <Button onClick={() => handleSave(true)}>
                保存并激活
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isEditing && (
        <div className="flex justify-center mt-6">
          <Button onClick={() => setIsEditing(true)} size="lg">
            + 新建配置
          </Button>
        </div>
      )}
    </div>
  )
}
