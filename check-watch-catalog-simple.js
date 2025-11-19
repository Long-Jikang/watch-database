import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// 加载环境变量
config();

async function checkWatchCatalog() {
  console.log('开始检查 watch_catalog 表...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 环境变量未设置');
    return;
  }

  try {
    // 解析数据库连接URL
    const url = new URL(process.env.DATABASE_URL);
    const connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', '')
    });

    console.log('✅ 数据库连接成功');

    // 检查表是否存在
    const [tables] = await connection.execute(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [url.pathname.replace('/', ''), 'watch_catalog']
    );

    if (tables.length > 0) {
      console.log('✅ watch_catalog 表存在');
      
      // 检查表结构
      const [columns] = await connection.execute('DESCRIBE watch_catalog');
      console.log('\n表结构:');
      columns.forEach(col => {
        console.log(`  ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

      // 检查记录数
      const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM watch_catalog');
      const count = countResult[0].count;
      console.log(`\n记录数: ${count}`);

      if (count > 0) {
        // 查看前几条记录
        const [sampleData] = await connection.execute('SELECT id, brand, name FROM watch_catalog LIMIT 5');
        console.log('\n前5条记录:');
        sampleData.forEach(row => {
          console.log(`  ID: ${row.id}, 品牌: ${row.brand}, 名称: ${row.name}`);
        });
      } else {
        console.log('❌ 表为空，需要导入数据');
      }
    } else {
      console.log('❌ watch_catalog 表不存在');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkWatchCatalog().catch(console.error);