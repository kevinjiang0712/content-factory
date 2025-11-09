/**
 * Supabase 数据库适配器
 * 实现与 SQLite 版本相同的接口，用于无缝切换
 */

import { supabase, handleSupabaseError } from './supabase'
import type {
  AnalysisBatch,
  Article,
  WordCloudItem,
  TopicInsight,
  AIConfig,
  GeneratedContent,
  GeneratedImage,
  PublishPlatform,
  PublishRecord
} from './supabase'

// ==================== 辅助类型 ====================

export interface SaveAnalysisData {
  batchId: string
  keyword: string
  timeRange: number
  articleCount: number
  totalArticles: number
  articles: any[]
  wordCloud: any[]
  insights: any[]
}

export interface BatchListItem {
  batch_id: string
  keyword: string
  time_range: number
  article_count: number
  total_articles: number
  created_at: number
}

export interface BatchDetail {
  batch_id: string
  keyword: string
  time_range: number
  article_count: number
  total_articles: number
  created_at: number
  articles: Article[]
  wordCloud: WordCloudItem[]
  insights?: TopicInsight[]
}

export interface GlobalStats {
  totalBatches: number
  totalArticles: number
  totalViews: number
  totalLikes: number
}

export interface DailyStats {
  date: string
  views: number
  likes: number
}

export interface TopArticle {
  title: string
  wx_name: string
  read_count: number
  praise: number
  interaction_rate: number
}

export interface AIConfigTemplate {
  id: number
  template_name: string
  provider: string
  api_base_url: string
  model_summarize: string
  model_insights: string
  description: string | null
  is_free: number
  sort_order: number
}

export interface AITestLog {
  id: number
  config_id: number | null
  test_type: string
  is_success: number
  error_message: string | null
  response_time: number | null
  tested_at: number
}

// ==================== 工具函数 ====================

export function generateBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getCurrentTimestamp(): number {
  return Date.now()
}

// ==================== 分析批次相关 ====================

export async function saveAnalysis(data: SaveAnalysisData): Promise<boolean> {
  try {
    const timestamp = getCurrentTimestamp()

    // 1. 插入批次信息
    const { error: batchError } = await supabase
      .from('analysis_batches')
      .insert({
        batch_id: data.batchId,
        keyword: data.keyword,
        time_range: data.timeRange,
        article_count: data.articleCount,
        total_articles: data.totalArticles,
        created_at: timestamp
      })

    if (batchError) {
      console.error('保存批次失败:', batchError)
      return false
    }

    // 2. 批量插入文章
    if (data.articles && data.articles.length > 0) {
      const articlesData = data.articles.map((article) => ({
        batch_id: data.batchId,
        title: article.title,
        content: article.content || null,
        praise: article.praise || 0,
        read_count: article.read_count || 0,
        interaction_rate: article.interaction_rate || 0,
        wx_name: article.wx_name || null,
        url: article.url || null,
        short_link: article.short_link || null,
        publish_time: article.publish_time || null
      }))

      const { error: articlesError } = await supabase
        .from('articles')
        .insert(articlesData)

      if (articlesError) {
        console.error('保存文章失败:', articlesError)
      }
    }

    // 3. 批量插入词云
    if (data.wordCloud && data.wordCloud.length > 0) {
      const wordCloudData = data.wordCloud.map((item, index) => ({
        batch_id: data.batchId,
        word: item.word,
        count: item.count,
        rank_index: index
      }))

      const { error: wordCloudError } = await supabase
        .from('word_cloud')
        .insert(wordCloudData)

      if (wordCloudError) {
        console.error('保存词云失败:', wordCloudError)
      }
    }

    // 4. 批量插入洞察
    if (data.insights && data.insights.length > 0) {
      const insightsData = data.insights.map((insight: any, index: number) => ({
        batch_id: data.batchId,
        type: insight.type,
        title: insight.title,
        suggested_title: insight.suggested_title || insight.suggestedTitle,
        direction: insight.direction || null,
        audience: insight.audience || null,
        angle: insight.angle || null,
        reasoning: insight.reasoning || null,
        rank_index: index,
        source_article_title: insight.source_article_title || insight.sourceArticle?.title || null,
        source_article_url: insight.source_article_url || insight.sourceArticle?.url || null,
        source_article_publish_time: insight.source_article_publish_time || insight.sourceArticle?.publishTime || null,
        source_article_wx_name: insight.source_article_wx_name || insight.sourceArticle?.wx_name || null,
        created_at: insight.created_at || insight.createdAt || new Date().toISOString()
      }))

      const { error: insightsError } = await supabase
        .from('topic_insights')
        .insert(insightsData)

      if (insightsError) {
        console.error('保存洞察失败:', insightsError)
      }
    }

    return true
  } catch (error) {
    console.error('保存分析数据失败:', error)
    return false
  }
}

