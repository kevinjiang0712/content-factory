"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Star, Plus, Download, Save, Trash2, Eye, FileText, AlertCircle, ChevronLeft, ChevronRight, Settings, ExternalLink, Edit, Sparkles } from "lucide-react"
import { WechatArticle } from "@/types/wechat-api"
import { toast } from "sonner"
import { exportBatchToExcel } from "@/lib/export-excel"
import { Label } from "@/components/ui/label"
import ModelSelectionDialog from "@/components/model-selection-dialog"

// Mock data
const favoriteKeywords = ["AI技术", "新媒体", "内容创作"]
const mockTopArticles = [
  { title: "GPT-4深度解析：AI如何改变内容创作", likes: 1200, interaction: "15.3%", url: "#" },
  { title: "新媒体运营的10个实战技巧", likes: 980, interaction: "12.8%", url: "#" },
  { title: "从0到100万粉丝的成长之路", likes: 856, interaction: "11.2%", url: "#" },
  { title: "内容创作者必备的AI工具推荐", likes: 723, interaction: "10.5%", url: "#" },
  { title: "如何打造爆款视频内容", likes: 691, interaction: "9.8%", url: "#" },
]

const mockWordCloud = [
  { word: "人工智能", count: 156 },
  { word: "内容创作", count: 89 },
  { word: "新媒体", count: 67 },
  { word: "运营", count: 54 },
  { word: "效率", count: 48 },
  { word: "技巧", count: 45 },
  { word: "流量", count: 42 },
  { word: "变现", count: 38 },
  { word: "粉丝", count: 35 },
  { word: "工具", count: 32 },
]

const mockHistory = [
  { id: 1, date: "2025-01-15 14:30", keyword: "AI技术", count: 20 },
  { id: 2, date: "2025-01-10 09:20", keyword: "新媒体", count: 20 },
  { id: 3, date: "2025-01-05 16:45", keyword: "内容创作", count: 20 },
]

