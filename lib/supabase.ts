/**
 * Supabase 客户端初始化
 * 用于连接 PostgreSQL 数据库
 */

import { createClient } from '@supabase/supabase-js'

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 环境变量配置')
}

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 不持久化会话（服务端不需要）
  },
})

// 数据库类型定义（与原 SQLite 结构保持一致）
export interface AnalysisBatch {
  id: number
  batch_id: string
  keyword: string
  time_range: number
  article_count: number
  total_articles: number
  created_at: number
}

export interface Article {
  id: number
  batch_id: string
  title: string
  content: string | null
  praise: number
  read_count: number
  interaction_rate: number
  wx_name: string | null
  url: string | null
  short_link: string | null
  publish_time: number | null
}

export interface WordCloudItem {
  id: number
  batch_id: string
  word: string
  count: number
  rank_index: number
}

export interface TopicInsight {
  id: number
  batch_id: string
  type: string
  title: string
  suggested_title: string
  direction: string | null
  audience: string | null
  angle: string | null
  reasoning: string | null
  rank_index: number
  source_article_title: string | null
  source_article_url: string | null
  source_article_publish_time: string | null
  source_article_wx_name: string | null
  created_at: string | null
}

export interface AIConfig {
  id: number
  config_name: string
  provider: string
  api_key: string
  api_base_url: string
  model_summarize: string
  model_insights: string
  prompt_summarize: string
  prompt_insights: string
  model_type?: string  // 可选字段，有默认值
  is_preset: number
  is_active: number
  last_used_at: number | null
  created_at: number
  updated_at: number
}

export interface GeneratedContent {
  id: number
  insight_id: number | null
  title: string
  summary: string | null
  content_text: string
  content_with_images: string | null
  word_count: number | null
  reading_time: number | null
  text_model: string | null
  image_model: string | null
  images_data: string | null
  content_source: 'ai' | 'manual'
  created_at: number
  updated_at: number
}

export interface GeneratedImage {
  id: number
  content_id: number
  paragraph_index: number | null
  prompt: string
  negative_prompt: string | null
  image_url: string
  local_path: string | null
  is_placeholder: number
  generation_time: number | null
  created_at: number
}

export interface PublishPlatform {
  id: number
  platform: 'wechat' | 'xiaohongshu'
  platform_name: string
  app_id?: string | null
  app_secret?: string | null
  access_token?: string | null
  refresh_token?: string | null
  token_expires_at?: number | null
  webhook_url?: string | null
  webhook_secret?: string | null
  is_active: number
  created_at: number
  updated_at: number
}

export interface PublishRecord {
  id: number
  content_id: number
  platform: string
  platform_post_id?: string | null
  status?: 'pending' | 'success' | 'failed' | 'cancelled'
  error_message?: string | null
  published_url?: string | null
  scheduled_at?: number | null
  published_at?: number | null
  retry_count?: number
  created_at: number
}

// 辅助函数：将 Supabase 错误转换为友好的错误消息
export function handleSupabaseError(error: any): string {
  if (!error) return '未知错误'

  if (error.code === 'PGRST116') {
    return '未找到相关数据'
  }

  if (error.code === '23505') {
    return '数据已存在，违反唯一性约束'
  }

  if (error.code === '23503') {
    return '外键约束失败，关联数据不存在'
  }

  return error.message || error.toString()
}
