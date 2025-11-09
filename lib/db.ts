import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

// 确保 data 目录存在
const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, "content-factory.db")
const db = new Database(dbPath)

// 启用外键约束
db.pragma("foreign_keys = ON")

// 导出数据库实例
export function getDatabase() {
  return db
}

// 创建表结构
function initDatabase() {
  // 1. 分析批次表
  db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT UNIQUE NOT NULL,
      keyword TEXT NOT NULL,
      time_range INTEGER NOT NULL,
      article_count INTEGER NOT NULL,
      total_articles INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)

  // 2. 文章表
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      praise INTEGER NOT NULL,
      read_count INTEGER NOT NULL,
      interaction_rate REAL NOT NULL,
      wx_name TEXT,
      url TEXT,
      short_link TEXT,
      publish_time INTEGER,
      FOREIGN KEY (batch_id) REFERENCES analysis_batches(batch_id) ON DELETE CASCADE
    )
  `)

  // 3. 词云表
  db.exec(`
    CREATE TABLE IF NOT EXISTS word_cloud (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT NOT NULL,
      word TEXT NOT NULL,
      count INTEGER NOT NULL,
      rank_index INTEGER NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES analysis_batches(batch_id) ON DELETE CASCADE
    )
  `)

  // 4. 选题洞察表
  db.exec(`
    CREATE TABLE IF NOT EXISTS topic_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      suggested_title TEXT NOT NULL,
      direction TEXT,
      audience TEXT,
      angle TEXT,
      reasoning TEXT,
      rank_index INTEGER NOT NULL,
      source_article_title TEXT,
      source_article_url TEXT,
      source_article_publish_time TEXT,
      source_article_wx_name TEXT,
      created_at TEXT,
      FOREIGN KEY (batch_id) REFERENCES analysis_batches(batch_id) ON DELETE CASCADE
    )
  `)

  // 5. AI 配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_name TEXT NOT NULL,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      api_base_url TEXT NOT NULL,
      model_summarize TEXT NOT NULL,
      model_insights TEXT NOT NULL,
      prompt_summarize TEXT NOT NULL,
      prompt_insights TEXT NOT NULL,
      is_preset INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 0,
      last_used_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `)

  // 6. AI 配置模板表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_config_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_name TEXT NOT NULL,
      provider TEXT NOT NULL,
      api_base_url TEXT NOT NULL,
      model_summarize TEXT NOT NULL,
      model_insights TEXT NOT NULL,
      description TEXT,
      is_free INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    )
  `)

  // 7. AI 测试日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_test_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_id INTEGER,
      test_type TEXT NOT NULL,
      is_success INTEGER NOT NULL,
      error_message TEXT,
      response_time INTEGER,
      tested_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (config_id) REFERENCES ai_configs(id) ON DELETE CASCADE
    )
  `)

  // 8. 生成内容表（图文混排）
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insight_id INTEGER,
      title TEXT NOT NULL,
      summary TEXT,
      content_text TEXT NOT NULL,
      content_with_images TEXT,
      word_count INTEGER,
      reading_time INTEGER,
      text_model TEXT,
      image_model TEXT,
      images_data TEXT,
      content_source TEXT DEFAULT 'manual' CHECK(content_source IN ('ai', 'manual')),
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (insight_id) REFERENCES topic_insights(id)
    )
  `)

  // 9. 生成图片表
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL,
      paragraph_index INTEGER,
      prompt TEXT NOT NULL,
      negative_prompt TEXT,
      image_url TEXT NOT NULL,
      local_path TEXT,
      is_placeholder INTEGER DEFAULT 0,
      generation_time INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (content_id) REFERENCES generated_contents(id) ON DELETE CASCADE
    )
  `)

  // 给 ai_configs 表添加 model_type 字段（如果不存在）
  try {
    db.exec(`ALTER TABLE ai_configs ADD COLUMN model_type TEXT DEFAULT 'text'`)
  } catch (error) {
    // 字段已存在，忽略错误
  }

  // 给 generated_contents 表添加 content_source 字段（如果不存在）
  try {
    db.exec(`ALTER TABLE generated_contents ADD COLUMN content_source TEXT DEFAULT 'manual'`)
  } catch (error) {
    // 字段已存在，忽略错误
  }

  // 创建索引以提升查询性能
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_articles_batch_id ON articles(batch_id);
    CREATE INDEX IF NOT EXISTS idx_word_cloud_batch_id ON word_cloud(batch_id);
    CREATE INDEX IF NOT EXISTS idx_topic_insights_batch_id ON topic_insights(batch_id);
    CREATE INDEX IF NOT EXISTS idx_batches_created_at ON analysis_batches(created_at);
    CREATE INDEX IF NOT EXISTS idx_ai_configs_active ON ai_configs(is_active);
    CREATE INDEX IF NOT EXISTS idx_ai_configs_provider ON ai_configs(provider);
    CREATE INDEX IF NOT EXISTS idx_ai_configs_model_type ON ai_configs(model_type);
    CREATE INDEX IF NOT EXISTS idx_ai_test_logs_config ON ai_test_logs(config_id);
    CREATE INDEX IF NOT EXISTS idx_generated_contents_insight ON generated_contents(insight_id);
    CREATE INDEX IF NOT EXISTS idx_generated_images_content ON generated_images(content_id);
  `)
}

// 生成批次ID: BATCH_YYYYMMDD_HHMMSS_XXXX
export function generateBatchId(): string {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")

  // 生成4位随机字符（字母+数字）
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let randomStr = ""
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `BATCH_${year}${month}${day}_${hours}${minutes}${seconds}_${randomStr}`
}

// 保存分析批次
export interface SaveAnalysisData {
  batchId: string
  keyword: string
  timeRange: number
  articleCount: number
  articles: Array<{
    title: string
    content?: string
    praise: number
    read: number
    wx_name?: string
    url?: string
    short_link?: string
    publish_time?: number
  }>
  wordCloud: Array<{
    word: string
    count: number
  }>
  insights?: Array<{
    type: string
    title: string
    suggested_title: string
    direction: string
    audience: string
    angle: string
    reasoning: string
  }>
}

export function saveAnalysis(data: SaveAnalysisData): boolean {
  const transaction = db.transaction(() => {
    // 1. 保存批次信息
    const insertBatch = db.prepare(`
      INSERT INTO analysis_batches (batch_id, keyword, time_range, article_count, total_articles, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    insertBatch.run(
      data.batchId,
      data.keyword,
      data.timeRange,
      data.articleCount,
      data.articles.length,
      Date.now()
    )

    // 2. 保存文章数据
    const insertArticle = db.prepare(`
      INSERT INTO articles (batch_id, title, content, praise, read_count, interaction_rate, wx_name, url, short_link, publish_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const article of data.articles) {
      const interactionRate = article.read > 0 ? (article.praise / article.read) * 100 : 0
      insertArticle.run(
        data.batchId,
        article.title,
        article.content || null,
        article.praise,
        article.read,
        interactionRate,
        article.wx_name || null,
        article.url || null,
        article.short_link || null,
        article.publish_time || null
      )
    }

    // 3. 保存词云数据
    const insertWordCloud = db.prepare(`
      INSERT INTO word_cloud (batch_id, word, count, rank_index)
      VALUES (?, ?, ?, ?)
    `)

    data.wordCloud.forEach((item, index) => {
      insertWordCloud.run(data.batchId, item.word, item.count, index)
    })

    // 4. 保存选题洞察数据
    if (data.insights && data.insights.length > 0) {
      const insertInsight = db.prepare(`
        INSERT INTO topic_insights (
          batch_id, type, title, suggested_title, direction, audience, angle, reasoning, rank_index,
          source_article_title, source_article_url, source_article_publish_time, source_article_wx_name, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      data.insights.forEach((insight, index) => {
        insertInsight.run(
          data.batchId,
          insight.type,
          insight.title,
          insight.suggestedTitle || insight.suggested_title, // 兼容两种字段名
          insight.direction || null,
          insight.audience || null,
          insight.angle || null,
          insight.reasoning || null,
          index,
          insight.source_article_title || insight.sourceArticle?.title || null,
          insight.source_article_url || insight.sourceArticle?.url || null,
          insight.source_article_publish_time || insight.sourceArticle?.publishTime || null,
          insight.source_article_wx_name || insight.sourceArticle?.wx_name || null,
          insight.created_at || insight.createdAt || new Date().toISOString()
        )
      })
    }
  })

  try {
    transaction()
    return true
  } catch (error) {
    console.error("保存分析结果失败:", error)
    throw error // 重新抛出错误，让上层捕获详细信息
  }
}