export default function HomePage() {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [searchLogic, setSearchLogic] = useState("and")
  const [keyword, setKeyword] = useState("")
  const [timeRange, setTimeRange] = useState("30")
  const [articleCount, setArticleCount] = useState("20")
  const [articles, setArticles] = useState<WechatArticle[]>([])
  const [error, setError] = useState("")
  const [topArticles, setTopArticles] = useState<any[]>([])
  const [topInteractionArticles, setTopInteractionArticles] = useState<any[]>([])
  const [wordCloud, setWordCloud] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([]) // AI 生成的选题洞察
  const [analysisStep, setAnalysisStep] = useState(0) // 当前分析步骤
  const [batchId, setBatchId] = useState("") // 批次ID
  const [analysisTime, setAnalysisTime] = useState("") // 分析时间
  const [historyList, setHistoryList] = useState<any[]>([]) // 历史记录列表
  const [historyLoading, setHistoryLoading] = useState(false) // 历史记录加载状态
  const [currentPage, setCurrentPage] = useState(1) // 当前页码
  const [totalPages, setTotalPages] = useState(1) // 总页数
  const [totalRecords, setTotalRecords] = useState(0) // 总记录数
  const [globalStats, setGlobalStats] = useState<any>(null) // 全局统计数据

  // AI 配置确认对话框
  const [showConfigDialog, setShowConfigDialog] = useState(false) // 是否显示配置确认对话框
  const [currentConfig, setCurrentConfig] = useState<any>(null) // 当前配置数据
  const [configLoading, setConfigLoading] = useState(false) // 配置加载状态
  const [showConfigEdit, setShowConfigEdit] = useState(false) // 是否显示配置编辑表单
  const [tempConfig, setTempConfig] = useState({
    provider: "",
    api_key: "",
    api_base_url: "",
    model_summarize: "",
    model_insights: "",
  }) // 临时配置数据（用于快速配置）

  // 一键创作功能
  const [showModelDialog, setShowModelDialog] = useState(false) // 是否显示模型选择对话框
  const [selectedInsight, setSelectedInsight] = useState<any>(null) // 选中的洞察
  const [creatingContent, setCreatingContent] = useState(false) // 内容创作中状态

  // 获取当前配置并显示确认对话框
  const handleShowConfigDialog = async () => {
    if (!keyword.trim()) {
      setError("请输入关键词")
      return
    }

    setConfigLoading(true)
    try {
      const response = await fetch("/api/config/ai/current")
      const data = await response.json()

      if (response.ok && data.success) {
        setCurrentConfig(data.data)
        setShowConfigDialog(true)

        // 如果没有配置，初始化临时配置表单
        if (!data.data.has_config) {
          setShowConfigEdit(true)
          setTempConfig({
            provider: data.data.provider || "openai",
            api_key: "",
            api_base_url: data.data.api_base_url || "https://api.openai.com/v1",
            model_summarize: data.data.model_summarize || "gpt-4o-mini",
            model_insights: data.data.model_insights || "gpt-4o",
          })
        }
      } else {
        toast.error("获取配置失败", {
          description: data.error || "请稍后重试",
        })
      }
    } catch (error) {
      console.error("获取配置失败:", error)
      toast.error("获取配置失败", {
        description: "网络异常，请稍后重试",
      })
    } finally {
      setConfigLoading(false)
    }
  }

  
  // 处理一键创作
  const handleOneClickCreation = (insight: any) => {
    setSelectedInsight(insight)
    setShowModelDialog(true)
  }

  // 确认模型配置并开始创作
  const handleModelConfirm = async (config: any) => {
    if (!selectedInsight) return

    setCreatingContent(true)
    setShowModelDialog(false)

    try {
      // 调用内容创作API
      const response = await fetch("/api/content/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          insight: {
            title: selectedInsight.title,
            suggestedTitle: selectedInsight.suggestedTitle,
            direction: selectedInsight.direction,
            audience: selectedInsight.audience,
            angle: selectedInsight.angle,
          },
          config,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 将创作的内容传递到创建内容页面
        const contentData = {
          title: data.data.title,
          summary: data.data.summary,
          content: data.data.content,
          wordCount: data.data.wordCount,
          readingTime: data.data.readingTime,
          sourceInsight: {
            id: selectedInsight.id,
            title: selectedInsight.title,
            suggestedTitle: selectedInsight.suggestedTitle,
          },
          config,
        }

        // 将数据存储在 sessionStorage 中，页面跳转后读取
        sessionStorage.setItem("generatedContent", JSON.stringify(contentData))

        toast.success("内容创作完成", {
          description: "正在跳转到内容编辑页面...",
        })

        // 跳转到创建内容页面
        router.push("/content/create?generated=true")
      } else {
        toast.error("内容创作失败", {
          description: data.error || "请稍后重试",
        })
      }
    } catch (error) {
      console.error("内容创作失败:", error)
      toast.error("内容创作失败", {
        description: "网络异常，请稍后重试",
      })
    } finally {
      setCreatingContent(false)
      setSelectedInsight(null)
    }
  }

  // 执行实际的分析
  const handleStartAnalysis = async () => {
    // 如果使用临时配置，先保存并激活
    if (showConfigEdit && tempConfig.api_key) {
      try {
        const configName = `临时配置 - ${new Date().toLocaleString("zh-CN")}`

        const saveResponse = await fetch("/api/config/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            config_name: configName,
            provider: tempConfig.provider,
            api_key: tempConfig.api_key,
            api_base_url: tempConfig.api_base_url,
            model_summarize: tempConfig.model_summarize,
            model_insights: tempConfig.model_insights,
            is_active: true, // 立即激活
          }),
        })

        const saveData = await saveResponse.json()

        if (!saveResponse.ok || !saveData.success) {
          toast.error("保存临时配置失败", {
            description: saveData.error || "请稍后重试",
          })
          return
        }

        toast.success("临时配置已激活", {
          description: "将使用此配置进行分析",
        })
      } catch (error) {
        console.error("保存临时配置失败:", error)
        toast.error("保存临时配置失败", {
          description: "网络异常，请稍后重试",
        })
        return
      }
    }

    // 关闭对话框
    setShowConfigDialog(false)
    setShowConfigEdit(false)

    setIsAnalyzing(true)
    setShowResults(false)
    setProgress(0)
    setAnalysisStep(0)
    setError("")
    setArticles([])

    try {
      // 步骤0: 连接API
      setAnalysisStep(0)
      setProgress(10)

      let fetchedArticles: WechatArticle[] = []
      let useMockData = false

      try {
        // 尝试调用真实API
        const response = await fetch("/api/wechat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kw: keyword,
            period: parseInt(timeRange),
            page: 1,
          }),
        })

        const data = await response.json()

        if (response.ok && data.data) {
          fetchedArticles = data.data
          console.log("使用真实API数据")
        } else {
          // API 失败，使用 mock 数据
          useMockData = true
          console.warn("API调用失败，使用Mock数据:", data.error)
        }
      } catch (apiError) {
        // 网络错误或其他问题，使用 mock 数据
        useMockData = true
        console.warn("API请求异常，使用Mock数据:", apiError)
      }

      // 如果 API 失败，使用 mock 数据
      if (useMockData) {
        setError("API余额不足，当前使用演示数据展示功能")
        fetchedArticles = generateMockArticles(keyword)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      // 步骤1: 分析文章内容
      setAnalysisStep(1)
      setProgress(40)
      setArticles(fetchedArticles)
      await new Promise(resolve => setTimeout(resolve, 600))

      // 生成点赞 TOP 5（按点赞数降序）
      const sortedByPraise = [...fetchedArticles]
        .sort((a, b) => b.praise - a.praise)
        .slice(0, 5)
        .map(article => ({
          title: article.title,
          likes: article.praise,
          interaction: ((article.praise / (article.read || 1)) * 100).toFixed(1) + "%",
          url: article.url || article.short_link
        }))

      // 生成互动率 TOP 5（按互动率降序）
      const sortedByInteraction = [...fetchedArticles]
        .map(article => ({
          title: article.title,
          likes: article.praise,
          interaction: ((article.praise / (article.read || 1)) * 100).toFixed(1) + "%",
          interactionValue: (article.praise / (article.read || 1)) * 100,
          url: article.url || article.short_link
        }))
        .sort((a, b) => b.interactionValue - a.interactionValue)
        .slice(0, 5)

      setTopArticles(sortedByPraise)
      setTopInteractionArticles(sortedByInteraction)

      // 步骤2: 生成词云
      setAnalysisStep(2)
      setProgress(70)
      const words = generateWordCloud(fetchedArticles)
      setWordCloud(words)
      await new Promise(resolve => setTimeout(resolve, 600))

      // 步骤3: AI 生成洞察报告
      setAnalysisStep(3)
      setProgress(75)

      let generatedInsights: any[] = []

      try {
        // 准备TOP 5文章的完整信息（按点赞数排序）
        const top5Articles = [...fetchedArticles]
          .sort((a, b) => b.praise - a.praise)
          .slice(0, 5)

        // 调用 AI 分析 API
        const aiResponse = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keyword,
            articles: top5Articles.map(article => ({
              title: article.title,
              content: article.content || "",
              praise: article.praise,
              read: article.read || 0,
              wx_name: article.wx_name || "",
              url: article.url || article.short_link || "",
              publish_time: article.publish_time ? article.publish_time.toString() : "",
            })),
            wordCloud: words,
          }),
        })

        const aiData = await aiResponse.json()

        if (aiResponse.ok && aiData.success && aiData.insights) {
          generatedInsights = aiData.insights
          setInsights(generatedInsights)
          console.log("AI 洞察生成成功:", generatedInsights.length, "条")
          setProgress(90)
        } else {
          throw new Error(aiData.error || "AI 分析失败")
        }
      } catch (aiError) {
        console.error("AI 分析失败:", aiError)
        toast.error("AI 分析失败，请重试", {
          description: aiError instanceof Error ? aiError.message : "未知错误",
        })
        setIsAnalyzing(false)
        setProgress(0)
        return // 终止流程
      }

      // 完成分析，保存到数据库
      setProgress(95)
      await new Promise(resolve => setTimeout(resolve, 300))

      // 保存分析结果到数据库
      try {
        const saveResponse = await fetch("/api/analysis/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keyword,
            timeRange: parseInt(timeRange),
            articleCount: parseInt(articleCount),
            articles: fetchedArticles.map(article => ({
              title: article.title,
              content: article.content,
              praise: article.praise,
              read: article.read,
              wx_name: article.wx_name,
              url: article.url,
              short_link: article.short_link,
              publish_time: article.publish_time,
            })),
            wordCloud: words,
            insights: generatedInsights.map(insight => ({
              type: insight.type,
              title: insight.title,
              suggested_title: insight.suggestedTitle,
              direction: insight.direction,
              audience: insight.audience,
              angle: insight.angle,
              reasoning: insight.reasoning,
              source_article_title: insight.sourceArticle?.title || "",
              source_article_url: insight.sourceArticle?.url || "",
              source_article_publish_time: insight.sourceArticle?.publishTime || "",
              source_article_wx_name: insight.sourceArticle?.wx_name || "",
              created_at: insight.createdAt || new Date().toISOString(),
            })),
          }),
        })

        const saveData = await saveResponse.json()

        if (saveResponse.ok && saveData.success) {
          setBatchId(saveData.batchId)
          setAnalysisTime(new Date().toLocaleString("zh-CN"))
          toast.success("分析结果已保存", {
            description: `批次ID: ${saveData.batchId}`,
          })
          // 刷新历史记录
          fetchHistory()
        } else {
          console.error("保存失败:", saveData.error)
          toast.error("保存失败", {
            description: saveData.error || "请稍后重试",
          })
        }
      } catch (saveError) {
        console.error("保存异常:", saveError)
        toast.error("保存失败", {
          description: "网络异常，请稍后重试",
        })
      }

      setIsAnalyzing(false)
      setShowResults(true)

    } catch (err) {
      console.error("Analysis error:", err)
      setError(err instanceof Error ? err.message : "分析失败，请稍后重试")
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  // 获取历史记录
  const fetchHistory = async (page = 1) => {
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/analysis/list?page=${page}&limit=10`)
      const data = await response.json()

      if (response.ok && data.success) {
        // 转换数据格式以匹配UI显示
        const formattedHistory = data.data.list.map((batch: any) => ({
          id: batch.id,
          batch_id: batch.batch_id,
          date: new Date(batch.created_at).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          }),
          keyword: batch.keyword,
          count: batch.total_articles,
        }))
        setHistoryList(formattedHistory)
        setCurrentPage(data.data.page)
        setTotalPages(data.data.totalPages)
        setTotalRecords(data.data.total)
      } else {
        console.error("获取历史记录失败:", data.error)
      }
    } catch (error) {
      console.error("获取历史记录异常:", error)
    } finally {
      setHistoryLoading(false)
    }
  }

  // 删除批次
  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("确定要删除这条分析记录吗？")) {
      return
    }

    try {
      const response = await fetch(`/api/analysis/${batchId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("删除成功")
        // 重新获取历史记录
        fetchHistory()
      } else {
        toast.error("删除失败", {
          description: data.error || "请稍后重试",
        })
      }
    } catch (error) {
      console.error("删除批次异常:", error)
      toast.error("删除失败", {
        description: "网络异常，请稍后重试",
      })
    }
  }

  // 查看批次详情 - 跳转到详情页
  const handleViewBatch = (batchId: string) => {
    router.push(`/analysis/${batchId}`)
  }

  // 导出批次数据为Excel
  const handleExportBatch = async (batchId: string, keyword: string) => {
    try {
      const response = await fetch(`/api/analysis/${batchId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        const batch = data.data
        exportBatchToExcel({
          keyword: batch.keyword,
          analysisTime: new Date(batch.created_at).toLocaleString("zh-CN"),
          timeRange: `最近${batch.time_range}天`,
          totalArticles: batch.total_articles,
          articles: batch.articles.map((article: any) => ({
            title: article.title,
            wx_name: article.wx_name || "未知",
            praise: article.praise,
            read_count: article.read_count,
            interaction_rate: article.interaction_rate,
            publish_time: article.publish_time,
            url: article.url || article.short_link || "",
          })),
        })
        toast.success("导出成功")
      } else {
        toast.error("导出失败", {
          description: data.error || "请稍后重试",
        })
      }
    } catch (error) {
      console.error("导出批次异常:", error)
      toast.error("导出失败", {
        description: "网络异常，请稍后重试",
      })
    }
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    fetchHistory(page)
    // 滚动到历史报告区域
    document.getElementById("history-section")?.scrollIntoView({ behavior: "smooth" })
  }

  // 获取全局统计数据
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats")
      const data = await response.json()

      if (response.ok && data.success) {
        setGlobalStats(data.data)
      } else {
        console.error("获取统计数据失败:", data.error)
      }
    } catch (error) {
      console.error("获取统计数据异常:", error)
    }
  }

  // 加载最新一次分析结果
  const loadLatestAnalysis = async () => {
    try {
      const response = await fetch("/api/analysis/list?page=1&limit=1")
      const data = await response.json()

      if (response.ok && data.success && data.data.list.length > 0) {
        const latestBatch = data.data.list[0]

        // 获取完整的批次详情（包括洞察数据）
        const detailResponse = await fetch(`/api/analysis/${latestBatch.batch_id}`)
        const detailData = await detailResponse.json()

        if (detailResponse.ok && detailData.success) {
          const batch = detailData.data

          // 恢复所有分析数据到state
          setKeyword(batch.keyword)
          setTimeRange(batch.time_range.toString())
          setBatchId(batch.batch_id)
          setAnalysisTime(new Date(batch.created_at).toLocaleString("zh-CN"))

          // 设置文章数据
          const articlesData = batch.articles.map((article: any) => ({
            title: article.title,
            content: article.content || "",
            praise: article.praise,
            read: article.read_count,
            wx_name: article.wx_name || "",
            url: article.url || article.short_link || "",
            short_link: article.short_link || "",
          }))
          setArticles(articlesData)

          // 设置点赞 TOP 5
          const sortedByPraise = articlesData
            .sort((a: any, b: any) => b.praise - a.praise)
            .slice(0, 5)
            .map((article: any) => ({
              title: article.title,
              likes: article.praise,
              interaction: ((article.praise / (article.read || 1)) * 100).toFixed(1) + "%",
              url: article.url
            }))
          setTopArticles(sortedByPraise)

          // 设置互动率 TOP 5
          const sortedByInteraction = articlesData
            .map((article: any) => ({
              title: article.title,
              likes: article.praise,
              interaction: ((article.praise / (article.read || 1)) * 100).toFixed(1) + "%",
              interactionValue: (article.praise / (article.read || 1)) * 100,
              url: article.url
            }))
            .sort((a: any, b: any) => b.interactionValue - a.interactionValue)
            .slice(0, 5)
          setTopInteractionArticles(sortedByInteraction)

          // 设置词云数据
          if (batch.wordCloud && batch.wordCloud.length > 0) {
            setWordCloud(batch.wordCloud)
          }

          // 设置洞察数据
          if (batch.insights && batch.insights.length > 0) {
            const insightsData = batch.insights.map((insight: any) => ({
              type: insight.type,
              title: insight.title,
              suggestedTitle: insight.suggested_title,
              direction: insight.direction,
              audience: insight.audience,
              angle: insight.angle,
              reasoning: insight.reasoning,
              sourceArticle: insight.source_article_title ? {
                title: insight.source_article_title,
                url: insight.source_article_url || "",
                publishTime: insight.source_article_publish_time || "",
                wx_name: insight.source_article_wx_name || "",
              } : undefined,
              createdAt: insight.created_at,
            }))
            setInsights(insightsData)
          }

          // 显示结果区域
          setShowResults(true)

          console.log("✅ 已自动加载最新分析结果:", batch.batch_id)
        }
      } else {
        console.log("ℹ️ 暂无历史分析记录")
      }
    } catch (error) {
      console.error("加载最新分析失败:", error)
    }
  }

  // 组件加载时获取历史记录、统计数据和最新分析结果
  useEffect(() => {
    fetchHistory()
    fetchStats()
    loadLatestAnalysis() // 自动加载最新的分析结果
  }, [])

  // 生成 Mock 数据用于演示
  const generateMockArticles = (kw: string): WechatArticle[] => {
    const templates = [
      { title: `${kw}深度解析：行业发展趋势与未来展望`, praise: 1250, read: 8920 },
      { title: `如何利用${kw}提升工作效率？10个实用技巧分享`, praise: 980, read: 6540 },
      { title: `${kw}从入门到精通：完整学习路线图`, praise: 856, read: 7230 },
      { title: `${kw}最新动态：本周热点事件盘点`, praise: 723, read: 5890 },
      { title: `${kw}实战案例：企业成功应用经验分享`, praise: 691, read: 4560 },
      { title: `关于${kw}，你需要知道的10件事`, praise: 645, read: 5120 },
      { title: `${kw}行业报告：2024年市场分析与预测`, praise: 589, read: 4890 },
      { title: `${kw}工具推荐：提升效率的必备神器`, praise: 534, read: 3980 },
      { title: `${kw}常见问题解答：新手必看指南`, praise: 478, read: 3560 },
      { title: `${kw}趋势观察：5个不容忽视的变化`, praise: 423, read: 3120 },
      { title: `${kw}最佳实践：行业专家经验总结`, praise: 389, read: 2890 },
      { title: `${kw}案例分析：成功与失败的启示`, praise: 356, read: 2560 },
      { title: `${kw}学习资源汇总：从基础到进阶`, praise: 312, read: 2340 },
      { title: `${kw}未来发展：5年后会是什么样？`, praise: 289, read: 2120 },
      { title: `${kw}实用技巧：提升效率的20个小方法`, praise: 256, read: 1980 },
      { title: `${kw}深度思考：行业本质与核心逻辑`, praise: 234, read: 1760 },
      { title: `${kw}工作流优化：让你事半功倍`, praise: 212, read: 1540 },
      { title: `${kw}最新技术：前沿动态跟踪`, praise: 198, read: 1420 },
      { title: `${kw}经验分享：从业3年的心得体会`, praise: 176, read: 1290 },
      { title: `${kw}入门指南：零基础快速上手`, praise: 154, read: 1120 },
    ]

    return templates.map((item, index) => ({
      title: item.title,
      content: `这是关于${kw}的文章内容...`,
      praise: item.praise,
      read: item.read,
      looking: Math.floor(item.praise * 0.8),
      wx_name: ["科技观察", "行业洞察", "内容创作者", "知识分享", "专业解读"][index % 5],
      wx_id: `wx_${index}`,
      publish_time: Date.now() - index * 86400000,
      publish_time_str: `${index + 1}天前`,
      update_time: Date.now() - index * 86400000,
      update_time_str: `${index + 1}天前`,
      avatar: "",
      classify: "科技",
      ghid: `gh_${index}`,
      ip_wording: "北京",
      is_original: index % 3 === 0 ? 1 : 0,
      short_link: `https://mp.weixin.qq.com/s/${index}`,
      url: `https://mp.weixin.qq.com/s/${index}`,
    }))
  }

  // 词频统计（带数据清洗）
  const generateWordCloud = (articles: WechatArticle[]) => {
    const wordMap: Record<string, number> = {}

    // 停用词列表
    const stopWords = ["的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一", "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好", "自己", "这", "个", "为", "但", "与", "或", "等", "及", "以", "对", "于", "从", "用", "被", "把", "让", "给", "向", "往", "来", "去", "过", "还", "再", "更", "最", "非", "而", "且", "因", "所", "其", "之"]

    // 标点符号和特殊字符正则
    const punctuationRegex = /[。，、；：？！""''（）【】《》…—·\s\n\r\t\d]+/g

    articles.forEach(article => {
      // 清洗标题：移除所有标点符号、空格、数字
      const cleanTitle = article.title.replace(punctuationRegex, '')

      // 简单分词（按2-4字符分割）
      for (let i = 0; i < cleanTitle.length; i++) {
        // 提取2字词
        if (i + 2 <= cleanTitle.length) {
          const word2 = cleanTitle.substring(i, i + 2)
          if (!stopWords.includes(word2) && !/^\d+$/.test(word2)) {
            wordMap[word2] = (wordMap[word2] || 0) + 1
          }
        }

        // 提取3字词
        if (i + 3 <= cleanTitle.length) {
          const word3 = cleanTitle.substring(i, i + 3)
          if (!stopWords.includes(word3) && !/^\d+$/.test(word3)) {
            wordMap[word3] = (wordMap[word3] || 0) + 1
          }
        }

        // 提取4字词
        if (i + 4 <= cleanTitle.length) {
          const word4 = cleanTitle.substring(i, i + 4)
          if (!stopWords.includes(word4) && !/^\d+$/.test(word4)) {
            wordMap[word4] = (wordMap[word4] || 0) + 1
          }
        }
      }
    })

    return Object.entries(wordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Title & Actions */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                  选题分析
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed">
                  基于数据洞察，发现热门选题方向
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleShowConfigDialog}
                  disabled={isAnalyzing || configLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm px-6 h-11"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {configLoading ? "加载配置..." : isAnalyzing ? "分析中..." : "开始分析"}
                </Button>
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 h-11">
                  使用历史配置
                </Button>
              </div>
            </div>

            {/* Right: Quick Stats Card */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {globalStats ? globalStats.global.totalKeywords : "-"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">热门关键词</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {globalStats ? globalStats.global.totalArticles : "-"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">分析文章</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">5</div>
                    <div className="text-xs text-slate-500 mt-1">选题推荐</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-8">

          {/* Search Configuration Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">搜索配置</h2>
              <p className="text-sm text-slate-500 mt-1">设置关键词和筛选条件</p>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="pt-6 space-y-6">
                {/* Keyword Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">关键词</label>
                  <div className="relative">
                    <Input
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="输入关键词搜索..."
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

                  {/* Error Display */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200">
                      <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                      <span className="text-sm text-rose-700">{error}</span>
                    </div>
                  )}

                  {/* Favorite Keywords */}
                  <div className="flex items-center gap-3 flex-wrap pt-2">
                    <span className="text-xs font-medium text-slate-500">收藏:</span>
                    {favoriteKeywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="cursor-pointer hover:bg-slate-200 bg-slate-100 text-slate-700 border-0 rounded-full px-3 py-1"
                      >
                        <Star className="h-3 w-3 mr-1 fill-slate-400 text-slate-400" />
                        {keyword}
                      </Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600 hover:text-slate-900">
                      管理收藏
                    </Button>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Search Logic & Parameters */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Search Logic */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">搜索逻辑</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="logic"
                          value="and"
                          checked={searchLogic === "and"}
                          onChange={(e) => setSearchLogic(e.target.value)}
                          className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                        />
                        <span className="text-sm text-slate-700">AND（都包含）</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="logic"
                          value="or"
                          checked={searchLogic === "or"}
                          onChange={(e) => setSearchLogic(e.target.value)}
                          className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                        />
                        <span className="text-sm text-slate-700">OR（包含任一）</span>
                      </label>
                    </div>
                  </div>

                  {/* Time Range */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">时间范围</label>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">最近1天</SelectItem>
                        <SelectItem value="3">最近3天</SelectItem>
                        <SelectItem value="7">最近7天</SelectItem>
                        <SelectItem value="15">最近15天</SelectItem>
                        <SelectItem value="30">最近30天</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Article Count */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">文章数量</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          value={articleCount}
                          onChange={(e) => {
                            const val = e.target.value
                            const num = parseInt(val)
                            if (val === "" || (num >= 1 && num <= 30)) {
                              setArticleCount(val)
                            }
                          }}
                          min="1"
                          max="30"
                          className={`h-11 border-slate-300 focus:border-rose-500 focus:ring-rose-500 ${
                            articleCount && (parseInt(articleCount) < 1 || parseInt(articleCount) > 30)
                              ? "border-red-300 focus:border-red-500"
                              : ""
                          }`}
                          placeholder="请输入1-30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">篇</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">快捷:</span>
                      {["10", "20", "30"].map((num) => (
                        <Button
                          key={num}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setArticleCount(num)}
                          className={`h-7 px-3 border-slate-300 text-slate-700 hover:bg-slate-50 ${
                            articleCount === num ? "bg-rose-50 border-rose-300 text-rose-700" : ""
                          }`}
                        >
                          {num}
                        </Button>
                      ))}
                      <span className="text-xs text-slate-400 ml-auto">最多支持30篇</span>
                    </div>
                    {articleCount && (parseInt(articleCount) < 1 || parseInt(articleCount) > 30) && (
                      <p className="text-xs text-red-600">请输入1-30之间的整数</p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Filters */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-slate-700">筛选条件</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox id="read-filter" className="border-slate-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600" />
                      <label htmlFor="read-filter" className="text-sm text-slate-700 cursor-pointer">
                        阅读量 ≥
                      </label>
                      <Input
                        type="number"
                        placeholder="1000"
                        className="w-28 h-9 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="like-filter" className="border-slate-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600" />
                      <label htmlFor="like-filter" className="text-sm text-slate-700 cursor-pointer">
                        点赞数 ≥
                      </label>
                      <Input
                        type="number"
                        placeholder="100"
                        className="w-28 h-9 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="account-filter" className="border-slate-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600" />
                      <label htmlFor="account-filter" className="text-sm text-slate-700 cursor-pointer">
                        指定公众号:
                      </label>
                      <Input
                        placeholder="例如：刘润"
                        className="flex-1 h-9 border-slate-300 focus:border-rose-500 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加文章链接
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI Configuration Confirmation Dialog */}
          {showConfigDialog && currentConfig && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-rose-600" />
                    AI 配置确认
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 mt-2">
                    请确认以下配置信息，确保 AI 分析正常运行
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* 配置来源提示 */}
                  <div className={`p-4 rounded-lg border ${
                    currentConfig.source === "database"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-amber-50 border-amber-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        currentConfig.source === "database" ? "bg-emerald-600" : "bg-amber-600"
                      }`} />
                      <span className="text-sm font-medium text-slate-900">
                        {currentConfig.source === "database" ? "使用数据库配置" : "使用环境变量配置"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 ml-4">
                      {currentConfig.source === "database"
                        ? "当前使用保存在数据库中的配置"
                        : "未找到数据库配置，使用环境变量中的默认配置"}
                    </p>
                  </div>

                  {/* 无配置警告 */}
                  {!currentConfig.has_config && (
                    <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-rose-900">未配置 API Key</p>
                          <p className="text-xs text-rose-700 mt-1">
                            请先配置 API Key 才能使用 AI 分析功能
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 配置详情 - 只在不编辑且有配置时显示 */}
                  {!showConfigEdit && currentConfig.has_config && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-slate-500">配置名称</Label>
                          <p className="text-sm font-medium text-slate-900 mt-1">{currentConfig.config_name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500">服务商</Label>
                          <p className="text-sm font-medium text-slate-900 mt-1 capitalize">{currentConfig.provider}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-slate-500">API 地址</Label>
                        <p className="text-sm font-mono text-slate-700 mt-1 break-all">{currentConfig.api_base_url}</p>
                      </div>

                      <div>
                        <Label className="text-xs text-slate-500">API Key</Label>
                        <p className="text-sm font-mono text-slate-700 mt-1">{currentConfig.api_key}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-slate-500">摘要模型</Label>
                          <p className="text-sm font-medium text-slate-900 mt-1">{currentConfig.model_summarize}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500">洞察模型</Label>
                          <p className="text-sm font-medium text-slate-900 mt-1">{currentConfig.model_insights}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <Label className="text-xs text-slate-500 block mb-2">预计 Token 消耗</Label>
                        <div className="space-y-1 text-xs text-slate-600">
                          <p>• {currentConfig.estimated_tokens.summarize}</p>
                          <p>• {currentConfig.estimated_tokens.insights}</p>
                          <p className="font-medium text-slate-900 mt-2">{currentConfig.estimated_tokens.total}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 快速配置表单 */}
                  {showConfigEdit && (
                    <div className="space-y-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-900">快速配置</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConfigEdit(false)}
                          className="h-8 text-xs"
                        >
                          取消编辑
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm">服务商</Label>
                          <Select
                            value={tempConfig.provider}
                            onValueChange={(value) => setTempConfig({ ...tempConfig, provider: value })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="openrouter">OpenRouter</SelectItem>
                              <SelectItem value="siliconflow">SiliconFlow</SelectItem>
                              <SelectItem value="zhipu">智谱 AI</SelectItem>
                              <SelectItem value="qwen">通义千问</SelectItem>
                              <SelectItem value="deepseek">DeepSeek</SelectItem>
                              <SelectItem value="custom">自定义</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm">API Key</Label>
                          <Input
                            type="password"
                            value={tempConfig.api_key}
                            onChange={(e) => setTempConfig({ ...tempConfig, api_key: e.target.value })}
                            placeholder="请输入 API Key"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm">API 地址</Label>
                          <Input
                            value={tempConfig.api_base_url}
                            onChange={(e) => setTempConfig({ ...tempConfig, api_base_url: e.target.value })}
                            placeholder="https://api.openai.com/v1"
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">摘要模型</Label>
                            <Input
                              value={tempConfig.model_summarize}
                              onChange={(e) => setTempConfig({ ...tempConfig, model_summarize: e.target.value })}
                              placeholder="gpt-4o-mini"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">洞察模型</Label>
                            <Input
                              value={tempConfig.model_insights}
                              onChange={(e) => setTempConfig({ ...tempConfig, model_insights: e.target.value })}
                              placeholder="gpt-4o"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <p className="text-xs text-amber-800">
                            注意：此配置仅用于本次分析，不会保存到数据库
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
                    {currentConfig.has_config && !showConfigEdit && (
                      <>
                        <Button
                          onClick={handleStartAnalysis}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white h-11"
                        >
                          确认并开始分析
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => router.push("/settings/ai-config")}
                            className="flex-1 border-slate-300"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            前往配置页
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowConfigEdit(true)}
                            className="flex-1 border-slate-300"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            临时修改
                          </Button>
                        </div>
                      </>
                    )}

                    {showConfigEdit && (
                      <>
                        <Button
                          onClick={handleStartAnalysis}
                          disabled={!tempConfig.api_key}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white h-11 disabled:bg-slate-400"
                        >
                          使用临时配置并开始
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/settings/ai-config")}
                          className="w-full border-slate-300"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          前往完整配置页
                        </Button>
                      </>
                    )}

                    {!currentConfig.has_config && !showConfigEdit && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push("/settings/ai-config")}
                          className="flex-1 border-slate-300"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          前往配置页
                        </Button>
                        <Button
                          onClick={() => setShowConfigEdit(true)}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          快速配置
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowConfigDialog(false)
                        setShowConfigEdit(false)
                      }}
                      className="w-full text-slate-600"
                    >
                      取消
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analysis Progress Modal */}
          {isAnalyzing && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <Card className="bg-white shadow-2xl rounded-2xl w-full max-w-md mx-4">
                <CardContent className="pt-8 pb-6 px-8 space-y-6">
                  {/* Progress Header */}
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent">
                      {progress}%
                    </div>
                    <p className="text-sm text-slate-600">正在分析文章数据...</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={progress} className="h-3 bg-slate-100" />
                  </div>

                  {/* Analysis Steps */}
                  <div className="space-y-3">
                    {[
                      { step: 0, label: "连接 API 获取数据", icon: "🔄" },
                      { step: 1, label: `分析文章内容 (${articles.length}/${articleCount})`, icon: "📊" },
                      { step: 2, label: "生成词云数据", icon: "☁️" },
                      { step: 3, label: "生成洞察报告", icon: "💡" },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          analysisStep > item.step
                            ? "bg-emerald-50 border border-emerald-200"
                            : analysisStep === item.step
                            ? "bg-rose-50 border border-rose-200"
                            : "bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                            analysisStep > item.step
                              ? "bg-emerald-600 text-white"
                              : analysisStep === item.step
                              ? "bg-rose-600 text-white animate-pulse"
                              : "bg-slate-300 text-slate-600"
                          }`}
                        >
                          {analysisStep > item.step ? "✓" : item.icon}
                        </div>
                        <span
                          className={`text-sm ${
                            analysisStep >= item.step ? "text-slate-900 font-medium" : "text-slate-500"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Insight Report */}
          {showResults && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">洞察报告</h2>
                  {batchId ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">批次ID:</span> {batchId}
                      </p>
                      <p className="text-xs text-slate-500">
                        {analysisTime} | 关键词: {keyword} | 文章数量: {articles.length}篇
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 mt-1">基于{articles.length || 20}篇文章的数据分析</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Download className="h-4 w-4 mr-2" />
                    导出
                  </Button>
                </div>
              </div>

              <div className="space-y-8">
                {/* Top Articles Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Likes TOP 5 */}
                  <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <span className="text-lg">👍</span>
                        点赞TOP 5
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(topArticles.length > 0 ? topArticles : mockTopArticles).map((article, index) => (
                        <a
                          key={index}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <span className="font-semibold text-slate-400 group-hover:text-rose-600 transition-colors text-sm w-5">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed group-hover:text-rose-600 transition-colors">
                              {article.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1.5">
                              {article.likes.toLocaleString()} 赞
                            </p>
                          </div>
                        </a>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Interaction TOP 5 */}
                  <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <span className="text-lg">💬</span>
                        互动率TOP 5
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(topInteractionArticles.length > 0 ? topInteractionArticles : mockTopArticles).map((article, index) => (
                        <a
                          key={index}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <span className="font-semibold text-slate-400 group-hover:text-rose-600 transition-colors text-sm w-5">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed group-hover:text-rose-600 transition-colors">
                              {article.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1.5">
                              互动率 {article.interaction}
                            </p>
                          </div>
                        </a>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Word Cloud */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <span className="text-lg">☁️</span>
                      高频词云 TOP10
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 p-6 rounded-lg bg-slate-50/50">
                      {(wordCloud.length > 0 ? wordCloud : mockWordCloud).map((item, index) => {
                        // 根据排名确定样式
                        let sizeClass, colorClass, fontWeight
                        if (index < 3) {
                          // TOP 1-3: 大字号 + 深玫瑰红
                          sizeClass = "text-2xl"
                          colorClass = "text-rose-700"
                          fontWeight = "font-bold"
                        } else if (index < 6) {
                          // TOP 4-6: 中等字号 + 中等玫瑰色
                          sizeClass = "text-xl"
                          colorClass = "text-rose-500"
                          fontWeight = "font-semibold"
                        } else {
                          // TOP 7-10: 较小字号 + 灰色
                          sizeClass = "text-lg"
                          colorClass = "text-slate-600"
                          fontWeight = "font-medium"
                        }

                        return (
                          <div
                            key={index}
                            className={`inline-flex items-baseline gap-1.5 px-4 py-2 rounded-full bg-white border ${
                              index < 3 ? 'border-rose-200 shadow-sm' : 'border-slate-200'
                            } hover:border-rose-300 hover:shadow transition-all cursor-default`}
                          >
                            <span className={`${sizeClass} ${colorClass} ${fontWeight}`}>{item.word}</span>
                            <span className="text-xs text-slate-400 font-normal">
                              {item.count}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Topic Insights */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <span className="text-xl">💡</span>
                      选题洞察推荐
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">基于分析数据生成的选题建议</p>
                  </div>

                  <div className="space-y-4">
                    {insights.length > 0 ? insights.map((insight, index) => (
                      <Card key={index} className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              {/* 原文信息 */}
                              {insight.sourceArticle && insight.sourceArticle.title && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-blue-700">参考原文</span>
                                        {insight.sourceArticle.wx_name && (
                                          <span className="text-xs text-blue-600">· {insight.sourceArticle.wx_name}</span>
                                        )}
                                      </div>
                                      <a
                                        href={insight.sourceArticle.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-900 hover:text-blue-700 hover:underline line-clamp-2 transition-colors"
                                      >
                                        {insight.sourceArticle.title}
                                      </a>
                                      {insight.sourceArticle.publishTime && (
                                        <div className="text-xs text-blue-600 mt-1">
                                          发布时间: {new Date(parseInt(insight.sourceArticle.publishTime) * 1000).toLocaleString("zh-CN")}
                                        </div>
                                      )}
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-blue-600 flex-shrink-0 mt-1" />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="border-rose-200 text-rose-700 bg-rose-50 rounded-full px-3 py-0.5"
                                >
                                  {insight.type}
                                </Badge>
                                <h4 className="text-base font-semibold text-slate-900">
                                  {insight.title}
                                </h4>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex gap-2">
                                  <span className="font-medium text-slate-600 min-w-[70px]">建议标题:</span>
                                  <span className="text-slate-700">{insight.suggestedTitle}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="font-medium text-slate-600 min-w-[70px]">内容方向:</span>
                                  <span className="text-slate-700">{insight.direction}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="font-medium text-slate-600 min-w-[70px]">目标受众:</span>
                                  <span className="text-slate-700">{insight.audience}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="font-medium text-slate-600 min-w-[70px]">写作角度:</span>
                                  <span className="text-slate-700">{insight.angle}</span>
                                </div>
                                {insight.reasoning && (
                                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                    <span className="font-medium text-slate-600 text-xs block mb-1">💡 推理依据:</span>
                                    <span className="text-xs text-slate-600 leading-relaxed">{insight.reasoning}</span>
                                  </div>
                                )}

                                {/* AI 分析时间 */}
                                {insight.createdAt && (
                                  <div className="flex items-center gap-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    <span>AI 分析时间:</span>
                                    <span>{new Date(insight.createdAt).toLocaleString("zh-CN")}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button
                            onClick={() => handleOneClickCreation(insight)}
                            disabled={creatingContent}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                          >
                            {creatingContent ? (
                              <>
                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                创作中...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                一键创作
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )) : (
                      <div className="text-center py-8 text-slate-500">
                        <p>AI 正在分析中，请稍候...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* History Reports */}
          <section id="history-section">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">历史报告</h2>
              <p className="text-sm text-slate-500 mt-1">最近10条分析记录</p>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="pt-6">
                {historyLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-sm text-slate-500">加载中...</div>
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <FileText className="h-12 w-12 mb-3" />
                    <p className="text-sm">暂无分析记录</p>
                    <p className="text-xs mt-1">开始您的第一次选题分析吧</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historyList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-6">
                          <span className="text-sm text-slate-500 font-mono">
                            {item.date}
                          </span>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-0 rounded-full px-3">
                            {item.keyword}
                          </Badge>
                          <span className="text-sm text-slate-600">
                            分析{item.count}篇
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            onClick={() => handleViewBatch(item.batch_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            onClick={() => handleExportBatch(item.batch_id, item.keyword)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            导出
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDeleteBatch(item.batch_id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalRecords > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex flex-col gap-4">
                      {/* 分页信息 */}
                      <div className="text-center text-sm text-slate-600">
                        共 {totalRecords} 条记录，每页 10 条，共 {totalPages} 页
                      </div>

                      {/* 分页按钮 */}
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          上一页
                        </Button>

                        {/* 页码按钮 */}
                        <div className="flex gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              // 显示逻辑：当前页附近的页码 + 首页 + 尾页
                              if (page === 1 || page === totalPages) return true
                              if (Math.abs(page - currentPage) <= 1) return true
                              return false
                            })
                            .map((page, index, array) => {
                              // 添加省略号
                              const prevPage = array[index - 1]
                              const showEllipsis = prevPage && page - prevPage > 1

                              return (
                                <div key={page} className="flex items-center gap-1">
                                  {showEllipsis && (
                                    <span className="px-2 text-slate-400">...</span>
                                  )}
                                  <Button
                                    variant={page === currentPage ? "default" : "outline"}
                                    size="sm"
                                    className={
                                      page === currentPage
                                        ? "bg-rose-600 hover:bg-rose-700 text-white border-0"
                                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                                    }
                                    onClick={() => handlePageChange(page)}
                                  >
                                    {page}
                                  </Button>
                                </div>
                              )
                            })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          下一页
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>

                      {/* 当前页信息 */}
                      <div className="text-center text-sm text-slate-500">
                        当前第 {currentPage} 页，显示第 {(currentPage - 1) * 10 + 1}-
                        {Math.min(currentPage * 10, totalRecords)} 条
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 模型选择对话框 */}
          <ModelSelectionDialog
            isOpen={showModelDialog}
            onClose={() => {
              setShowModelDialog(false)
              setSelectedInsight(null)
            }}
            onConfirm={handleModelConfirm}
            loading={creatingContent}
            insight={selectedInsight ? {
              title: selectedInsight.title,
              suggestedTitle: selectedInsight.suggestedTitle,
              direction: selectedInsight.direction,
              audience: selectedInsight.audience,
              angle: selectedInsight.angle,
            } : undefined}
          />
        </div>
      </div>
    </div>
  )
}