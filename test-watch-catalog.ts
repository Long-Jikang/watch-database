import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testDatabaseConnection() {
  console.log('开始测试数据库连接...');
  
  const databaseUrl = process.env.DATABASE_URL;
  console.log('DATABASE_URL:', databaseUrl ? '已配置' : '未配置');
  
  if (!databaseUrl) {
    console.error('错误: DATABASE_URL 环境变量未配置');
    return;
  }

  try {
    // 解析数据库URL
    const url = new URL(databaseUrl);
    const dbConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', '')
    };
    
    console.log('数据库配置:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user
    });

    // 创建连接
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 测试基本查询
    console.log('\n1. 测试基本查询 (SELECT 1):');
    const [basicResult] = await connection.execute('SELECT 1 as test');
    console.log('✅ 基本查询成功:', basicResult);

    // 检查数据库中的表
    console.log('\n2. 检查数据库中的表:');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [dbConfig.database]);
    
    console.log('数据库中的表:');
    (tables as any[]).forEach((table: any) => {
      console.log(`  - ${table.TABLE_NAME}`);
    });

    // 检查是否有 watch_catalog 表
    console.log('\n3. 检查 watch_catalog 表:');
    const hasWatchCatalog = (tables as any[]).some((table: any) => 
      table.TABLE_NAME.toLowerCase() === 'watch_catalog'
    );
    
    if (hasWatchCatalog) {
      console.log('✅ watch_catalog 表存在');
      
      // 查看表结构
      console.log('\n4. 查看 watch_catalog 表结构:');
      const [tableStructure] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [dbConfig.database, 'watch_catalog']);
      
      console.log('watch_catalog 表结构:');
      (tableStructure as any[]).forEach((column: any) => {
        console.log(`  - ${column.COLUMN_NAME} (${column.DATA_TYPE})`);
      });
      
      // 测试查询数据
      console.log('\n5. 测试查询 watch_catalog 表数据:');
      const [data] = await connection.execute('SELECT COUNT(*) as count FROM watch_catalog');
      console.log('watch_catalog 表记录数:', data);
    } else {
      console.log('❌ watch_catalog 表不存在');
    }

    // 检查 watches 表
    console.log('\n6. 检查 watches 表:');
    const hasWatches = (tables as any[]).some((table: any) => 
      table.TABLE_NAME.toLowerCase() === 'watches'
    );
    
    if (hasWatches) {
      console.log('✅ watches 表存在');
      
      // 测试查询 watches 表数据
      console.log('\n7. 测试查询 watches 表数据:');
      const [watchCount] = await connection.execute('SELECT COUNT(*) as count FROM watches');
      console.log('watches 表记录数:', watchCount);
      
      // 查看前几条记录
      const [sampleData] = await connection.execute('SELECT * FROM watches LIMIT 5');
      console.log('watches 表前5条记录:', sampleData);
    } else {
      console.log('❌ watches 表不存在');
    }

    // 关闭连接
    await connection.end();
    console.log('\n✅ 数据库连接测试完成');
    
  } catch (error) {
    console.error('❌ 数据库连接或查询失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
    }
  }
}

// 运行测试
testDatabaseConnection().catch(console.error);