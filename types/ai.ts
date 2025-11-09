/**
 * AI 分析相关的类型定义
 */

// 文章摘要结构
export interface ArticleSummary {
  title: string              // 文章标题
  summary: string            // 文章摘要
  keyInfo: string[]          // 关键信息点（3-5条）
  keywords: string[]         // 关键词（5-8个）
  highlights: string[]       // 亮点（2-3条）
  originalData: {            // 原始数据
    praise: number
    read: number
    interaction: string
    wx_name: string
  }
}

// 选题洞察结构
export interface TopicInsight {
  type: string              // 洞察类型: "热点型" | "干货型" | "情感型" | "案例型" | "趋势型"
  title: string             // 洞察标题
  suggestedTitle: string    // 建议的文章标题
  direction: string         // 创作方向建议
  audience: string          // 目标受众
  angle: string             // 切入角度
  reasoning: string         // AI 推理依据（为什么提出这个洞察）
  sourceArticle?: {         // 关联的原文信息（可选）
    title: string           // 原文标题
    url: string             // 原文链接
    publishTime: string     // 原文发布时间
    wx_name: string         // 公众号名称
  }
  createdAt?: string        // AI 分析时间
}

// AI 分析请求参数
export interface AIAnalyzeRequest {
  articles: Array<{
    title: string
    content: string
    praise: number
    read: number
    wx_name: string
    url?: string              // 原文链接
    publish_time?: string     // 发布时间
  }>
  wordCloud: Array<{
    word: string
    count: number
  }>
  keyword: string           // 用户搜索的关键词
}

// AI 分析响应
export interface AIAnalyzeResponse {
  success: boolean
  summaries?: ArticleSummary[]
  insights?: TopicInsight[]
  error?: string
}
