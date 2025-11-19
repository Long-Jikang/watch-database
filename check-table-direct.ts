import { config } from 'dotenv';

// 加载环境变量
config();

import mysql from 'mysql2/promise';

async function checkTableDirect() {
  console.log('开始直接检查 watch_catalog 表结构...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 环境变量未设置');
    return;
  }

  try {
    // 解析 DATABASE_URL
    const url = new URL(process.env.DATABASE_URL);
    const connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port),
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', '')
    });

    console.log('✅ 数据库连接成功\n');

    // 检查表结构
    console.log('watch_catalog 表结构:');
    console.log('='.repeat(50));
    
    const [columns] = await connection.execute('DESCRIBE watch_catalog');
    (columns as any[]).forEach((col: any) => {
      console.log(`  ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 检查表的数据量
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM watch_catalog');
    console.log(`\n记录数: ${(countResult as any)[0].count}`);

    // 查看前几条记录的字段
    console.log('\n查看前3条记录的字段值:');
    const [sampleData] = await connection.execute('SELECT * FROM watch_catalog LIMIT 3');
    (sampleData as any[]).forEach((row: any, index: number) => {
      console.log(`\n记录 ${index + 1}:`);
      Object.keys(row).forEach(key => {
        console.log(`  ${key}: ${row[key]}`);
      });
    });

    await connection.end();
    
  } catch (error) {
    console.error('❌ 检查表结构失败:', error);
  }
}

// 运行检查
checkTableDirect().catch(console.error);