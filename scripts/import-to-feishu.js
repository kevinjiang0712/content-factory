/**
 * 飞书数据导入脚本
 * 将导出的 JSON 数据导入到飞书多维表格
 *
 * 使用方法：
 * 1. 确保已配置好 .env.local 中的飞书相关配置
 * 2. 运行: node scripts/import-to-feishu.js
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const lark = require('@larksuiteoapi/node-sdk')

// 配置检查
const requiredEnvVars = [
  'FEISHU_APP_ID',
  'FEISHU_APP_SECRET',
  'FEISHU_BITABLE_APP_TOKEN',
  'FEISHU_TABLE_BATCHES',
  'FEISHU_TABLE_ARTICLES',
  'FEISHU_TABLE_WORD_CLOUD',
  'FEISHU_TABLE_INSIGHTS',
  'FEISHU_TABLE_AI_CONFIGS',
  'FEISHU_TABLE_AI_TEMPLATES',
  'FEISHU_TABLE_AI_TEST_LOGS',
]

const missingVars = requiredEnvVars.filter(v => !process.env[v] || process.env[v] === 'your_app_id_here' || process.env[v] === 'your_app_secret_here' || process.env[v].startsWith('your_'))

if (missingVars.length > 0) {
  console.error('❌ 缺少必要的环境变量配置:')
  missingVars.forEach(v => console.error(`   - ${v}`))
  console.error('\n请在 .env.local 文件中配置这些变量')
  process.exit(1)
}

// 创建飞书客户端
const client = new lark.Client({
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
})

const bitableAppToken = process.env.FEISHU_BITABLE_APP_TOKEN
const exportDir = path.join(__dirname, '../data/export')

// 表映射配置
const tableMappings = [
  {
    name: '分析批次',
    jsonFile: '1-分析批次.json',
    tableId: process.env.FEISHU_TABLE_BATCHES,
    mapper: (row) => ({
      '批次ID': row.batch_id,
      '关键词': row.keyword,
      '时间范围': row.time_range,
      '文章数量': row.article_count,
      '总文章数': row.total_articles,
      '创建时间': row.created_at,
    }),
  },
  {
    name: '文章',
    jsonFile: '2-文章.json',
    tableId: process.env.FEISHU_TABLE_ARTICLES,
    mapper: (row) => ({
      '标题': row.title,
      '内容': row.content || '',
      '点赞数': row.praise,
      '阅读数': row.read_count,
      '互动率': row.interaction_rate,
      '公众号名称': row.wx_name || '',
      '文章链接': row.url || '',
      '短链接': row.short_link || '',
      '发布时间': row.publish_time || null,
      // 注意：批次ID关联需要在飞书表格中手动配置或使用公式
    }),
  },
  {
    name: '词云',
    jsonFile: '3-词云.json',
    tableId: process.env.FEISHU_TABLE_WORD_CLOUD,
    mapper: (row) => ({
      '词汇': row.word,
      '出现次数': row.count,
      '排序序号': row.rank_index,
    }),
  },
  {
    name: '选题洞察',
    jsonFile: '4-选题洞察.json',
    tableId: process.env.FEISHU_TABLE_INSIGHTS,
    mapper: (row) => ({
      '类型': row.type,
      '标题': row.title,
      '建议标题': row.suggested_title,
      '内容方向': row.direction || '',
      '目标受众': row.audience || '',
      '切入角度': row.angle || '',
      '分析理由': row.reasoning || '',
      '排序序号': row.rank_index,
      '原文标题': row.source_article_title || '',
      '原文链接': row.source_article_url || '',
      '原文发布时间': row.source_article_publish_time || '',
      '原文公众号': row.source_article_wx_name || '',
      '创建时间': row.created_at || '',
    }),
  },
  {
    name: 'AI配置',
    jsonFile: '5-AI配置.json',
    tableId: process.env.FEISHU_TABLE_AI_CONFIGS,
    mapper: (row) => ({
      '配置名称': row.config_name,
      '服务商': row.provider,
      'API密钥': row.api_key,
      'API地址': row.api_base_url,
      '摘要模型': row.model_summarize,
      '洞察模型': row.model_insights,
      '摘要提示词': row.prompt_summarize,
      '洞察提示词': row.prompt_insights,
      '是否预设': row.is_preset === 1,
      '是否激活': row.is_active === 1,
      '最后使用时间': row.last_used_at || null,
      '创建时间': row.created_at,
      '更新时间': row.updated_at,
    }),
  },
  {
    name: 'AI配置模板',
    jsonFile: '6-AI配置模板.json',
    tableId: process.env.FEISHU_TABLE_AI_TEMPLATES,
    mapper: (row) => ({
      '模板名称': row.template_name,
      '服务商': row.provider,
      'API地址': row.api_base_url,
      '摘要模型': row.model_summarize,
      '洞察模型': row.model_insights,
      '描述': row.description || '',
      '是否免费': row.is_free === 1,
      '排序': row.sort_order,
    }),
  },
  {
    name: 'AI测试日志',
    jsonFile: '7-AI测试日志.json',
    tableId: process.env.FEISHU_TABLE_AI_TEST_LOGS,
    mapper: (row) => ({
      '测试类型': row.test_type,
      '是否成功': row.is_success === 1,
      '错误信息': row.error_message || '',
      '响应时间': row.response_time || 0,
      '测试时间': row.tested_at,
    }),
  },
]

// 批量创建记录（每次最多500条）
async function batchCreateRecords(tableId, records, batchSize = 100) {
  const batches = []
  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize))
  }

  let successCount = 0
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    try {
      const res = await client.bitable.appTableRecord.batchCreate({
        path: {
          app_token: bitableAppToken,
          table_id: tableId,
        },
        data: {
          records: batch.map(fields => ({ fields })),
        },
      })

      if (res.code === 0) {
        successCount += batch.length
        process.stdout.write(`   进度: ${successCount}/${records.length}\r`)
      } else {
        console.error(`\n   ⚠️  批次 ${i + 1} 失败: ${res.msg}`)
      }
    } catch (error) {
      console.error(`\n   ❌ 批次 ${i + 1} 异常:`, error.message)
    }

    // 避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return successCount
}

// 主函数
async function main() {
  console.log('🚀 开始导入数据到飞书多维表格...\n')

  let totalImported = 0

  for (const mapping of tableMappings) {
    const jsonPath = path.join(exportDir, mapping.jsonFile)

    // 检查文件是否存在
    if (!fs.existsSync(jsonPath)) {
      console.log(`⏭️  跳过 ${mapping.name}: 文件不存在`)
      continue
    }

    try {
      // 读取 JSON 数据
      const rawData = fs.readFileSync(jsonPath, 'utf-8')
      const data = JSON.parse(rawData)

      if (data.length === 0) {
        console.log(`⏭️  跳过 ${mapping.name}: 无数据`)
        continue
      }

      console.log(`📦 导入 ${mapping.name} (${data.length} 条)`)

      // 转换数据格式
      const records = data.map(mapping.mapper)

      // 批量导入
      const imported = await batchCreateRecords(mapping.tableId, records)

      console.log(`   ✅ 成功导入 ${imported}/${data.length} 条\n`)
      totalImported += imported

    } catch (error) {
      console.error(`   ❌ 导入失败:`, error.message, '\n')
    }
  }

  console.log(`\n✨ 导入完成！共导入 ${totalImported} 条记录`)
  console.log('\n📝 注意事项:')
  console.log('   1. 请在飞书表格中检查数据是否正确')
  console.log('   2. 关联字段（如批次ID）需要手动配置')
  console.log('   3. 日期时间字段可能需要调整格式')
}

// 运行
main().catch(error => {
  console.error('💥 导入失败:', error)
  process.exit(1)
})
