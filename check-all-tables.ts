import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

// 加载环境变量
config();

async function checkAllTables() {
  console.log('开始检查数据库中所有表结构...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 环境变量未设置');
    return;
  }

  try {
    const db = drizzle(process.env.DATABASE_URL);
    
    // 查询数据库中所有表
    const tables = await db.execute(sql`SHOW TABLES`);
    console.log('✅ 数据库连接成功');
    console.log(`数据库中共有 ${tables.length} 个表:\n`);
    
    tables.forEach((table: any, index: number) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    console.log('\n检查每个表的结构...\n');
    
    // 检查每个表的结构
    for (const table of tables) {
      const tableName = Object.values(table)[0] as string;
      console.log(`\n表: ${tableName}`);
      console.log('='.repeat(50));
      
      try {
        const columns = await db.execute(sql`DESCRIBE ${sql.identifier(tableName)}`);
        columns.forEach((col: any) => {
          console.log(`  ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // 检查表的数据量
        const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`);
        console.log(`  记录数: ${countResult[0].count}`);
        
      } catch (error) {
        console.error(`  无法获取表结构: ${error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  }
}

// 运行检查
checkAllTables().catch(console.error);