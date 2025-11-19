import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

// 加载环境变量
config();

async function checkWatchCatalogStructure() {
  console.log('开始检查 watch_catalog 表的实际结构...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 环境变量未设置');
    return;
  }

  try {
    const db = drizzle(process.env.DATABASE_URL);
    
    // 检查表结构
    console.log('watch_catalog 表结构:');
    console.log('='.repeat(50));
    
    const columns = await db.execute(sql`DESCRIBE watch_catalog`);
    columns.forEach((col: any) => {
      console.log(`  ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 检查表的数据量
    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM watch_catalog`);
    console.log(`\n记录数: ${countResult[0].count}`);
    
    // 查看前几条记录的字段
    console.log('\n查看前3条记录的字段值:');
    const sampleData = await db.execute(sql`SELECT * FROM watch_catalog LIMIT 3`);
    sampleData.forEach((row: any, index: number) => {
      console.log(`\n记录 ${index + 1}:`);
      Object.keys(row).forEach(key => {
        console.log(`  ${key}: ${row[key]}`);
      });
    });
    
  } catch (error) {
    console.error('❌ 检查表结构失败:', error);
  }
}

// 运行检查
checkWatchCatalogStructure().catch(console.error);