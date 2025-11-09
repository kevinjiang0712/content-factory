# SQLite 迁移到飞书多维表格 - 完整指南

## 📚 目录

1. [准备工作](#准备工作)
2. [创建飞书应用](#创建飞书应用)
3. [创建多维表格](#创建多维表格)
4. [导出 SQLite 数据](#导出-sqlite-数据)
5. [导入到飞书](#导入到飞书)
6. [验证数据](#验证数据)
7. [切换数据库](#切换数据库)
8. [常见问题](#常见问题)

---

## 📋 准备工作

### 所需时间
- 总计：约 90 分钟
- 飞书配置：30 分钟
- 创建表格：20 分钟
- 数据迁移：40 分钟

### 所需材料
- ✅ 飞书账号
- ✅ 项目代码访问权限
- ✅ Node.js 环境（已安装）

---

## 🚀 快速开始（命令速查）

```bash
# 1. 测试飞书连接
node scripts/test-feishu-connection.js

# 2. 导出 SQLite 数据
node scripts/export-sqlite-data.js

# 3. 导入到飞书
node scripts/import-to-feishu.js

# 4. 安装依赖（如果还没安装）
npm install @larksuiteoapi/node-sdk dotenv
```

---

## 🔧 详细步骤

### 步骤 1：创建飞书应用

1. 访问 https://open.feishu.cn/
2. 登录并进入"开发者后台"
3. 创建"企业自建应用"
4. 配置权限：
   - `bitable:app` - 多维表格应用
   - `bitable:table` - 数据表读写
   - `bitable:record` - 记录读写
5. 记录 `App ID` 和 `App Secret`

### 步骤 2：创建多维表格

#### 表结构清单

<details>
<summary>表1：分析批次 (analysis_batches)</summary>

| 字段名 | 类型 | 说明 |
|--------|------|------|
| 批次ID | 单行文本 | 唯一标识 |
| 关键词 | 单行文本 | 分析关键词 |
| 时间范围 | 数字 | 天数 |
| 文章数量 | 数字 | 分析的文章数 |
| 总文章数 | 数字 | 总共抓取的文章数 |
| 创建时间 | 日期时间 | 批次创建时间 |

</details>

<details>
<summary>表2：文章 (articles)</summary>

| 字段名 | 类型 | 说明 |
|--------|------|------|
| 标题 | 单行文本 | 文章标题 |
| 内容 | 多行文本 | 文章内容 |
| 点赞数 | 数字 | 点赞数 |
| 阅读数 | 数字 | 阅读数 |
| 互动率 | 数字 | 互动率百分比 |
| 公众号名称 | 单行文本 | 来源公众号 |
| 文章链接 | URL | 原文链接 |
| 短链接 | 单行文本 | 短链接 |
| 发布时间 | 日期时间 | 文章发布时间 |
| 批次ID | 单向关联 | 关联到分析批次表 |

</details>

<details>
<summary>表3：词云 (word_cloud)</summary>

| 字段名 | 类型 | 说明 |
|--------|------|------|
| 词汇 | 单行文本 | 关键词 |
| 出现次数 | 数字 | 频次 |
| 排序序号 | 数字 | 排名 |
| 批次ID | 单向关联 | 关联到分析批次表 |

</details>

<details>
<summary>表4：选题洞察 (topic_insights)</summary>

| 字段名 | 类型 | 说明 |
|--------|------|------|
| 类型 | 单选 | 热点追踪/观点洞察等 |
| 标题 | 单行文本 | 洞察标题 |
| 建议标题 | 单行文本 | AI建议的文章标题 |
| 内容方向 | 多行文本 | 内容创作方向 |
| 目标受众 | 单行文本 | 受众定位 |
| 切入角度 | 单行文本 | 写作角度 |
| 分析理由 | 多行文本 | AI分析理由 |
| 排序序号 | 数字 | 排名 |
| 原文标题 | 单行文本 | 参考原文标题 |
| 原文链接 | URL | 原文链接 |
| 原文发布时间 | 日期时间 | 原文发布时间 |
| 原文公众号 | 单行文本 | 原文公众号 |
| 创建时间 | 日期时间 | 洞察生成时间 |
| 批次ID | 单向关联 | 关联到分析批次表 |

</details>

<details>
<summary>表5-7：AI配置相关表</summary>

参见完整文档或运行脚本查看结构

</details>

### 步骤 3：配置环境变量

在 `.env.local` 文件中添加：

```bash
# 飞书应用凭证
FEISHU_APP_ID=cli_xxxxxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxx

# 多维表格 Token
FEISHU_BITABLE_APP_TOKEN=bascnxxxxxxxxxxxxxx

# 各表 ID
FEISHU_TABLE_BATCHES=tblxxxxxxxxxxxxxx1
FEISHU_TABLE_ARTICLES=tblxxxxxxxxxxxxxx2
FEISHU_TABLE_WORD_CLOUD=tblxxxxxxxxxxxxxx3
FEISHU_TABLE_INSIGHTS=tblxxxxxxxxxxxxxx4
FEISHU_TABLE_AI_CONFIGS=tblxxxxxxxxxxxxxx5
FEISHU_TABLE_AI_TEMPLATES=tblxxxxxxxxxxxxxx6
FEISHU_TABLE_AI_TEST_LOGS=tblxxxxxxxxxxxxxx7

# 数据库类型
DATABASE_TYPE=sqlite
```

### 步骤 4：执行迁移

```bash
# 1. 测试连接
node scripts/test-feishu-connection.js

# 2. 导出数据
node scripts/export-sqlite-data.js

# 3. 导入到飞书
node scripts/import-to-feishu.js
```

---

## ✅ 验证清单

### 数据完整性检查

- [ ] 分析批次表：记录数匹配
- [ ] 文章表：标题、内容、数据正确
- [ ] 词云表：词汇和频次正确
- [ ] 选题洞察表：洞察内容完整
- [ ] AI配置表：配置信息正确
- [ ] 关联字段：表与表之间关联正确

### 功能测试

- [ ] 读取记录正常
- [ ] 创建记录正常
- [ ] 更新记录正常
- [ ] 删除记录正常
- [ ] 搜索功能正常
- [ ] 筛选功能正常

---

## 🔄 切换数据库

### 方式 1：完全切换到飞书

修改 `lib/db.ts`，将所有数据库操作改为调用飞书 API。

### 方式 2：双数据库模式（推荐）

```typescript
// 根据环境变量决定使用哪个数据库
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite'

export async function saveAnalysis(data: SaveAnalysisData) {
  if (DATABASE_TYPE === 'feishu') {
    return saveAnalysisToFeishu(data)
  } else {
    return saveAnalysisToSQLite(data)
  }
}
```

### 方式 3：增量迁移

1. 新数据写入飞书
2. 旧数据保留在 SQLite
3. 查询时合并两个数据源

---

## ❓ 常见问题

### Q1: 导入时报错 "获取飞书 token 失败"

**原因：** App ID 或 App Secret 配置错误

**解决：**
1. 检查 `.env.local` 中的配置
2. 确认在飞书开放平台复制的值正确
3. 确保没有多余的空格或引号

### Q2: 导入时报错 "权限不足"

**原因：** 应用权限未配置或未发布

**解决：**
1. 在飞书开放平台检查权限配置
2. 确保已添加所有必需权限
3. 点击"版本管理与发布"，发布应用

### Q3: 日期时间格式不对

**原因：** SQLite 和飞书的时间戳格式不同

**解决：**
修改导入脚本中的 `mapper` 函数，转换时间格式：

```javascript
'创建时间': new Date(row.created_at).toISOString()
```

### Q4: 关联字段没有自动关联

**原因：** 导入脚本导入的是原始值，不是关联ID

**解决：**
需要手动在飞书表格中配置关联关系，或编写高级导入脚本。

### Q5: API 调用频率限制

**原因：** 飞书 API 有频率限制

**解决：**
脚本中已加入延迟（200ms），如仍有问题，可增加延迟时间。

---

## 📞 技术支持

- 飞书开放平台文档：https://open.feishu.cn/document/
- 飞书 API 文档：https://open.feishu.cn/document/server-docs/
- 多维表格 API：https://open.feishu.cn/document/server-docs/docs/bitable-v1/

---

## 📝 后续优化建议

1. **实时同步**：监听 SQLite 变更，自动同步到飞书
2. **双向同步**：飞书修改的数据同步回 SQLite
3. **备份策略**：定期备份飞书数据到本地
4. **权限管理**：利用飞书的协作功能，设置不同用户权限
5. **数据可视化**：在飞书中创建仪表板和图表

---

**更新时间：** 2025-11-08
**版本：** 1.0.0
