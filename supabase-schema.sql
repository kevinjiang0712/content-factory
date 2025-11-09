-- Content Factory 数据库结构
-- 从 SQLite 转换为 PostgreSQL
-- 生成时间: 2025-01-09

-- 1. 分析批次表
CREATE TABLE analysis_batches (
  id SERIAL PRIMARY KEY,
  batch_id TEXT UNIQUE NOT NULL,
  keyword TEXT NOT NULL,
  time_range INTEGER NOT NULL,
  article_count INTEGER NOT NULL,
  total_articles INTEGER NOT NULL,
  created_at BIGINT NOT NULL
);

-- 2. 文章表
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  batch_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  praise INTEGER NOT NULL,
  read_count INTEGER NOT NULL,
  interaction_rate REAL NOT NULL,
  wx_name TEXT,
  url TEXT,
  short_link TEXT,
  publish_time BIGINT,
  FOREIGN KEY (batch_id) REFERENCES analysis_batches(batch_id) ON DELETE CASCADE
);

-- 3. 词云表
CREATE TABLE word_cloud (
  id SERIAL PRIMARY KEY,
  batch_id TEXT NOT NULL,
  word TEXT NOT NULL,
  count INTEGER NOT NULL,
  rank_index INTEGER NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES analysis_batches(batch_id) ON DELETE CASCADE
);

-- 4. 选题洞察表
CREATE TABLE topic_insights (
  id SERIAL PRIMARY KEY,
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
);

-- 5. AI 配置表
CREATE TABLE ai_configs (
  id SERIAL PRIMARY KEY,
  config_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_base_url TEXT NOT NULL,
  model_summarize TEXT NOT NULL,
  model_insights TEXT NOT NULL,
  prompt_summarize TEXT NOT NULL,
  prompt_insights TEXT NOT NULL,
  model_type TEXT DEFAULT 'text',
  is_preset INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 0,
  last_used_at BIGINT,
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- 6. AI 配置模板表
CREATE TABLE ai_config_templates (
  id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_base_url TEXT NOT NULL,
  model_summarize TEXT NOT NULL,
  model_insights TEXT NOT NULL,
  description TEXT,
  is_free INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- 7. AI 测试日志表
CREATE TABLE ai_test_logs (
  id SERIAL PRIMARY KEY,
  config_id INTEGER,
  test_type TEXT NOT NULL,
  is_success INTEGER NOT NULL,
  error_message TEXT,
  response_time INTEGER,
  tested_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  FOREIGN KEY (config_id) REFERENCES ai_configs(id) ON DELETE CASCADE
);

-- 8. 生成内容表
CREATE TABLE generated_contents (
  id SERIAL PRIMARY KEY,
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
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  FOREIGN KEY (insight_id) REFERENCES topic_insights(id)
);

-- 9. 生成图片表
CREATE TABLE generated_images (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL,
  paragraph_index INTEGER,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  image_url TEXT NOT NULL,
  local_path TEXT,
  is_placeholder INTEGER DEFAULT 0,
  generation_time INTEGER,
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  FOREIGN KEY (content_id) REFERENCES generated_contents(id) ON DELETE CASCADE
);

-- 10. 发布平台表
CREATE TABLE publish_platforms (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL CHECK(platform IN ('wechat', 'xiaohongshu')),
  platform_name TEXT NOT NULL,
  app_id TEXT,
  app_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at BIGINT,
  webhook_url TEXT,
  webhook_secret TEXT,
  is_active INTEGER DEFAULT 1,
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- 11. 发布记录表
CREATE TABLE publish_records (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'success', 'failed', 'cancelled')),
  error_message TEXT,
  published_url TEXT,
  scheduled_at BIGINT,
  published_at BIGINT,
  retry_count INTEGER DEFAULT 0,
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  FOREIGN KEY (content_id) REFERENCES generated_contents(id) ON DELETE CASCADE
);

-- 12. 发布模板表
CREATE TABLE publish_templates (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  template_name TEXT NOT NULL,
  title_template TEXT,
  content_template TEXT,
  image_rules TEXT,
  auto_tags INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- 13. 定时发布表
CREATE TABLE scheduled_posts (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  scheduled_time BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'published', 'failed', 'cancelled')),
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  FOREIGN KEY (content_id) REFERENCES generated_contents(id) ON DELETE CASCADE
);

-- ==================== 索引 ====================

-- articles 表索引
CREATE INDEX idx_articles_batch_id ON articles(batch_id);

-- word_cloud 表索引
CREATE INDEX idx_word_cloud_batch_id ON word_cloud(batch_id);

-- topic_insights 表索引
CREATE INDEX idx_topic_insights_batch_id ON topic_insights(batch_id);

-- analysis_batches 表索引
CREATE INDEX idx_batches_created_at ON analysis_batches(created_at);

-- ai_configs 表索引
CREATE INDEX idx_ai_configs_active ON ai_configs(is_active);
CREATE INDEX idx_ai_configs_provider ON ai_configs(provider);
CREATE INDEX idx_ai_configs_model_type ON ai_configs(model_type);

-- ai_test_logs 表索引
CREATE INDEX idx_ai_test_logs_config ON ai_test_logs(config_id);

-- generated_contents 表索引
CREATE INDEX idx_generated_contents_insight ON generated_contents(insight_id);
CREATE INDEX idx_generated_contents_content_source ON generated_contents(content_source);
CREATE INDEX idx_generated_contents_created_at ON generated_contents(created_at DESC);

-- generated_images 表索引
CREATE INDEX idx_generated_images_content ON generated_images(content_id);

-- publish_records 表索引
CREATE INDEX idx_publish_records_content_id ON publish_records(content_id);
CREATE INDEX idx_publish_records_platform ON publish_records(platform);
CREATE INDEX idx_publish_records_status ON publish_records(status);

-- scheduled_posts 表索引
CREATE INDEX idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);

-- publish_platforms 表索引
CREATE INDEX idx_publish_platforms_platform ON publish_platforms(platform);

-- ==================== 完成 ====================
-- 数据库结构创建完成
-- 共 13 张表，24 个索引
