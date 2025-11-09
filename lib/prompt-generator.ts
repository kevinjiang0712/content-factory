/**
 * AI 图像提示词生成系统
 * 根据文章内容智能生成图片配图方案和提示词
 */

// 提示词模板
const PROMPT_TEMPLATES = {
  // 1. 人物场景类
  person: {
    base: "{主体人物}，{动作}，{环境}，{氛围}，{光线}，高清摄影，细节丰富",
    example: "一位专业的产品经理，在白板前讲解用户需求，现代办公室环境，专业严谨的氛围，自然光，高清摄影，细节丰富"
  },

  // 2. 数据可视化类
  data: {
    base: "{数据类型}，{图表形式}，{主题}，{风格}，科技感，蓝色调",
    example: "用户增长数据，柱状图和折线图组合，大屏展示，现代UI设计，科技感，蓝色调，专业商务风格"
  },

  // 3. 抽象概念类
  concept: {
    base: "{概念视觉化}，{象征元素}，{风格}，{氛围}",
    example: "协作概念的视觉化，拼图拼接在一起象征团队合作，扁平插画风格，温暖明亮的氛围"
  },

  // 4. 流程/步骤类
  process: {
    base: "{流程展示}，{步骤元素}，信息图表风格，清晰明了",
    example: "产品开发流程展示，从需求到上线的四个步骤，信息图表风格，现代简约，清晰明了"
  },

  // 5. 环境/氛围类
  atmosphere: {
    base: "{场景}，{氛围}，{光线}，{色调}，电影感",
    example: "宁静的工作空间，专注的氛围，柔和的自然光，温暖色调，电影感"
  }
}

// 风格适配器
const STYLE_MODIFIERS = {
  '专业严谨': '现代简约，专业商务风格，高清摄影，冷静色调',
  '轻松活泼': '明亮温馨，生活气息，自然光线，暖色调',
  '故事叙述': '电影感，叙事性，情感丰富，戏剧化光影',
  '数据分析': '科技感，蓝色调，数据可视化，UI界面清晰',
  '创新思路': '未来感，创意设计，抽象艺术，色彩丰富'
}

// 负面提示词（通用）
export const NEGATIVE_PROMPT = [
  // 质量问题
  '模糊', '变形', '低质量', '噪点',
  // 不需要的元素
  '水印', '文字', 'logo', '签名',
  // 畸形问题
  '多余的肢体', '变形的手指', '错误的透视', '扭曲',
  // 其他
  '丑陋', '恐怖', '血腥'
].join('，')

// 配图分析结果接口
export interface ImagePlacement {
  paragraphIndex: number
  paragraphSummary: string
  sceneDescription: string
  visualKeywords: string[]
  emotion: string
  reasoning: string
  prompt?: string
}

export interface ImageAnalysisResult {
  totalParagraphs: number
  suggestedImageCount: number
  placements: ImagePlacement[]
}

/**
 * 生成分析文章配图需求的 Prompt
 */
export function getAnalysisPrompt(article: string, style: string): string {
  return `你是一个专业的内容配图分析专家。

# 任务
分析文章内容，为最适合配图的段落生成图像描述。

# 分析标准
适合配图的段落应具备以下特征之一：
1. 包含具体的场景描述（环境、人物、动作）
2. 描述了某个概念、流程或数据
3. 涉及情感或氛围的渲染
4. 是段落的核心观点或关键论述

不适合配图的段落：
- 纯文字说明、定义
- 过于抽象的理论
- 过渡段落

# 文章内容
${article}

# 文章风格
${style}

# 返回格式（JSON）
请返回以下格式的 JSON 对象，不要包含任何其他内容：
{
  "totalParagraphs": 8,
  "suggestedImageCount": 3,
  "placements": [
    {
      "paragraphIndex": 2,
      "paragraphSummary": "这段描述了产品经理如何与团队沟通",
      "sceneDescription": "产品经理在白板前向团队讲解需求",
      "visualKeywords": ["产品经理", "白板", "团队会议", "办公室"],
      "emotion": "专业、严谨、协作",
      "reasoning": "这段有明确的人物、场景和动作，适合配图"
    }
  ]
}

注意：
- 建议配图数量：2-5张
- 平均每 300-500字 配1张图
- 优先选择文章前半部分和核心论述段落
- paragraphIndex 从 0 开始计数
- 只返回 JSON，不要有其他说明文字`
}

/**
 * 判断场景类型
 */
function determineSceneType(visualKeywords: string[]): keyof typeof PROMPT_TEMPLATES {
  // 数据类
  if (visualKeywords.some(kw => ['数据', '图表', '统计', '分析', '指标'].includes(kw))) {
    return 'data'
  }

  // 人物类
  if (visualKeywords.some(kw => ['人', '团队', '用户', '经理', '员工', '客户'].includes(kw))) {
    return 'person'
  }

  // 流程类
  if (visualKeywords.some(kw => ['流程', '步骤', '阶段', '过程'].includes(kw))) {
    return 'process'
  }

  // 环境氛围类
  if (visualKeywords.some(kw => ['环境', '空间', '场景', '氛围'].includes(kw))) {
    return 'atmosphere'
  }

  // 默认概念类
  return 'concept'
}

