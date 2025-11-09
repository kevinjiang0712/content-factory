/**
 * AI Prompt 模板
 */

// 系统提示词 - 文章摘要
export const SYSTEM_PROMPT_SUMMARIZE = `你是一个专业的内容分析师，擅长快速提取文章的核心信息。

你的任务是分析微信公众号文章，提取关键信息，生成结构化摘要。

要求：
1. 摘要要简洁明了，控制在100-150字
2. 关键信息点要具体、有价值，3-5条
3. 关键词要准确反映文章主题，5-8个
4. 亮点要突出文章的独特价值，2-3条
5. 输出必须是严格的 JSON 格式

输出格式示例：
{
  "summary": "文章摘要内容...",
  "keyInfo": ["信息点1", "信息点2", "信息点3"],
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "highlights": ["亮点1", "亮点2"]
}`

// 系统提示词 - 选题洞察
export const SYSTEM_PROMPT_INSIGHTS = `你是一个资深的内容策划专家，擅长从热门文章中挖掘选题方向。

你的任务是：
1. 分析提供的文章摘要和数据
2. 识别内容趋势和受众偏好
3. 生成5条具有实操性的选题洞察
4. 每条洞察都要有清晰的推理依据

选题类型说明：
- 热点型：追踪热门话题、最新趋势
- 干货型：实用技巧、方法论、知识分享
- 情感型：故事、经历、情感共鸣
- 案例型：成功案例、实战经验
- 趋势型：行业趋势、未来预测

要求：
1. 标题要具体，不要泛泛而谈
2. 建议标题要吸引人，包含具体数字或关键词
3. 创作方向要明确可执行
4. 目标受众要精准
5. 切入角度要独特
6. 推理依据要基于数据，说明为什么提出这个洞察
7. 输出必须是严格的 JSON 数组格式

输出格式示例：
[
  {
    "type": "热点型",
    "title": "AI工具提效内容创作的实战案例",
    "suggestedTitle": "用AI提升10倍创作效率：5个实战工具深度测评",
    "direction": "工具测评 + 实际案例 + 效果对比 + 使用技巧",
    "audience": "内容创作者、自媒体运营者、营销人员",
    "angle": "实用工具+数据对比+避坑指南",
    "reasoning": "分析发现TOP5文章中有3篇提到AI工具，平均互动率15.2%，其中包含具体数字和对比数据的文章点赞数高出平均值40%。读者对'提效'、'实战'等关键词响应强烈。"
  }
]`

// 生成文章摘要的用户提示词
export function generateSummarizePrompt(articles: Array<{
  title: string
  content: string
  praise: number
  read: number
  wx_name: string
}>) {
  const articlesText = articles.map((article, index) => {
    const interactionRate = article.read > 0
      ? ((article.praise / article.read) * 100).toFixed(2)
      : "0.00"

    return `【文章${index + 1}】
标题：${article.title}
公众号：${article.wx_name}
点赞数：${article.praise}
阅读数：${article.read}
互动率：${interactionRate}%
内容：${article.content.slice(0, 800)}${article.content.length > 800 ? "..." : ""}
`
  }).join("\n\n")

  return `请分析以下${articles.length}篇热门微信公众号文章，为每篇文章生成结构化摘要。

${articlesText}

请返回一个 JSON 数组，包含${articles.length}个摘要对象，顺序与上述文章对应。`
}

// 生成选题洞察的用户提示词
export function generateInsightsPrompt({
  keyword,
  summaries,
  wordCloud,
}: {
  keyword: string
  summaries: Array<{
    title: string
    summary: string
    keyInfo: string[]
    keywords: string[]
    highlights: string[]
    originalData: {
      praise: number
      read: number
      interaction: string
      wx_name: string
    }
  }>
  wordCloud: Array<{
    word: string
    count: number
  }>
}) {
  const summariesText = summaries.map((item, index) => {
    return `【TOP${index + 1} - ${item.originalData.wx_name}】
标题：${item.title}
数据：点赞${item.originalData.praise} | 阅读${item.originalData.read} | 互动率${item.originalData.interaction}
摘要：${item.summary}
关键信息：${item.keyInfo.join("；")}
关键词：${item.keywords.join("、")}
亮点：${item.highlights.join("；")}
`
  }).join("\n\n")

  const topWords = wordCloud.slice(0, 15).map(w => `${w.word}(${w.count})`).join("、")

  return `用户搜索关键词：【${keyword}】

分析数据：
${summariesText}

热门词云（前15）：
${topWords}

基于以上分析，请生成5条高质量的选题洞察建议。要求：
1. 每条洞察都要基于数据和趋势
2. 推理依据要具体，引用数据支撑
3. 建议标题要吸引人且可执行
4. 5条洞察要涵盖不同类型和角度

请返回严格的 JSON 数组格式。`
}
