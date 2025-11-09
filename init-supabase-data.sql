-- 初始化 Supabase 数据库数据
-- 添加默认的 AI 配置

-- 插入默认 AI 配置
INSERT INTO ai_configs (
  config_name,
  provider,
  api_key,
  api_base_url,
  model_summarize,
  model_insights,
  prompt_summarize,
  prompt_insights,
  model_type,
  is_preset,
  is_active,
  last_used_at,
  created_at,
  updated_at
) VALUES (
  '默认 OpenAI 配置',
  'openai',
  'U2FsdGVkX1+8LJ5q7Y2mX8vF3w9hG2zK6pR1sN4tQ0uE7iV3mB5cD=' -- 这里是加密后的 API Key，需要在 Supabase 控制台中替换
  'https://openrouter.ai/api/v1',
  'openai/gpt-4o',
  'openai/gpt-4o',
  '请将以下文章内容总结为简洁的摘要，突出主要观点和关键信息。',
  '请基于以下文章内容，分析出有价值的选题洞察，包括内容方向、目标受众、切入角度等。',
  'text',
  0,
  1,
  NULL,
  extract(epoch from now()) * 1000,
  extract(epoch from now()) * 1000
) ON CONFLICT DO NOTHING;

-- 插入一些预设模板
INSERT INTO ai_config_templates (
  template_name,
  provider,
  api_base_url,
  model_summarize,
  model_insights,
  description,
  is_free,
  sort_order
) VALUES
  (
    'GPT-4 快速分析',
    'openai',
    'https://api.openai.com/v1',
    'gpt-4o-mini',
    'gpt-4o',
    '适合快速分析和摘要，成本较低',
    0,
    1
  ),
  (
    'Claude 深度分析',
    'anthropic',
    'https://api.anthropic.com',
    'claude-3-haiku',
    'claude-3-5-sonnet',
    '深度分析，质量更高',
    0,
    2
  ),
  (
    'Gemini 免费分析',
    'google',
    'https://generativelanguage.googleapis.com/v1',
    'gemini-flash-1.5',
    'gemini-pro-1.5',
    'Google Gemini 免费方案',
    1,
    3
  ) ON CONFLICT DO NOTHING;