/**
 * 生成单张图片的提示词
 */
export function generateImagePrompt(
  placement: ImagePlacement,
  articleStyle: string
): string {
  const {
    sceneDescription,
    visualKeywords,
    emotion
  } = placement

  // 1. 确定场景类型
  const sceneType = determineSceneType(visualKeywords)

  // 2. 获取风格修饰
  const styleModifier = STYLE_MODIFIERS[articleStyle as keyof typeof STYLE_MODIFIERS] || STYLE_MODIFIERS['专业严谨']

  // 3. 组合提示词
  const basePrompt = sceneDescription
  const emotionModifier = emotion ? `${emotion}的氛围` : ''

  // 4. 最终提示词
  return `${basePrompt}，${emotionModifier}，${styleModifier}，高清细节，专业摄影作品`
}

/**
 * 批量生成所有图片的提示词
 */
export function generateAllPrompts(
  analysis: ImageAnalysisResult,
  articleStyle: string
): ImagePlacement[] {
  return analysis.placements.map(placement => ({
    ...placement,
    prompt: generateImagePrompt(placement, articleStyle)
  }))
}

/**
 * 提示词质量检查
 */
export function validatePrompt(prompt: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // 1. 长度检查
  if (prompt.length < 20) {
    errors.push('提示词太短，至少需要20个字符')
  }
  if (prompt.length > 500) {
    errors.push('提示词太长，不超过500个字符')
  }

  // 2. 必要元素检查
  const hasSubject = /[人物|团队|用户|数据|图表|场景|环境]/.test(prompt)
  if (!hasSubject) {
    errors.push('缺少主体元素（人物、数据、场景等）')
  }

  const hasStyle = /[风格|感|调|氛围]/.test(prompt)
  if (!hasStyle) {
    errors.push('缺少风格描述')
  }

  const hasQuality = /[高清|细节|专业|清晰]/.test(prompt)
  if (!hasQuality) {
    errors.push('缺少质量描述')
  }

  // 3. 禁用词检查
  const forbiddenWords = ['血腥', '暴力', '色情', '政治', '恐怖']
  const hasForbidden = forbiddenWords.some(word => prompt.includes(word))
  if (hasForbidden) {
    errors.push('包含禁用词汇')
  }

  // 4. 中文为主
  const chineseRatio = (prompt.match(/[\u4e00-\u9fa5]/g) || []).length / prompt.length
  if (chineseRatio < 0.5) {
    errors.push('中文比例太低，建议使用中文描述')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 优化提示词
 */
export function optimizePrompt(prompt: string): string {
  let optimized = prompt

  // 添加质量描述
  if (!optimized.includes('高清') && !optimized.includes('清晰')) {
    optimized += '，高清细节'
  }

  // 确保有风格描述
  if (!optimized.includes('风格') && !optimized.includes('氛围')) {
    optimized += '，专业风格'
  }

  // 去除多余的逗号和空格
  optimized = optimized.replace(/，{2,}/g, '，').trim()

  return optimized
}

/**
 * 解析 AI 返回的分析结果
 */
export function parseAnalysisResult(aiResponse: string): ImageAnalysisResult | null {
  try {
    // 尝试提取 JSON 部分
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('无法从响应中提取 JSON')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])

    // 验证必要字段
    if (!parsed.totalParagraphs || !parsed.suggestedImageCount || !parsed.placements) {
      console.error('分析结果缺少必要字段')
      return null
    }

    return parsed as ImageAnalysisResult
  } catch (error) {
    console.error('解析分析结果失败:', error)
    return null
  }
}

/**
 * 获取默认配图方案（当 AI 分析失败时使用）
 */
export function getDefaultImagePlacement(article: string): ImageAnalysisResult {
  // 简单按段落分割
  const paragraphs = article.split('\n\n').filter(p => p.trim().length > 50)
  const totalParagraphs = paragraphs.length

  // 每 3-4 个段落配一张图
  const suggestedImageCount = Math.min(5, Math.max(2, Math.floor(totalParagraphs / 3)))

  // 平均分布
  const step = Math.floor(totalParagraphs / suggestedImageCount)
  const placements: ImagePlacement[] = []

  for (let i = 0; i < suggestedImageCount; i++) {
    const index = Math.min(step * (i + 1), totalParagraphs - 1)
    placements.push({
      paragraphIndex: index,
      paragraphSummary: paragraphs[index].substring(0, 50) + '...',
      sceneDescription: '相关场景插图',
      visualKeywords: ['场景', '内容'],
      emotion: '专业',
      reasoning: '根据段落位置自动分配'
    })
  }

  return {
    totalParagraphs,
    suggestedImageCount,
    placements
  }
}