// 获取批次列表
export interface BatchListItem {
  id: number
  batch_id: string
  keyword: string
  time_range: number
  article_count: number
  total_articles: number
  created_at: number
}

export function getBatchList(limit = 50, offset = 0): BatchListItem[] {
  const stmt = db.prepare(`
    SELECT * FROM analysis_batches
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)

  return stmt.all(limit, offset) as BatchListItem[]
}

// 获取批次详情
export interface BatchDetail extends BatchListItem {
  articles: Array<{
    id: number
    title: string
    content: string | null
    praise: number
    read_count: number
    interaction_rate: number
    wx_name: string | null
    url: string | null
    short_link: string | null
    publish_time: number | null
  }>
  wordCloud: Array<{
    id: number
    word: string
    count: number
    rank_index: number
  }>
  insights: Array<{
    id: number
    type: string
    title: string
    suggested_title: string
    direction: string | null
    audience: string | null
    angle: string | null
    reasoning: string | null
    rank_index: number
  }>
}

export function getBatchDetail(batchId: string): BatchDetail | null {
  // 获取批次基本信息
  const batchStmt = db.prepare(`
    SELECT * FROM analysis_batches WHERE batch_id = ?
  `)
  const batch = batchStmt.get(batchId) as BatchListItem | undefined

  if (!batch) {
    return null
  }

  // 获取文章列表
  const articlesStmt = db.prepare(`
    SELECT * FROM articles WHERE batch_id = ? ORDER BY praise DESC
  `)
  const articles = articlesStmt.all(batchId) as BatchDetail["articles"]

  // 获取词云数据
  const wordCloudStmt = db.prepare(`
    SELECT * FROM word_cloud WHERE batch_id = ? ORDER BY rank_index ASC
  `)
  const wordCloud = wordCloudStmt.all(batchId) as BatchDetail["wordCloud"]

  // 获取选题洞察数据
  const insightsStmt = db.prepare(`
    SELECT * FROM topic_insights WHERE batch_id = ? ORDER BY rank_index ASC
  `)
  const insights = insightsStmt.all(batchId) as BatchDetail["insights"]

  return {
    ...batch,
    articles,
    wordCloud,
    insights,
  }
}

// 删除批次（会级联删除相关文章和词云数据）
export function deleteBatch(batchId: string): boolean {
  try {
    const stmt = db.prepare(`
      DELETE FROM analysis_batches WHERE batch_id = ?
    `)
    const result = stmt.run(batchId)
    return result.changes > 0
  } catch (error) {
    console.error("删除批次失败:", error)
    return false
  }
}

// 获取批次统计
export function getBatchStats() {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total_batches,
      SUM(total_articles) as total_articles,
      MAX(created_at) as latest_analysis
    FROM analysis_batches
  `)

  return stmt.get() as {
    total_batches: number
    total_articles: number
    latest_analysis: number | null
  }
}

