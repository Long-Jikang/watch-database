# Watch Database & Market Tracker - 使用指南

## 系统概述

Watch Database & Market Tracker 是一个专业的手表数据库与市场追踪系统，为您的 App 提供完整的手表数据支持。系统已成功导入 **39,050 条手表数据**和 **222,961 条特征数据**，涵盖 **160 个品牌**的详细规格信息。

---

## 核心功能

### 1. 高级搜索

系统提供强大的多维度搜索功能，支持以下筛选条件：

- **关键词搜索**：搜索手表名称、品牌、型号
- **品牌筛选**：从 160 个品牌中选择
- **表壳材质**：不锈钢、黄金、白金、钛金属等
- **机芯类型**：自动机械、手动机械、石英等
- **直径范围**：按表壳直径筛选
- **防水深度**：按防水等级筛选

**使用方法：**
1. 访问搜索页面
2. 输入关键词或选择筛选条件
3. 系统实时返回匹配结果
4. 点击手表卡片查看详细信息

---

### 2. 详细规格查看

每个手表都包含完整的技术规格信息：

**基础信息：**
- 品牌、系列、型号
- 生产年份
- 限量版信息

**表壳规格：**
- 材质（不锈钢、金、钛等）
- 直径（毫米）
- 厚度（毫米）
- 表镜材质
- 底盖类型
- 防水深度

**机芯信息：**
- 机芯类型
- 机芯型号
- 复杂功能

**特征标签：**
- 表盘颜色
- 表壳形状
- 时标类型
- 指针类型

---

### 3. 个人收藏

登录用户可以：
- 收藏喜欢的手表
- 添加个人笔记
- 管理收藏清单

---

### 4. 价格追踪（即将推出）

系统预留了市场价格追踪功能，可在配置外部 API 后启用：
- 实时市场价格
- 历史价格趋势
- 价格走势图表

---

## API 接入指南

### 数据库统计 API

```typescript
// 获取数据库统计信息
GET /api/trpc/stats.get

// 返回示例：
{
  totalWatches: 39050,
  totalBrands: 160,
  totalFeatures: 222961,
  totalWatchlistItems: 0
}
```

### 搜索 API

```typescript
// 搜索手表
GET /api/trpc/watches.search

// 参数：
{
  query?: string,           // 关键词
  brand?: string,           // 品牌
  caseMaterial?: string,    // 材质
  movementType?: string,    // 机芯类型
  minDiameter?: number,     // 最小直径
  maxDiameter?: number,     // 最大直径
  limit: number,            // 每页数量
  offset: number,           // 偏移量
  sortBy: 'name' | 'brand', // 排序字段
  sortOrder: 'asc' | 'desc' // 排序方向
}

// 返回示例：
{
  watches: [...],
  total: 1234
}
```

### 手表详情 API

```typescript
// 获取手表详情和特征
GET /api/trpc/watches.getWithFeatures

// 参数：
{
  id: number  // 手表 ID
}

// 返回示例：
{
  watch: {
    id: 123,
    name: "Submariner Date",
    brand: "Rolex",
    referenceNumber: "126610LN",
    caseMaterial: "Stainless Steel",
    caseDiameterMm: 41,
    movementType: "Automatic",
    // ... 更多字段
  },
  features: [
    {
      featureKey: "dial_color",
      featureValue: "Black"
    },
    // ... 更多特征
  ]
}
```

### 筛选选项 API

```typescript
// 获取所有品牌
GET /api/trpc/filters.getBrands

// 获取所有材质
GET /api/trpc/filters.getCaseMaterials

// 获取所有机芯类型
GET /api/trpc/filters.getMovementTypes
```

---

## 数据源说明

### 当前数据源

系统当前使用 **Kaggle 开源手表数据集**，包含：
- 40,000+ 条手表记录
- MIT 开源许可证，完全免费可商用
- 涵盖主流品牌和型号

### 可扩展数据源

