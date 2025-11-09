/**
 * 初始化 Supabase 数据库
 * 添加默认的 AI 配置数据
 */

import { supabase } from '../lib/supabase'
import { encryptApiKey } from '../lib/crypto'

async function initializeDatabase() {
  console.log('🚀 开始初始化 Supabase 数据库...')

  try {
    // 检查是否已有 AI 配置
    const { count: existingConfigs } = await supabase
      .from('ai_configs')
      .select('*', { count: 'exact', head: true })

    if (existingConfigs && existingConfigs > 0) {
      console.log('✅ 数据库已有 AI 配置，跳过初始化')
      return
    }

    // 获取环境变量中的配置
    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL
    const modelSummarize = process.env.OPENAI_MODEL_SUMMARIZE || 'openai/gpt-4o'
    const modelInsights = process.env.OPENAI_MODEL_INSIGHTS || 'openai/gpt-4o'

    if (!apiKey || !baseUrl) {
      throw new Error('缺少必要的环境变量：OPENAI_API_KEY 或 OPENAI_BASE_URL')
    }

    // 加密 API Key
    const encryptedKey = encryptApiKey(apiKey)

    // 创建默认 AI 配置
    const { error: configError } = await supabase
      .from('ai_configs')
      .insert({
        config_name: '默认 OpenAI 配置',
        provider: 'openai',
        api_key: encryptedKey,
        api_base_url: baseUrl,
        model_summarize: modelSummarize,
        model_insights: modelInsights,
        prompt_summarize: '请将以下文章内容总结为简洁的摘要，突出主要观点和关键信息。',
        prompt_insights: '请基于以下文章内容，分析出有价值的选题洞察，包括内容方向、目标受众、切入角度等。',
        is_preset: 0,
        is_active: 1,
        last_used_at: null,
        created_at: Date.now(),
        updated_at: Date.now()
      })

    if (configError) {
      console.error('❌ 创建 AI 配置失败:', configError)
      throw configError
    }

    console.log('✅ 成功创建默认 AI 配置')

    // 创建一些预设模板
    const templates = [
      {
        template_name: 'GPT-4 快速分析',
        provider: 'openai',
        api_base_url: 'https://api.openai.com/v1',
        model_summarize: 'gpt-4o-mini',
        model_insights: 'gpt-4o',
        description: '适合快速分析和摘要，成本较低',
        is_free: 0,
        sort_order: 1
      },
      {
        template_name: 'Claude 深度分析',
        provider: 'anthropic',
        api_base_url: 'https://api.anthropic.com',
        model_summarize: 'claude-3-haiku',
        model_insights: 'claude-3-5-sonnet',
        description: '深度分析，质量更高',
        is_free: 0,
        sort_order: 2
      },
      {
        template_name: 'Gemini 免费分析',
        provider: 'google',
        api_base_url: 'https://generativelanguage.googleapis.com/v1',
        model_summarize: 'gemini-flash-1.5',
        model_insights: 'gemini-pro-1.5',
        description: 'Google Gemini 免费方案',
        is_free: 1,
        sort_order: 3
      }
    ]

    for (const template of templates) {
      const { error: templateError } = await supabase
        .from('ai_config_templates')
        .insert(template)

      if (templateError) {
        console.error(`❌ 创建模板 ${template.template_name} 失败:`, templateError)
      } else {
        console.log(`✅ 成功创建模板: ${template.template_name}`)
      }
    }

    console.log('🎉 数据库初始化完成！')

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase()
}

export { initializeDatabase }