// 获取批次总数
export function getBatchCount(): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM analysis_batches
  `)
  const result = stmt.get() as { count: number }
  return result.count
}

// 获取全局统计数据
export interface GlobalStats {
  totalArticles: number
  totalViews: number
  totalLikes: number
  avgInteractionRate: number
  totalKeywords: number
  totalBatches: number
}

export function getGlobalStats(timeRangeDays?: number): GlobalStats {
  let whereClause = ""
  const params: any[] = []

  if (timeRangeDays) {
    const cutoffTime = Date.now() - timeRangeDays * 24 * 60 * 60 * 1000
    whereClause = "WHERE a.publish_time >= ?"
    params.push(cutoffTime)
  }

  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total_articles,
      SUM(read_count) as total_views,
      SUM(praise) as total_likes,
      AVG(interaction_rate) as avg_interaction_rate
    FROM articles a
    ${whereClause}
  `)

  const stats = stmt.get(...params) as {
    total_articles: number
    total_views: number | null
    total_likes: number | null
    avg_interaction_rate: number | null
  }

  // 获取关键词数量
  const keywordsStmt = db.prepare(`
    SELECT COUNT(DISTINCT word) as total_keywords FROM word_cloud
  `)
  const keywordsResult = keywordsStmt.get() as { total_keywords: number }

  // 获取批次数量
  const batchStmt = db.prepare(`
    SELECT COUNT(*) as total_batches FROM analysis_batches
  `)
  const batchResult = batchStmt.get() as { total_batches: number }

  return {
    totalArticles: stats.total_articles || 0,
    totalViews: stats.total_views || 0,
    totalLikes: stats.total_likes || 0,
    avgInteractionRate: stats.avg_interaction_rate || 0,
    totalKeywords: keywordsResult.total_keywords || 0,
    totalBatches: batchResult.total_batches || 0,
  }
}

