/**
 * 飞书多维表格客户端
 */

// @ts-ignore - 可选依赖，仅在使用飞书功能时需要
import * as lark from '@larksuiteoapi/node-sdk'

// 从环境变量读取配置
const appId = process.env.FEISHU_APP_ID || ''
const appSecret = process.env.FEISHU_APP_SECRET || ''
const bitableAppToken = process.env.FEISHU_BITABLE_APP_TOKEN || ''

// 表ID映射
export const TABLES = {
  BATCHES: process.env.FEISHU_TABLE_BATCHES || '',
  ARTICLES: process.env.FEISHU_TABLE_ARTICLES || '',
  WORD_CLOUD: process.env.FEISHU_TABLE_WORD_CLOUD || '',
  INSIGHTS: process.env.FEISHU_TABLE_INSIGHTS || '',
  AI_CONFIGS: process.env.FEISHU_TABLE_AI_CONFIGS || '',
  AI_TEMPLATES: process.env.FEISHU_TABLE_AI_TEMPLATES || '',
  AI_TEST_LOGS: process.env.FEISHU_TABLE_AI_TEST_LOGS || '',
}

// 创建飞书客户端
export const feishuClient = new lark.Client({
  appId,
  appSecret,
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
})

// 获取 tenant_access_token
let cachedToken: string | null = null
let tokenExpireTime = 0

export async function getTenantAccessToken(): Promise<string> {
  const now = Date.now()

  // 如果缓存的 token 还有效，直接返回
  if (cachedToken && now < tokenExpireTime) {
    return cachedToken
  }

  // 获取新的 token
  const res = await feishuClient.auth.tenantAccessToken.internal({
    data: {
      app_id: appId,
      app_secret: appSecret,
    },
  })

  if (res.code !== 0) {
    throw new Error(`获取飞书 token 失败: ${res.msg}`)
  }

  cachedToken = res.tenant_access_token || ''
  // 提前 5 分钟刷新 token
  tokenExpireTime = now + (res.expire - 300) * 1000

  return cachedToken || ''
}

// 多维表格操作封装
export class BitableAPI {
  private appToken: string
  private tableId: string

  constructor(tableId: string) {
    this.appToken = bitableAppToken
    this.tableId = tableId
  }

  /**
   * 创建记录
   */
  async createRecord(fields: Record<string, any>) {
    await getTenantAccessToken()

    const res = await feishuClient.bitable.appTableRecord.create({
      path: {
        app_token: this.appToken,
        table_id: this.tableId,
      },
      data: {
        fields,
      },
    })

    if (res.code !== 0) {
      throw new Error(`创建记录失败: ${res.msg}`)
    }

    return res.data?.record
  }

  /**
   * 批量创建记录
   */
  async batchCreateRecords(records: Array<{ fields: Record<string, any> }>) {
    await getTenantAccessToken()

    const res = await feishuClient.bitable.appTableRecord.batchCreate({
      path: {
        app_token: this.appToken,
        table_id: this.tableId,
      },
      data: {
        records,
      },
    })

    if (res.code !== 0) {
      throw new Error(`批量创建记录失败: ${res.msg}`)
    }

    return res.data?.records
  }

  /**
   * 查询记录
   */
  async listRecords(params?: {
    filter?: string
    sort?: string
    page_size?: number
    page_token?: string
  }) {
    await getTenantAccessToken()

    const res = await feishuClient.bitable.appTableRecord.list({
      path: {
        app_token: this.appToken,
        table_id: this.tableId,
      },
      params: {
        page_size: params?.page_size || 100,
        page_token: params?.page_token,
        filter: params?.filter,
        sort: params?.sort,
      },
    })

    if (res.code !== 0) {
      throw new Error(`查询记录失败: ${res.msg}`)
    }

    return {
      items: res.data?.items || [],
      hasMore: res.data?.has_more || false,
      pageToken: res.data?.page_token,
      total: res.data?.total || 0,
    }
  }

  /**
   * 更新记录
   */
  async updateRecord(recordId: string, fields: Record<string, any>) {
    await getTenantAccessToken()

    const res = await feishuClient.bitable.appTableRecord.update({
      path: {
        app_token: this.appToken,
        table_id: this.tableId,
        record_id: recordId,
      },
      data: {
        fields,
      },
    })

    if (res.code !== 0) {
      throw new Error(`更新记录失败: ${res.msg}`)
    }

    return res.data?.record
  }

  /**
   * 删除记录
   */
  async deleteRecord(recordId: string) {
    await getTenantAccessToken()

    const res = await feishuClient.bitable.appTableRecord.delete({
      path: {
        app_token: this.appToken,
        table_id: this.tableId,
        record_id: recordId,
      },
    })

    if (res.code !== 0) {
      throw new Error(`删除记录失败: ${res.msg}`)
    }

    return true
  }
}

// 导出各表的 API 实例
export const batchesTable = new BitableAPI(TABLES.BATCHES)
export const articlesTable = new BitableAPI(TABLES.ARTICLES)
export const wordCloudTable = new BitableAPI(TABLES.WORD_CLOUD)
export const insightsTable = new BitableAPI(TABLES.INSIGHTS)
export const aiConfigsTable = new BitableAPI(TABLES.AI_CONFIGS)
export const aiTemplatesTable = new BitableAPI(TABLES.AI_TEMPLATES)
export const aiTestLogsTable = new BitableAPI(TABLES.AI_TEST_LOGS)