export async function getBatchList(limit = 50, offset = 0): Promise<BatchListItem[]> {
  const { data, error } = await supabase
    .from('analysis_batches')
    .select('batch_id, keyword, time_range, article_count, total_articles, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('获取批次列表失败:', error)
    return []
  }

  return data || []
}

export async function getBatchDetail(batchId: string): Promise<BatchDetail | null> {
  // 获取批次信息
  const { data: batch, error: batchError } = await supabase
    .from('analysis_batches')
    .select('*')
    .eq('batch_id', batchId)
    .single()

  if (batchError || !batch) {
    console.error('获取批次详情失败:', batchError)
    return null
  }

  // 获取文章
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('batch_id', batchId)
    .order('read_count', { ascending: false })

  // 获取词云
  const { data: wordCloud } = await supabase
    .from('word_cloud')
    .select('*')
    .eq('batch_id', batchId)
    .order('rank_index', { ascending: true })

  // 获取洞察
  const { data: insights } = await supabase
    .from('topic_insights')
    .select('*')
    .eq('batch_id', batchId)
    .order('rank_index', { ascending: true })

  return {
    ...batch,
    articles: articles || [],
    wordCloud: wordCloud || [],
    insights: insights || []
  }
}

export async function deleteBatch(batchId: string): Promise<boolean> {
  const { error } = await supabase
    .from('analysis_batches')
    .delete()
    .eq('batch_id', batchId)

  if (error) {
    console.error('删除批次失败:', error)
    return false
  }

  return true
}

export async function getBatchCount(): Promise<number> {
  const { count, error } = await supabase
    .from('analysis_batches')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('获取批次数量失败:', error)
    return 0
  }

  return count || 0
}

// ==================== 统计相关 ====================

export async function getGlobalStats(timeRangeDays?: number): Promise<GlobalStats> {
  const { count: totalBatches } = await supabase
    .from('analysis_batches')
    .select('*', { count: 'exact', head: true })

  const { count: totalArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })

  // 获取总浏览量和点赞数
  const { data: stats } = await supabase
    .from('articles')
    .select('read_count, praise')

  const totalViews = stats?.reduce((sum, item) => sum + (item.read_count || 0), 0) || 0
  const totalLikes = stats?.reduce((sum, item) => sum + (item.praise || 0), 0) || 0

  return {
    totalBatches: totalBatches || 0,
    totalArticles: totalArticles || 0,
    totalViews,
    totalLikes
  }
}

export async function getDailyStats(days = 7): Promise<DailyStats[]> {
  // Supabase 实现：按 publish_time 分组统计
  // 注意：这需要 PostgreSQL 的日期函数
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000

  const { data } = await supabase
    .from('articles')
    .select('publish_time, read_count, praise')
    .gte('publish_time', startTime)
    .not('publish_time', 'is', null)

  // 在客户端按天分组（简化版）
  const dailyMap = new Map<string, { views: number, likes: number }>()

  data?.forEach(article => {
    if (article.publish_time) {
      const date = new Date(article.publish_time).toISOString().split('T')[0]
      const existing = dailyMap.get(date) || { views: 0, likes: 0 }
      dailyMap.set(date, {
        views: existing.views + (article.read_count || 0),
        likes: existing.likes + (article.praise || 0)
      })
    }
  })

  return Array.from(dailyMap.entries()).map(([date, stats]) => ({
    date,
    ...stats
  }))
}

export async function getTopArticles(
  orderBy: "praise" | "read_count" | "interaction_rate",
  limit = 5
): Promise<TopArticle[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('title, wx_name, read_count, praise, interaction_rate')
    .order(orderBy, { ascending: false })
    .limit(limit)

  if (error) {
    console.error('获取热门文章失败:', error)
    return []
  }

  return data || []
}

export async function getTopWords(limit = 10): Promise<WordCloudItem[]> {
  const { data, error } = await supabase
    .from('word_cloud')
    .select('*')
    .order('count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('获取热门词汇失败:', error)
    return []
  }

  return data || []
}

// ==================== AI 配置相关 ====================

export async function getAllAIConfigs(): Promise<AIConfig[]> {
  const { data, error } = await supabase
    .from('ai_configs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('获取 AI 配置失败:', error)
    return []
  }

  return data || []
}