// 获取按时间维度的统计数据（最近7天）
export interface DailyStats {
  date: string
  views: number
  likes: number
}

export function getDailyStats(days = 7): DailyStats[] {
  // 获取最近N天的每日统计
  const stmt = db.prepare(`
    SELECT
      date(publish_time / 1000, 'unixepoch', 'localtime') as date,
      SUM(read_count) as views,
      SUM(praise) as likes
    FROM articles
    WHERE publish_time >= ?
    GROUP BY date
    ORDER BY date ASC
  `)

  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
  const results = stmt.all(cutoffTime) as { date: string; views: number; likes: number }[]

  // 确保有7天数据，没有数据的日期填充0
  const today = new Date()
  const dateMap = new Map<string, { views: number; likes: number }>()

  results.forEach((r) => {
    dateMap.set(r.date, { views: r.views, likes: r.likes })
  })

  const dailyStats: DailyStats[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    const stats = dateMap.get(dateStr) || { views: 0, likes: 0 }
    dailyStats.push({
      date: dateStr,
      views: stats.views,
      likes: stats.likes,
    })
  }

  return dailyStats
}

// 获取TOP文章（按点赞/阅读/互动率）
export interface TopArticle {
  title: string
  wx_name: string
  read_count: number
  praise: number
  interaction_rate: number
  url: string
}

export function getTopArticles(orderBy: "praise" | "read_count" | "interaction_rate", limit = 5): TopArticle[] {
  const stmt = db.prepare(`
    SELECT
      title,
      wx_name,
      read_count,
      praise,
      interaction_rate,
      url
    FROM articles
    ORDER BY ${orderBy} DESC
    LIMIT ?
  `)

  return stmt.all(limit) as TopArticle[]
}

// 获取高频词云（TOP N）
export interface WordCloudItem {
  word: string
  count: number
}

export function getTopWords(limit = 10): WordCloudItem[] {
  const stmt = db.prepare(`
    SELECT word, SUM(count) as total_count
    FROM word_cloud
    GROUP BY word
    ORDER BY total_count DESC
    LIMIT ?
  `)

  const results = stmt.all(limit) as { word: string; total_count: number }[]
  return results.map((r) => ({ word: r.word, count: r.total_count }))
}

// ==================== AI 配置管理 ====================

// AI 配置接口
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
  is_preset: number
  is_active: number
  last_used_at: number | null
  created_at: number
  updated_at: number
  model_type?: string  // 'text' | 'image' | 'multimodal'
}

// 获取所有 AI 配置
export function getAllAIConfigs(): AIConfig[] {
  const stmt = db.prepare(`
    SELECT * FROM ai_configs ORDER BY is_active DESC, last_used_at DESC, created_at DESC
  `)
  return stmt.all() as AIConfig[]
}

// 获取当前激活的配置
export function getActiveAIConfig(): AIConfig | null {
  const stmt = db.prepare(`
    SELECT * FROM ai_configs WHERE is_active = 1 LIMIT 1
  `)
  return (stmt.get() as AIConfig) || null
}

