/**
 * 测试飞书连接
 * 验证配置是否正确，并测试基本的读写操作
 */

require('dotenv').config({ path: '.env.local' })
const lark = require('@larksuiteoapi/node-sdk')

async function testConnection() {
  console.log('🔍 开始测试飞书连接...\n')

  // 1. 检查配置
  console.log('1️⃣ 检查环境变量配置...')
  const requiredVars = ['FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'FEISHU_BITABLE_APP_TOKEN']
  const missing = requiredVars.filter(v => !process.env[v] || process.env[v].startsWith('your_'))

  if (missing.length > 0) {
    console.error('   ❌ 缺少配置:', missing.join(', '))
    return
  }
  console.log('   ✅ 配置完整\n')

  // 2. 测试获取 token
  console.log('2️⃣ 测试获取访问令牌...')
  const client = new lark.Client({
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET,
    appType: lark.AppType.SelfBuild,
    domain: lark.Domain.Feishu,
  })

  try {
    const tokenRes = await client.auth.tenantAccessToken.internal({
      data: {
        app_id: process.env.FEISHU_APP_ID,
        app_secret: process.env.FEISHU_APP_SECRET,
      },
    })

    if (tokenRes.code === 0) {
      console.log('   ✅ 成功获取令牌')
      console.log(`   Token: ${tokenRes.tenant_access_token.substring(0, 20)}...`)
      console.log(`   有效期: ${tokenRes.expire} 秒\n`)
    } else {
      console.error('   ❌ 获取令牌失败:', tokenRes.msg)
      return
    }
  } catch (error) {
    console.error('   ❌ 请求异常:', error.message)
    return
  }

  // 3. 测试读取表格
  console.log('3️⃣ 测试读取多维表格...')
  const tableId = process.env.FEISHU_TABLE_BATCHES

  if (!tableId || tableId.startsWith('your_')) {
    console.log('   ⏭️  跳过：未配置表ID\n')
  } else {
    try {
      const listRes = await client.bitable.appTableRecord.list({
        path: {
          app_token: process.env.FEISHU_BITABLE_APP_TOKEN,
          table_id: tableId,
        },
        params: {
          page_size: 5,
        },
      })

      if (listRes.code === 0) {
        console.log('   ✅ 成功读取表格')
        console.log(`   表格记录数: ${listRes.data.total || 0}`)
        console.log(`   当前页记录: ${listRes.data.items?.length || 0}\n`)
      } else {
        console.error('   ❌ 读取失败:', listRes.msg, '\n')
      }
    } catch (error) {
      console.error('   ❌ 请求异常:', error.message, '\n')
    }
  }

  // 4. 总结
  console.log('✨ 测试完成！')
  console.log('\n📝 下一步:')
  console.log('   1. 如果测试通过，可以运行数据导入脚本')
  console.log('   2. 运行: node scripts/import-to-feishu.js')
  console.log('   3. 导入完成后，在飞书中验证数据')
}

testConnection().catch(error => {
  console.error('💥 测试失败:', error)
  process.exit(1)
})
