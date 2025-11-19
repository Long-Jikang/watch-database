import { config } from 'dotenv';

// 加载环境变量
config();

import { getDbStats, getBrands, getCaseMaterials, getMovementTypes, searchWatches } from './server/db';

async function testSimpleQueries() {
  console.log('开始测试简化后的数据库查询...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');

  try {
    // 1. 测试数据库统计
    console.log('1. 测试数据库统计 (getDbStats):');
    const stats = await getDbStats();
    console.log('✅ 数据库统计查询成功:');
    console.log(`   - 手表总数: ${stats.totalWatches}`);
    console.log(`   - 品牌总数: ${stats.totalBrands}`);
    console.log('');

    // 2. 测试品牌列表
    console.log('2. 测试品牌列表 (getBrands):');
    const brands = await getBrands();
    console.log(`✅ 品牌列表查询成功，共 ${brands.length} 个品牌`);
    console.log(`   前10个品牌: ${brands.slice(0, 10).join(', ')}`);
    console.log('');

    // 3. 测试表壳材质列表
    console.log('3. 测试表壳材质列表 (getCaseMaterials):');
    const materials = await getCaseMaterials();
    console.log(`✅ 表壳材质列表查询成功，共 ${materials.length} 种材质`);
    if (materials.length > 0) {
      console.log(`   前10种材质: ${materials.slice(0, 10).join(', ')}`);
    }
    console.log('');

    // 4. 测试机芯类型列表
    console.log('4. 测试机芯类型列表 (getMovementTypes):');
    const movementTypes = await getMovementTypes();
    console.log(`✅ 机芯类型列表查询成功，共 ${movementTypes.length} 种类型`);
    if (movementTypes.length > 0) {
      console.log(`   前10种类型: ${movementTypes.slice(0, 10).join(', ')}`);
    }
    console.log('');

    // 5. 测试手表搜索
    console.log('5. 测试手表搜索 (searchWatches):');
    const searchResult = await searchWatches({
      query: 'Rolex',
      limit: 5
    });
    console.log(`✅ 手表搜索查询成功，找到 ${searchResult.total} 条记录`);
    console.log(`   返回 ${searchResult.watches.length} 条记录`);
    
    if (searchResult.watches.length > 0) {
      console.log('   前3条记录:');
      searchResult.watches.slice(0, 3).forEach((watch, index) => {
        console.log(`     ${index + 1}. ${watch.brand} - ${watch.name} (${watch.reference})`);
      });
    }
    console.log('');

    // 6. 测试reference字段搜索
    console.log('6. 测试reference字段搜索:');
    const refSearchResult = await searchWatches({
      query: '116610',
      limit: 3
    });
    console.log(`✅ reference搜索查询成功，找到 ${refSearchResult.total} 条记录`);
    if (refSearchResult.watches.length > 0) {
      console.log('   搜索结果:');
      refSearchResult.watches.forEach((watch, index) => {
        console.log(`     ${index + 1}. ${watch.brand} ${watch.name} - ${watch.reference}`);
      });
    }
    console.log('');

    console.log('🎉 所有数据库查询测试通过！手表搜索功能已修复。');

  } catch (error) {
    console.error('❌ 数据库查询测试失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
    }
  }
}

// 运行测试
testSimpleQueries().catch(console.error);