export async function getActiveAIConfig(): Promise<AIConfig | null> {
  const { data, error } = await supabase
    .from('ai_configs')
    .select('*')
    .eq('is_active', 1)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function createAIConfig(config: Omit<AIConfig, "id" | "created_at" | "updated_at">): Promise<number> {
  const timestamp = getCurrentTimestamp()

  const { data, error } = await supabase
    .from('ai_configs')
    .insert({
      ...config,
      created_at: timestamp,
      updated_at: timestamp
    })
    .select('id')
    .single()

  if (error) {
    console.error('创建 AI 配置失败:', error)
    throw new Error(handleSupabaseError(error))
  }

  return data.id
}

export async function updateAIConfig(
  id: number,
  config: Partial<Omit<AIConfig, "id" | "created_at" | "updated_at">>
): Promise<boolean> {
  const { error } = await supabase
    .from('ai_configs')
    .update({
      ...config,
      updated_at: getCurrentTimestamp()
    })
    .eq('id', id)

  if (error) {
    console.error('更新 AI 配置失败:', error)
    return false
  }

  return true
}

export async function activateAIConfig(id: number): Promise<boolean> {
  // 先将所有配置设为非激活
  await supabase
    .from('ai_configs')
    .update({ is_active: 0, updated_at: getCurrentTimestamp() })
    .neq('id', 0) // 更新所有记录

  // 激活指定配置
  const { error } = await supabase
    .from('ai_configs')
    .update({ is_active: 1, last_used_at: getCurrentTimestamp(), updated_at: getCurrentTimestamp() })
    .eq('id', id)

  if (error) {
    console.error('激活 AI 配置失败:', error)
    return false
  }

  return true
}

export async function deleteAIConfig(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('ai_configs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除 AI 配置失败:', error)
    return false
  }

  return true
}

export async function getAIConfigsByType(modelType: 'text' | 'image' | 'multimodal'): Promise<AIConfig[]> {
  const { data, error } = await supabase
    .from('ai_configs')
    .select('*')
    .eq('model_type', modelType)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('获取 AI 配置失败:', error)
    return []
  }

  return data || []
}

export async function getActiveImageModel(): Promise<AIConfig | null> {
  const { data, error } = await supabase
    .from('ai_configs')
    .select('*')
    .eq('model_type', 'image')
    .eq('is_active', 1)
    .single()

  if (error) {
    return null
  }

  return data
}

// ==================== AI 配置模板相关 ====================

export async function getAllAIConfigTemplates(): Promise<AIConfigTemplate[]> {
  const { data, error } = await supabase
    .from('ai_config_templates')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('获取 AI 配置模板失败:', error)
    return []
  }

  return data || []
}

export async function insertAIConfigTemplate(template: Omit<AIConfigTemplate, "id">): Promise<number> {
  const { data, error } = await supabase
    .from('ai_config_templates')
    .insert(template)
    .select('id')
    .single()

  if (error) {
    console.error('插入 AI 配置模板失败:', error)
    throw new Error(handleSupabaseError(error))
  }

  return data.id
}

// ==================== AI 测试日志相关 ====================

export async function saveAITestLog(log: Omit<AITestLog, "id" | "tested_at">): Promise<number> {
  const { data, error } = await supabase
    .from('ai_test_logs')
    .insert({
      ...log,
      tested_at: getCurrentTimestamp()
    })
    .select('id')
    .single()

  if (error) {
    console.error('保存 AI 测试日志失败:', error)
    throw new Error(handleSupabaseError(error))
  }

  return data.id
}

export async function getAITestLogs(configId: number, limit = 10): Promise<AITestLog[]> {
  const { data, error } = await supabase
    .from('ai_test_logs')
    .select('*')
    .eq('config_id', configId)
    .order('tested_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('获取 AI 测试日志失败:', error)
    return []
  }

  return data || []
}

// ==================== 生成内容相关 ====================

export async function saveGeneratedContent(
  content: Omit<GeneratedContent, 'id' | 'created_at' | 'updated_at'>
): Promise<number> {
  const timestamp = getCurrentTimestamp()

  const { data, error } = await supabase
    .from('generated_contents')
    .insert({
      ...content,
      created_at: timestamp,
      updated_at: timestamp
    })
    .select('id')
    .single()

  if (error) {
    console.error('保存生成内容失败:', error)
    throw new Error(handleSupabaseError(error))
  }

  return data.id
}

