/**
 * SQLite 数据导出脚本
 * 将所有表的数据导出为 JSON 文件，方便迁移到飞书
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, '../data/content-factory.db');
const exportDir = path.join(__dirname, '../data/export');

// 确保导出目录存在
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

console.log('📦 开始导出 SQLite 数据...\n');

try {
  const db = new Database(dbPath, { readonly: true });

  // 导出各个表
  const tables = [
    { name: 'analysis_batches', file: '1-分析批次.json' },
    { name: 'articles', file: '2-文章.json' },
    { name: 'word_cloud', file: '3-词云.json' },
    { name: 'topic_insights', file: '4-选题洞察.json' },
    { name: 'ai_configs', file: '5-AI配置.json' },
    { name: 'ai_config_templates', file: '6-AI配置模板.json' },
    { name: 'ai_test_logs', file: '7-AI测试日志.json' }
  ];

  let totalRecords = 0;

  tables.forEach(({ name, file }) => {
    try {
      const stmt = db.prepare(`SELECT * FROM ${name}`);
      const data = stmt.all();

      const exportPath = path.join(exportDir, file);
      fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf-8');

      console.log(`✅ ${name.padEnd(25)} → ${file.padEnd(25)} (${data.length} 条)`);
      totalRecords += data.length;
    } catch (error) {
      console.error(`❌ ${name} 导出失败:`, error.message);
    }
  });

  db.close();

  console.log(`\n✨ 导出完成！共导出 ${totalRecords} 条记录`);
  console.log(`📁 导出文件位置: ${exportDir}`);

} catch (error) {
  console.error('❌ 导出失败:', error);
  process.exit(1);
}