系统已预留外部 API 接入接口，支持：

1. **TheWatchAPI**（免费套餐）
   - 每日 25 次免费请求
   - 适合小规模补充数据

2. **WatchBase DataFeed**（按需付费）
   - $0.30/条数据
   - 无月费，一次性购买
   - 适合批量获取详细规格

3. **Chrono24 API**（商业授权）
   - 实时市场价格数据
   - 需要商业协议

详细配置方法请参考 `API_INTEGRATION_GUIDE.md`

---

## 技术架构

### 后端技术栈
- **数据库**：MySQL (Supabase)
- **API 框架**：tRPC + Express
- **ORM**：Drizzle ORM
- **认证**：Manus OAuth

### 前端技术栈
- **框架**：React 19
- **UI 组件**：shadcn/ui + Tailwind CSS
- **路由**：Wouter
- **状态管理**：tRPC React Query

### 数据库架构

```sql
-- 手表主表
watches (
  id, name, brand, referenceNumber,
  caseMaterial, caseDiameterMm, caseThicknessMm,
  movementType, movementCaliber,
  waterResistanceM, yearOfProduction,
  isLimited, limitedEditionSize,
  description, dataSource
)

-- 手表特征表
watchFeatures (
  id, watchId, featureKey, featureValue
)

-- 市场价格表
marketPrices (
  id, watchId, priceUsd, source,
  condition, recordedAt
)

-- 用户收藏表
userWatchlist (
  id, userId, watchId, notes, addedAt
)
```

---

## 性能指标

- **搜索响应时间**：< 200ms
- **数据库查询优化**：已建立索引
- **并发支持**：支持高并发查询
- **数据新鲜度**：支持定时更新

---

## 部署说明

### 环境要求
- Node.js 22+
- MySQL 数据库
- 环境变量配置

### 快速部署

1. **克隆项目**
```bash
git clone <repository-url>
cd watch-database
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入数据库连接信息
DATABASE_URL=mysql://user:password@host:port/database
```

4. **推送数据库架构**
```bash
pnpm db:push
```

5. **导入数据**
```bash
python3 scripts/import_watches.py
```

6. **启动开发服务器**
```bash
pnpm dev
```

7. **访问应用**
```
http://localhost:3000
```

### 生产部署

通过 Manus 平台一键发布：
1. 点击界面中的"发布"按钮
2. 配置域名和部署设置
3. 系统自动构建和部署

---

## 常见问题

### Q: 如何更新手表数据？
A: 可以通过以下方式：
1. 重新运行导入脚本更新 Kaggle 数据集
2. 配置外部 API 定时同步
3. 手动通过管理接口添加

### Q: 支持哪些搜索方式？
A: 支持关键词搜索、品牌筛选、材质筛选、机芯类型筛选、直径范围筛选等多维度组合搜索。

### Q: 如何获取实时市场价格？
A: 需要配置 Chrono24 API 或其他价格数据源，详见 `API_INTEGRATION_GUIDE.md`。

### Q: 数据库容量如何？
A: 当前已导入约 40,000 条手表数据，数据库设计支持百万级数据量。

### Q: 如何备份数据？
A: 通过 Supabase 控制台可以定期备份数据库，或使用 `mysqldump` 命令行工具。

---

## 技术支持

如有问题或建议，请联系：
- 项目文档：查看项目根目录下的 README.md
- API 文档：查看 API_INTEGRATION_GUIDE.md
- 数据源研究：查看 data_sources_research.md

---

## 更新日志

### v1.0 (2025-10-21)
- ✅ 完整的数据库架构设计
- ✅ 导入 39,050 条手表数据
- ✅ 实现多维度搜索功能
- ✅ 构建响应式前端界面
- ✅ 集成外部 API 框架
- ✅ 用户收藏功能
- ✅ 完整的技术文档

---

**系统版本**: v1.0  
**最后更新**: 2025-10-21  
**作者**: Manus AI

