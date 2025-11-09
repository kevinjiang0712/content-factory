/**
 * 硅基流动 (SiliconFlow) 图片生成客户端
 * 用于调用可灵 (Kolors) 等图片生成模型
 */

import fs from 'fs'
import path from 'path'
import { NEGATIVE_PROMPT } from './prompt-generator'

// 图片生成配置接口
export interface ImageGenerationConfig {
  prompt: string
  negative_prompt?: string
  size?: '1024x1024' | '512x512' | '768x768'
  n?: number  // 生成数量 1-4
  step?: number  // 生成步长 10-50
  guidance_scale?: number  // 提示词引导强度 1-20
  seed?: number  // 随机种子
}

// 图片生成结果接口
export interface ImageGenerationResult {
  url: string
  local_path?: string
  revised_prompt?: string
  success: boolean
  error?: string
  generation_time?: number
}

// SiliconFlow API 响应
interface SiliconFlowResponse {
  created: number
  data: Array<{
    url: string
    b64_json?: string
    revised_prompt?: string
  }>
}

/**
 * SiliconFlow 图片生成客户端
 */
export class SiliconFlowImageClient {
  private apiKey: string
  private apiBase: string
  private model: string

  constructor(apiKey?: string, apiBase?: string, model?: string) {
    this.apiKey = apiKey || process.env.SILICONFLOW_API_KEY || ''
    this.apiBase = apiBase || process.env.SILICONFLOW_API_BASE || 'https://api.siliconflow.cn/v1'
    this.model = model || process.env.SILICONFLOW_IMAGE_MODEL || 'Kwai-Kolors/Kolors'

    if (!this.apiKey) {
      throw new Error('SiliconFlow API Key 未配置')
    }
  }

  /**
   * 生成图片
   */
  async generateImage(config: ImageGenerationConfig): Promise<ImageGenerationResult> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.apiBase}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: config.prompt,
          size: config.size || '1024x1024',
          n: config.n || 1,
          response_format: 'url',
          extra_body: {
            negative_prompt: config.negative_prompt || NEGATIVE_PROMPT,
            step: config.step || 20,
            guidance_scale: config.guidance_scale || 7.5,
            ...(config.seed && { seed: config.seed })
          }
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('SiliconFlow API 错误:', error)

        return {
          url: '',
          success: false,
          error: `API 请求失败: ${response.status} ${response.statusText}`,
          generation_time: Date.now() - startTime
        }
      }

      const data: SiliconFlowResponse = await response.json()

      if (!data.data || data.data.length === 0) {
        return {
          url: '',
          success: false,
          error: 'API 返回数据为空',
          generation_time: Date.now() - startTime
        }
      }

      const imageUrl = data.data[0].url
      const revisedPrompt = data.data[0].revised_prompt

      return {
        url: imageUrl,
        revised_prompt: revisedPrompt,
        success: true,
        generation_time: Date.now() - startTime
      }

    } catch (error) {
      console.error('图片生成失败:', error)

      return {
        url: '',
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        generation_time: Date.now() - startTime
      }
    }
  }

  /**
   * 下载图片到本地
   */
  async downloadImage(imageUrl: string, filename?: string): Promise<string | null> {
    try {
      // 创建保存目录
      const saveDir = path.join(process.cwd(), 'public', 'images', 'generated')
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true })
      }

      // 生成文件名
      const fileName = filename || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`
      const filePath = path.join(saveDir, fileName)

      // 下载图片
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // 保存到本地
      fs.writeFileSync(filePath, buffer)

      // 返回相对路径（用于前端访问）
      return `/images/generated/${fileName}`

    } catch (error) {
      console.error('下载图片失败:', error)
      return null
    }
  }

  /**
   * 生成并下载图片（一步完成）
   */
  async generateAndDownload(config: ImageGenerationConfig, filename?: string): Promise<ImageGenerationResult> {
    // 先生成图片
    const result = await this.generateImage(config)

    if (!result.success || !result.url) {
      return result
    }

    // 下载到本地
    const localPath = await this.downloadImage(result.url, filename)

    return {
      ...result,
      local_path: localPath || undefined
    }
  }

  /**
   * 批量生成图片
   */
  async generateBatch(configs: ImageGenerationConfig[]): Promise<ImageGenerationResult[]> {
    const results: ImageGenerationResult[] = []

    // 并发生成（最多同时3个请求）
    const batchSize = 3
    for (let i = 0; i < configs.length; i += batchSize) {
      const batch = configs.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(config => this.generateAndDownload(config))
      )
      results.push(...batchResults)

      // 避免请求过快，稍微延迟
      if (i + batchSize < configs.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return results
  }

  /**
   * 重试机制的生成
   */
  async generateWithRetry(
    config: ImageGenerationConfig,
    maxRetries: number = 3
  ): Promise<ImageGenerationResult> {
    let lastError: string = ''

    for (let i = 0; i < maxRetries; i++) {
      const result = await this.generateAndDownload(config)

      if (result.success) {
        return result
      }

      lastError = result.error || '未知错误'

      // 如果不是最后一次，等待后重试
      if (i < maxRetries - 1) {
        console.log(`生成失败，${i + 1}/${maxRetries} 次重试...`)
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
      }
    }

    // 所有重试都失败
    return {
      url: '',
      success: false,
      error: `重试 ${maxRetries} 次后仍失败: ${lastError}`
    }
  }
}

/**
 * 创建客户端实例（单例）
 */
let clientInstance: SiliconFlowImageClient | null = null

export function getSiliconFlowClient(
  apiKey?: string,
  apiBase?: string,
  model?: string
): SiliconFlowImageClient {
  if (!clientInstance) {
    clientInstance = new SiliconFlowImageClient(apiKey, apiBase, model)
  }
  return clientInstance
}

/**
 * 快捷函数：生成单张图片
 */
export async function generateImage(
  prompt: string,
  options?: Partial<ImageGenerationConfig>
): Promise<ImageGenerationResult> {
  const client = getSiliconFlowClient()
  return client.generateAndDownload({
    prompt,
    ...options
  })
}

/**
 * 快捷函数：批量生成图片
 */
export async function generateImages(
  prompts: string[],
  options?: Partial<ImageGenerationConfig>
): Promise<ImageGenerationResult[]> {
  const client = getSiliconFlowClient()
  const configs = prompts.map(prompt => ({
    prompt,
    ...options
  }))
  return client.generateBatch(configs)
}

/**
 * 获取占位图路径
 */
export function getPlaceholderImage(): string {
  return '/images/placeholder.png'
}

/**
 * 创建占位图（如果不存在）
 */
export function ensurePlaceholderImage(): void {
  const placeholderPath = path.join(process.cwd(), 'public', 'images', 'placeholder.png')

  if (!fs.existsSync(placeholderPath)) {
    // 创建目录
    const dir = path.dirname(placeholderPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // 创建一个简单的灰色占位图（使用 SVG）
    const svgContent = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="#f0f0f0"/>
        <text x="512" y="512" font-size="48" text-anchor="middle" fill="#999">
          图片生成失败
        </text>
        <text x="512" y="580" font-size="32" text-anchor="middle" fill="#999">
          点击重新生成
        </text>
      </svg>
    `

    // 注意：这里创建的是 SVG，实际使用时可能需要转换为 PNG
    // 暂时先用 SVG，后续可以用 sharp 库转换
    fs.writeFileSync(placeholderPath.replace('.png', '.svg'), svgContent)
  }
}
