import * as XLSX from "xlsx"

export interface BatchExportData {
  keyword: string
  analysisTime: string
  timeRange: string
  totalArticles: number
  articles: Array<{
    title: string
    wx_name: string
    praise: number
    read_count: number
    interaction_rate: number
    publish_time: number | null
    url: string
  }>
}

/**
 * 导出批次分析数据为Excel文件
 * @param data 批次数据
 * @param filename 文件名（不含扩展名）
 */
export function exportBatchToExcel(data: BatchExportData, filename?: string) {
  // 创建工作簿
  const wb = XLSX.utils.book_new()

  // 准备数据行
  const rows: any[][] = []

  // 添加表头信息（批次信息）
  rows.push(["选题分析报告"])
  rows.push([`关键词：${data.keyword}`])
  rows.push([`分析时间：${data.analysisTime}`])
  rows.push([`时间范围：${data.timeRange}`])
  rows.push([`文章总数：${data.totalArticles}篇`])
  rows.push([]) // 空行

  // 添加数据表头
  rows.push(["序号", "标题", "公众号", "点赞数", "阅读数", "互动率", "发布时间", "文章链接"])

  // 添加文章数据
  data.articles.forEach((article, index) => {
    rows.push([
      index + 1,
      article.title,
      article.wx_name || "未知",
      article.praise,
      article.read_count,
      `${(article.interaction_rate * 100).toFixed(2)}%`,
      article.publish_time
        ? new Date(article.publish_time).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "未知",
      article.url || "",
    ])
  })

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // 设置列宽
  ws["!cols"] = [
    { wch: 6 }, // 序号
    { wch: 50 }, // 标题
    { wch: 20 }, // 公众号
    { wch: 10 }, // 点赞数
    { wch: 10 }, // 阅读数
    { wch: 10 }, // 互动率
    { wch: 18 }, // 发布时间
    { wch: 50 }, // 文章链接
  ]

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(wb, ws, "文章明细")

  // 生成文件名
  const date = new Date().toLocaleDateString("zh-CN").replace(/\//g, "")
  const finalFilename = filename || `选题分析报告_${data.keyword}_${date}.xlsx`

  // 导出文件
  XLSX.writeFile(wb, finalFilename)
}