export async function getGeneratedContent(id: number): Promise<GeneratedContent | null> {
  const { data, error } = await supabase
    .from('generated_contents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGeneratedImages(contentId: number): Promise<any[]> {
  const { data, error } = await supabase
    .from('generated_images')
    .select('*')
    .eq('content_id', contentId)
    .order('paragraph_index', { ascending: true })

  if (error) {
    console.error('获取生成图片失败:', error)
    return []
  }

  return data || []
}

export async function saveGeneratedImage(image: Omit<GeneratedImage, 'id' | 'created_at'>): Promise<number> {
  const { data, error } = await supabase
    .from('generated_images')
    .insert({
      ...image,
      created_at: getCurrentTimestamp()
    })
    .select('id')
    .single()

  if (error) {
    console.error('保存生成图片失败:', error)
    throw new Error(handleSupabaseError(error))
  }

  return data.id
}

export async function getContentImages(contentId: number): Promise<GeneratedImage[]> {
  const { data, error } = await supabase
    .from('generated_images')
    .select('*')
    .eq('content_id', contentId)
    .order('paragraph_index', { ascending: true })

  if (error) {
    console.error('获取内容图片失败:', error)
    return []
  }

  return data || []
}

export async function deleteGeneratedImage(imageId: number): Promise<boolean> {
  const { error } = await supabase
    .from('generated_images')
    .delete()
    .eq('id', imageId)

  if (error) {
    console.error('删除生成图片失败:', error)
    return false
  }

  return true
}

// ==================== 发布平台相关 ====================

export async function getPublishPlatforms(platform?: string): Promise<PublishPlatform[]> {
  let query = supabase
    .from('publish_platforms')
    .select('*')
    .order('platform', { ascending: true })

  if (platform) {
    query = query.eq('platform', platform)
  }

  const { data, error } = await query

  if (error) {
    console.error('获取发布平台失败:', error)
    return []
  }

  return data || []
}

export async function getAllPublishPlatforms(): Promise<PublishPlatform[]> {
  return getPublishPlatforms()
}

export async function savePublishPlatform(
  platform: Omit<PublishPlatform, 'id' | 'created_at' | 'updated_at'>
): Promise<number> {
  const timestamp = getCurrentTimestamp()

  const { data, error } = await supabase
    .from('publish_platforms')
    .insert({
      ...platform,
      created_at: timestamp,
      updated_at: timestamp
    })
    .select('id')
    .single()

  if (error) {
    console.error('保存发布平台失败:', error)
    throw new Error(handleSupabaseError(error))
  }

  return data.id
}

export async function updatePublishPlatform(
  id: number,
  platform: Partial<Omit<PublishPlatform, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('publish_platforms')
    .update({
      ...platform,
      updated_at: getCurrentTimestamp()
    })
    .eq('id', id)

  if (error) {
    console.error('更新发布平台失败:', error)
    return false
  }

  return true
}

export async function getPublishRecords(contentId?: number): Promise<PublishRecord[]> {
  let query = supabase
    .from('publish_records')
    .select('*')
    .order('created_at', { ascending: false })

  if (contentId) {
    query = query.eq('content_id', contentId)
  }

  const { data, error } = await query

  if (error) {
    console.error('获取发布记录失败:', error)
    return []
  }

  return data || []
}

export async function savePublishRecord(
  record: Omit<PublishRecord, 'id' | 'created_at'>
): Promise<number> {
  const { data, error } = await supabase
    .from('publish_records')
    .insert({
      ...record,
      created_at: getCurrentTimestamp()
    })
    .select('id')
    .single()

  if (error) {
    console.error('保存发布记录失败:', error)
    throw new Error(handleSupabaseError(error))
  }

  return data.id
}

export async function updatePublishRecord(
  id: number,
  record: Partial<Omit<PublishRecord, 'id' | 'content_id' | 'platform' | 'created_at'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('publish_records')
    .update(record)
    .eq('id', id)

  if (error) {
    console.error('更新发布记录失败:', error)
    return false
  }

  return true
}

// ==================== 获取所有洞察（用于洞察选择对话框）====================

export async function getAllInsights(limit = 100): Promise<TopicInsight[]> {
  const { data, error } = await supabase
    .from('topic_insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('获取洞察列表失败:', error)
    return []
  }

  return data || []
}

// ==================== 其他辅助函数 ====================

export function getBatchStats() {
  // 这个函数在 SQLite 版本中可能有具体实现
  // 这里提供一个基础版本
  return getGlobalStats()
}

// 确保导出所有需要的类型
export type {
  AIConfig,
  GeneratedContent,
  GeneratedImage,
  TopicInsight,
  PublishPlatform,
  PublishRecord
}