// 创建 AI 配置
export function createAIConfig(config: Omit<AIConfig, "id" | "created_at" | "updated_at">): number {
  const stmt = db.prepare(`
    INSERT INTO ai_configs (
      config_name, provider, api_key, api_base_url,
      model_summarize, model_insights, prompt_summarize, prompt_insights,
      is_preset, is_active, last_used_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    config.config_name,
    config.provider,
    config.api_key,
    config.api_base_url,
    config.model_summarize,
    config.model_insights,
    config.prompt_summarize,
    config.prompt_insights,
    config.is_preset,
    config.is_active,
    config.last_used_at
  )

  return result.lastInsertRowid as number
}

// 更新 AI 配置
export function updateAIConfig(id: number, config: Partial<Omit<AIConfig, "id" | "created_at" | "updated_at">>): boolean {
  const fields: string[] = []
  const values: any[] = []

  Object.entries(config).forEach(([key, value]) => {
    fields.push(`${key} = ?`)
    values.push(value)
  })

  if (fields.length === 0) return false

  fields.push("updated_at = ?")
  values.push(Date.now())
  values.push(id)

  const stmt = db.prepare(`
    UPDATE ai_configs SET ${fields.join(", ")} WHERE id = ?
  `)

  const result = stmt.run(...values)
  return result.changes > 0
}

// 激活指定配置（会将其他配置设为非激活）
export function activateAIConfig(id: number): boolean {
  const transaction = db.transaction(() => {
    // 1. 将所有配置设为非激活
    db.prepare("UPDATE ai_configs SET is_active = 0").run()

    // 2. 激活指定配置并更新最后使用时间
    const stmt = db.prepare(`
      UPDATE ai_configs SET is_active = 1, last_used_at = ? WHERE id = ?
    `)
    stmt.run(Date.now(), id)
  })

  try {
    transaction()
    return true
  } catch (error) {
    console.error("激活配置失败:", error)
    return false
  }
}

// 删除 AI 配置
export function deleteAIConfig(id: number): boolean {
  try {
    const stmt = db.prepare("DELETE FROM ai_configs WHERE id = ? AND is_preset = 0")
    const result = stmt.run(id)
    return result.changes > 0
  } catch (error) {
    console.error("删除配置失败:", error)
    return false
  }
}

// AI 配置模板接口
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

// 获取所有配置模板
export function getAllAIConfigTemplates(): AIConfigTemplate[] {
  const stmt = db.prepare(`
    SELECT * FROM ai_config_templates ORDER BY sort_order ASC, id ASC
  `)
  return stmt.all() as AIConfigTemplate[]
}

// 插入配置模板
export function insertAIConfigTemplate(template: Omit<AIConfigTemplate, "id">): number {
  const stmt = db.prepare(`
    INSERT INTO ai_config_templates (
      template_name, provider, api_base_url, model_summarize, model_insights,
      description, is_free, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    template.template_name,
    template.provider,
    template.api_base_url,
    template.model_summarize,
    template.model_insights,
    template.description,
    template.is_free,
    template.sort_order
  )

  return result.lastInsertRowid as number
}

// AI 测试日志接口
export interface AITestLog {
  id: number
  config_id: number | null
  test_type: string
  is_success: number
  error_message: string | null
  response_time: number | null
  tested_at: number
}

// 保存测试日志
export function saveAITestLog(log: Omit<AITestLog, "id" | "tested_at">): number {
  const stmt = db.prepare(`
    INSERT INTO ai_test_logs (config_id, test_type, is_success, error_message, response_time)
    VALUES (?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    log.config_id,
    log.test_type,
    log.is_success,
    log.error_message,
    log.response_time
  )

  return result.lastInsertRowid as number
}

// 获取配置的测试日志
export function getAITestLogs(configId: number, limit = 10): AITestLog[] {
  const stmt = db.prepare(`
    SELECT * FROM ai_test_logs WHERE config_id = ? ORDER BY tested_at DESC LIMIT ?
  `)
  return stmt.all(configId, limit) as AITestLog[]
}

// 初始化预设模板数据
function initAIConfigTemplates() {
  // 检查是否已经有模板数据
  const checkStmt = db.prepare("SELECT COUNT(*) as count FROM ai_config_templates")
  const result = checkStmt.get() as { count: number }

  if (result.count > 0) {
    // 已经有模板数据，跳过初始化
    return
  }

  // 插入预设模板
  const templates: Omit<AIConfigTemplate, "id">[] = [
    {
      template_name: "OpenAI 官方",
      provider: "openai",
      api_base_url: "https://api.openai.com/v1",
      model_summarize: "gpt-4o-mini",
      model_insights: "gpt-4o",
      description: "OpenAI 官方 API，性能稳定，支持最新模型",
      is_free: 0,
      sort_order: 1,
    },
    {
      template_name: "OpenRouter",
      provider: "openrouter",
      api_base_url: "https://openrouter.ai/api/v1",
      model_summarize: "openai/gpt-4o-mini",
      model_insights: "openai/gpt-4o",
      description: "OpenRouter 聚合多个 AI 模型，支持 OpenAI、Anthropic、Google 等",
      is_free: 0,
      sort_order: 2,
    },
    {
      template_name: "SiliconFlow（硅基流动）",
      provider: "siliconflow",
      api_base_url: "https://api.siliconflow.cn/v1",
      model_summarize: "Qwen/Qwen2.5-7B-Instruct",
      model_insights: "Qwen/Qwen2.5-72B-Instruct",
      description: "国内服务商，提供免费额度，支持通义千问等模型",
      is_free: 1,
      sort_order: 3,
    },
    {
      template_name: "智谱 AI (GLM)",
      provider: "zhipu",
      api_base_url: "https://open.bigmodel.cn/api/paas/v4",
      model_summarize: "glm-4-flash",
      model_insights: "glm-4-plus",
      description: "清华系 AI 模型，中文能力强",
      is_free: 0,
      sort_order: 4,
    },
    {
      template_name: "阿里通义千问",
      provider: "qwen",
      api_base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model_summarize: "qwen-plus",
      model_insights: "qwen-max",
      description: "阿里云大模型服务，中文理解能力优秀",
      is_free: 0,
      sort_order: 5,
    },
    {
      template_name: "百度文心一言",
      provider: "ernie",
      api_base_url: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop",
      model_summarize: "ernie-speed-128k",
      model_insights: "ernie-4.0-8k",
      description: "百度大模型服务，中文场景优化",
      is_free: 0,
      sort_order: 6,
    },
    {
      template_name: "DeepSeek",
      provider: "deepseek",
      api_base_url: "https://api.deepseek.com/v1",
      model_summarize: "deepseek-chat",
      model_insights: "deepseek-chat",
      description: "国产高性价比模型，推理能力强",
      is_free: 0,
      sort_order: 7,
    },
    {
      template_name: "自定义配置",
      provider: "custom",
      api_base_url: "https://api.example.com/v1",
      model_summarize: "your-model-name",
      model_insights: "your-model-name",
      description: "自定义 OpenAI 兼容接口",
      is_free: 0,
      sort_order: 99,
    },
  ]

  templates.forEach((template) => {
    insertAIConfigTemplate(template)
  })

  console.log(`✓ 已初始化 ${templates.length} 个 AI 配置模板`)
}

// ==================== 图片生成相关 ====================

// 生成内容接口
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

// 生成图片接口
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

// 获取指定类型的 AI 配置
export function getAIConfigsByType(modelType: 'text' | 'image' | 'multimodal'): AIConfig[] {
  const stmt = db.prepare(`
    SELECT * FROM ai_configs
    WHERE model_type = ?
    ORDER BY is_active DESC, last_used_at DESC, created_at DESC
  `)
  return stmt.all(modelType) as AIConfig[]
}

// 获取当前激活的文生图模型
export function getActiveImageModel(): AIConfig | null {
  const stmt = db.prepare(`
    SELECT * FROM ai_configs
    WHERE model_type = 'image' AND is_active = 1
    LIMIT 1
  `)
  return (stmt.get() as AIConfig) || null
}

// 获取生成的内容
export function getGeneratedContent(id: number): GeneratedContent | null {
  const stmt = db.prepare(`
    SELECT * FROM generated_contents WHERE id = ?
  `)
  return stmt.get(id) as GeneratedContent | null
}

// 获取内容关联的图片
export function getGeneratedImages(contentId: number): any[] {
  const stmt = db.prepare(`
    SELECT * FROM generated_images WHERE content_id = ? ORDER BY paragraph_index ASC
  `)
  return stmt.all(contentId) as any[]
}

// 保存生成的内容
export function saveGeneratedContent(content: Omit<GeneratedContent, 'id' | 'created_at' | 'updated_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO generated_contents (
      insight_id, title, summary, content_text, content_with_images,
      word_count, reading_time, text_model, image_model, images_data, content_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    content.insight_id || null,
    content.title,
    content.summary || null,
    content.content_text,
    content.content_with_images || null,
    content.wordCount || null,
    content.readingTime || null,
    content.textModel || null,
    content.imageModel || null,
    content.images_data || null,
    content.content_source || 'manual'
  )

  return result.lastInsertRowid as number
}

// 保存生成的图片记录
export function saveGeneratedImage(image: Omit<GeneratedImage, 'id' | 'created_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO generated_images (
      content_id, paragraph_index, prompt, negative_prompt,
      image_url, local_path, is_placeholder, generation_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    image.content_id,
    image.paragraph_index,
    image.prompt,
    image.negative_prompt,
    image.image_url,
    image.local_path,
    image.is_placeholder,
    image.generation_time
  )

  return result.lastInsertRowid as number
}

// 获取内容的所有图片
export function getContentImages(contentId: number): GeneratedImage[] {
  const stmt = db.prepare(`
    SELECT * FROM generated_images
    WHERE content_id = ?
    ORDER BY paragraph_index ASC
  `)
  return stmt.all(contentId) as GeneratedImage[]
}

// 删除图片
export function deleteGeneratedImage(imageId: number): boolean {
  try {
    const stmt = db.prepare("DELETE FROM generated_images WHERE id = ?")
    const result = stmt.run(imageId)
    return result.changes > 0
  } catch (error) {
    console.error("删除图片失败:", error)
    return false
  }
}

// 更新图片
export function updateGeneratedImage(imageId: number, updates: Partial<GeneratedImage>): boolean {
  const fields: string[] = []
  const values: any[] = []

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })

  if (fields.length === 0) return false

  values.push(imageId)

  const stmt = db.prepare(`
    UPDATE generated_images SET ${fields.join(", ")} WHERE id = ?
  `)

  const result = stmt.run(...values)
  return result.changes > 0
}

// 发布相关数据库函数
export interface PublishPlatform {
  id: number
  platform: 'wechat' | 'xiaohongshu'
  platform_name: string
  app_id?: string
  app_secret?: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: number
  webhook_url?: string
  webhook_secret?: string
  is_active: number
  created_at: number
  updated_at: number
}

export interface PublishRecord {
  id: number
  content_id: number
  platform: string
  platform_post_id?: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  error_message?: string
  published_url?: string
  scheduled_at?: number
  published_at?: number
  retry_count: number
  created_at: number
}

export interface PublishTemplate {
  id: number
  platform: string
  template_name: string
  title_template?: string
  content_template?: string
  image_rules?: string
  auto_tags: number
  is_active: number
  created_at: number
}

export interface ScheduledPost {
  id: number
  content_id: number
  platform: string
  scheduled_time: number
  status: 'pending' | 'published' | 'failed' | 'cancelled'
  created_at: number
}

// 发布平台配置
export function getPublishPlatforms(platform?: string): PublishPlatform[] {
  let query = "SELECT * FROM publish_platforms WHERE is_active = 1"
  const params: any[] = []

  if (platform) {
    query += " AND platform = ?"
    params.push(platform)
  }

  query += " ORDER BY created_at DESC"

  return db.prepare(query).all(...params) as PublishPlatform[]
}

export function savePublishPlatform(platform: Omit<PublishPlatform, 'id' | 'created_at' | 'updated_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO publish_platforms (platform, platform_name, app_id, app_secret, access_token, refresh_token, token_expires_at, webhook_url, webhook_secret, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    platform.platform,
    platform.platform_name,
    platform.app_id,
    platform.app_secret,
    platform.access_token,
    platform.refresh_token,
    platform.token_expires_at,
    platform.webhook_url,
    platform.webhook_secret,
    platform.is_active
  )

  return result.lastInsertRowid as number
}

export function updatePublishPlatform(id: number, platform: Partial<Omit<PublishPlatform, 'id' | 'created_at' | 'updated_at'>>): boolean {
  const fields: string[] = []
  const params: any[] = []

  if (platform.app_id !== undefined) {
    fields.push("app_id = ?")
    params.push(platform.app_id)
  }
  if (platform.app_secret !== undefined) {
    fields.push("app_secret = ?")
    params.push(platform.app_secret)
  }
  if (platform.access_token !== undefined) {
    fields.push("access_token = ?")
    params.push(platform.access_token)
  }
  if (platform.refresh_token !== undefined) {
    fields.push("refresh_token = ?")
    params.push(platform.refresh_token)
  }
  if (platform.token_expires_at !== undefined) {
    fields.push("token_expires_at = ?")
    params.push(platform.token_expires_at)
  }
  if (platform.webhook_url !== undefined) {
    fields.push("webhook_url = ?")
    params.push(platform.webhook_url)
  }
  if (platform.webhook_secret !== undefined) {
    fields.push("webhook_secret = ?")
    params.push(platform.webhook_secret)
  }
  if (platform.is_active !== undefined) {
    fields.push("is_active = ?")
    params.push(platform.is_active)
  }

  if (fields.length === 0) return false

  fields.push("updated_at = strftime('%s', 'now') * 1000")
  params.push(id)

  const stmt = db.prepare(`UPDATE publish_platforms SET ${fields.join(', ')} WHERE id = ?`)
  const result = stmt.run(...params)

  return result.changes > 0
}

// 发布记录
export function savePublishRecord(record: Omit<PublishRecord, 'id' | 'created_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO publish_records (content_id, platform, platform_post_id, status, error_message, published_url, scheduled_at, published_at, retry_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    record.content_id,
    record.platform,
    record.platform_post_id,
    record.status,
    record.error_message,
    record.published_url,
    record.scheduled_at,
    record.published_at,
    record.retry_count
  )

  return result.lastInsertRowid as number
}

export function getPublishRecords(contentId?: number, platform?: string, limit: number = 20): PublishRecord[] {
  let query = `
    SELECT pr.*, gc.title as content_title
    FROM publish_records pr
    LEFT JOIN generated_contents gc ON pr.content_id = gc.id
    WHERE 1=1
  `
  const params: any[] = []

  if (contentId) {
    query += " AND pr.content_id = ?"
    params.push(contentId)
  }

  if (platform) {
    query += " AND pr.platform = ?"
    params.push(platform)
  }

  query += " ORDER BY pr.created_at DESC LIMIT ?"
  params.push(limit)

  return db.prepare(query).all(...params) as PublishRecord[]
}

export function updatePublishRecord(id: number, record: Partial<Omit<PublishRecord, 'id' | 'content_id' | 'platform' | 'created_at'>>): boolean {
  const fields: string[] = []
  const params: any[] = []

  if (record.platform_post_id !== undefined) {
    fields.push("platform_post_id = ?")
    params.push(record.platform_post_id)
  }
  if (record.status !== undefined) {
    fields.push("status = ?")
    params.push(record.status)
  }
  if (record.error_message !== undefined) {
    fields.push("error_message = ?")
    params.push(record.error_message)
  }
  if (record.published_url !== undefined) {
    fields.push("published_url = ?")
    params.push(record.published_url)
  }
  if (record.scheduled_at !== undefined) {
    fields.push("scheduled_at = ?")
    params.push(record.scheduled_at)
  }
  if (record.published_at !== undefined) {
    fields.push("published_at = ?")
    params.push(record.published_at)
  }
  if (record.retry_count !== undefined) {
    fields.push("retry_count = ?")
    params.push(record.retry_count)
  }

  if (fields.length === 0) return false

  params.push(id)

  const stmt = db.prepare(`UPDATE publish_records SET ${fields.join(', ')} WHERE id = ?`)
  const result = stmt.run(...params)

  return result.changes > 0
}

// 定时发布
export function saveScheduledPost(post: Omit<ScheduledPost, 'id' | 'created_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO scheduled_posts (content_id, platform, scheduled_time, status)
    VALUES (?, ?, ?, ?)
  `)

  const result = stmt.run(
    post.content_id,
    post.platform,
    post.scheduled_time,
    post.status
  )

  return result.lastInsertRowid as number
}

export function getScheduledPosts(status?: string, limit: number = 50): ScheduledPost[] {
  let query = `
    SELECT sp.*, gc.title as content_title
    FROM scheduled_posts sp
    LEFT JOIN generated_contents gc ON sp.content_id = gc.id
    WHERE 1=1
  `
  const params: any[] = []

  if (status) {
    query += " AND sp.status = ?"
    params.push(status)
  }

  query += " ORDER BY sp.scheduled_time ASC LIMIT ?"
  params.push(limit)

  return db.prepare(query).all(...params) as ScheduledPost[]
}

// 初始化数据库
initDatabase()

// 初始化预设模板
initAIConfigTemplates()

export default db
