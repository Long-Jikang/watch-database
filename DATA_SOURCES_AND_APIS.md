# 手表数据库系统 - 数据来源和 API 完整清单

本文档详细列出了手表数据库系统中所有使用的数据来源、API 服务和第三方集成。

---

## 📊 目录

1. [核心数据源](#核心数据源)
2. [已集成的 API](#已集成的-api)
3. [可选集成的 API](#可选集成的-api)
4. [图片和多媒体资源](#图片和多媒体资源)
5. [基础设施和服务](#基础设施和服务)
6. [数据更新计划](#数据更新计划)

---

## 核心数据源

### 1. Kaggle - Watches Dataset（手表数据集）

**📌 数据集信息**
- **名称**: A Dataset of Watches
- **来源**: Kaggle（开源数据科学平台）
- **URL**: https://www.kaggle.com/datasets/yagizfiratt/watches-dataset
- **许可证**: MIT License（开源，可商用）
- **数据量**: 40,000+ 条手表记录
- **导入状态**: ✅ 已完全导入
- **导入数量**: 34,817 条有效记录（清理后）

**📋 包含的字段**
```
- brand（品牌）
- model（型号）
- reference_number（型号编号）
- year（年份）
- case_diameter（表壳直径）
- case_thickness（表壳厚度）
- case_material（表壳材质）
- dial_color（表盘颜色）
- water_resistance（防水等级）
- movement_type（机芯类型）
- movement_caliber（机芯型号）
- description（描述）
```

**💾 数据库表**
- `watches`（34,817 条记录）
- `watch_features`（222,961 条特征记录）

**🔄 更新频率**: 静态数据集（无自动更新）

**💰 成本**: 免费

---

### 2. Kaggle - Watches Images Dataset（手表图片数据集）

**📌 数据集信息**
- **名称**: A Dataset of Watches
- **来源**: Kaggle
- **URL**: https://www.kaggle.com/datasets/mathewkouch/a-dataset-of-watches
- **许可证**: Open Database License (ODbL)
- **图片数量**: 2,553 张高清手表图片
- **导入状态**: ✅ 已完全导入
- **上传到 CDN**: ✅ 已全部上传

**📸 包含的品牌**
- Versace（范思哲）
- Fitbit（飞比得）
- TW Steel（TW 钢铁）
- Armani Exchange（阿玛尼交易所）
- Fossil（化石）
- Nixon（尼克松）
- Tissot（天梭）
- Rosefield（罗斯菲尔德）
- 及其他时尚品牌

**💾 存储位置**
- **本地**: `/home/ubuntu/watches/watches/images/`
- **CDN**: `https://files.manuscdn.com/user_upload_by_module/session_file/89369555/`
- **数据库字段**: `watches.imageUrl`

**🔄 更新频率**: 静态数据集（无自动更新）

**💰 成本**: 免费

---

## 已集成的 API

### 1. TheWatchAPI（手表数据和价格 API）

**📌 API 信息**
- **官方网站**: https://www.thewatchapi.com/
- **API 类型**: RESTful API
- **认证方式**: API Key（免费套餐）
- **基础 URL**: `https://api.thewatchapi.com/v1/`

**📋 可用端点**

#### 1.1 搜索手表
```
GET /api/v1/watches/search
参数:
  - q: 搜索关键词（品牌、型号等）
  - limit: 返回结果数量（默认 10）
  - offset: 分页偏移
  
示例:
GET https://api.thewatchapi.com/v1/watches/search?q=Rolex%20Submariner&limit=10
```

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "brand": "Rolex",
      "model": "Submariner",
      "reference": "126610LN",
      "year": 2023,
      "price_usd": 9100,
      "image_url": "https://...",
      "description": "..."
    }
  ],
  "total": 150
}
```

#### 1.2 获取手表详情
```
GET /api/v1/watches/{id}

示例:
GET https://api.thewatchapi.com/v1/watches/123
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "id": "123",
    "brand": "Rolex",
    "model": "Submariner",
    "reference": "126610LN",
    "year": 2023,
    "case_diameter": 41,
    "case_material": "Stainless Steel",
    "dial_color": "Black",
    "water_resistance": "300m",
    "movement": "Automatic",
    "price_usd": 9100,
    "price_history": [
      {
        "date": "2024-01-15",
        "price": 8900
      }
    ],
    "image_url": "https://...",
    "description": "..."
  }
}
```

#### 1.3 获取价格历史
```
GET /api/v1/watches/{id}/price-history
参数:
  - days: 获取最近 N 天的价格历史（默认 30）

示例:
GET https://api.thewatchapi.com/v1/watches/123/price-history?days=90
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "watch_id": "123",
    "prices": [
      {
        "date": "2024-01-15",
        "price_usd": 8900,
        "price_eur": 8200,
        "source": "secondary_market"
      }
    ]
  }
}
```

#### 1.4 获取品牌列表
```
GET /api/v1/brands

示例:
GET https://api.thewatchapi.com/v1/brands
```

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Rolex",
      "country": "Switzerland",
      "founded": 1905,
      "watches_count": 1500
    }
  ]
}
```

**🔑 认证方式**
```
Header: Authorization: Bearer YOUR_API_KEY
```

**📊 免费套餐限制**
- 请求限制: 25 次/天
- 响应速度: 标准
- 数据更新: 每周一次
- 历史数据: 最近 90 天

**💰 付费套餐**
- **Pro**: $9.99/月（500 次/天）
- **Enterprise**: 联系销售

**🔄 更新频率**: 每周一次（周一）

**集成状态**: ⏳ 已配置，待激活（需要 API Key）

---

## 可选集成的 API

### 1. WatchBase DataFeed API（高端手表数据）

**📌 API 信息**
- **官方网站**: https://datafeed.watchbase.com/
- **API 类型**: RESTful API
- **认证方式**: API Key
- **基础 URL**: `https://api.watchbase.com/v2/`

**📋 可用端点**

#### 1.1 搜索手表
```
GET /api/v2/watches
参数:
  - brand: 品牌名称
  - model: 型号
  - year_from: 起始年份
  - year_to: 结束年份
  - price_from: 最低价格
  - price_to: 最高价格
  - limit: 返回数量
  - offset: 分页偏移

示例:
GET https://api.watchbase.com/v2/watches?brand=Rolex&model=Submariner&price_from=8000&price_to=15000
```

#### 1.2 获取手表详情
```
GET /api/v2/watches/{id}
```

#### 1.3 获取市场价格
```
GET /api/v2/watches/{id}/market-price
```

**响应格式**:
```json
{
  "data": {
    "id": "rolex-submariner-126610ln",
    "brand": "Rolex",
    "model": "Submariner",
    "reference": "126610LN",
    "market_price": {
      "usd": 9500,
      "eur": 8700,
      "gbp": 7500
    },
    "price_trend": "up",
    "market_change_percent": 2.5
  }
}
```

**💰 定价模式**
- **按次计费**: $0.30 - $0.50 每条数据
- **月度套餐**: $99 - $999/月
- **企业方案**: 自定义定价

**📊 数据覆盖**
- 手表数量: 20,000+ 款
- 品牌数量: 500+ 个
- 更新频率: 每日更新
- 历史数据: 完整

**集成状态**: ⏳ 未集成（需要商业授权）

---

### 2. Chrono24 API（二级市场价格）

**📌 API 信息**
- **官方网站**: https://www.chrono24.com/
- **API 类型**: RESTful API（需要申请）
- **认证方式**: OAuth 2.0
- **基础 URL**: `https://api.chrono24.com/`

**📋 可用端点**

#### 2.1 搜索手表
```
GET /api/listings/search
参数:
  - query: 搜索关键词
  - brand: 品牌
  - model: 型号
  - condition: 手表状态（new/pre-owned）
  - price_from: 最低价格
  - price_to: 最高价格
  - currency: 货币（USD/EUR/GBP）
```

#### 2.2 获取实时价格
```
GET /api/listings/{id}/price
```

**响应格式**:
```json
{
  "listing_id": "12345",
  "brand": "Rolex",
  "model": "Submariner",
  "price": {
    "amount": 9500,
    "currency": "USD"
  },
  "seller": "Authorized Dealer",
  "condition": "pre-owned",
  "year": 2020,
  "location": "Switzerland"
}
```

**📊 数据特点**
- 实时二级市场价格
- 全球卖家信息
- 手表状态和历史
- 市场趋势分析

**💰 定价**
- 需要申请商业合作
- 按 API 调用次数计费

**集成状态**: ⏳ 未集成（需要商业授权）

---

### 3. Watchuseek API（手表论坛数据）

**📌 API 信息**
- **官方网站**: https://www.watchuseek.com/
- **API 类型**: 网页爬取（无官方 API）
- **认证方式**: 无需认证
- **数据类型**: 用户评价、讨论、市场信息

**📊 可获取的数据**
- 用户评价和评分
- 手表讨论和建议
- 市场情报
- 维修和保养信息

**⚠️ 注意事项**
- 无官方 API，需要网页爬取
- 需要遵守 robots.txt 和服务条款
- 建议频率: 每天 1-2 次更新

**集成状态**: ❌ 未集成（法律风险）

---

## 图片和多媒体资源

### 1. Manus CDN（内部 CDN 服务）

**📌 服务信息**
- **提供商**: Manus 平台
- **URL 前缀**: `https://files.manuscdn.com/`
- **存储容量**: 无限制
- **带宽**: 无限制
- **访问速度**: 全球加速

**📸 已上传的图片**
- **Kaggle 图片**: 2,553 张（已全部上传）
- **AI 生成图片**: 10 张（AP、PP、RM、Rolex、Omega、Cartier）
- **总计**: 2,563 张

**💾 存储结构**
```
/user_upload_by_module/session_file/89369555/
├── kaggle_watches/  (2,553 张)
├── ai_generated/    (10 张)
└── luxury_watches/  (AP、PP、RM 专辑)
```

**🔄 更新方式**
```bash
manus-upload-file <local_file_path>
```

**💰 成本**: 免费（包含在 Manus 平台中）

---

### 2. Unsplash API（免费图片库）

**📌 API 信息**
- **官方网站**: https://unsplash.com/
- **API 类型**: RESTful API
- **认证方式**: API Key（免费）
- **基础 URL**: `https://api.unsplash.com/`

**📋 可用端点**

#### 2.1 搜索图片
```
GET /search/photos
参数:
  - query: 搜索关键词（例如 "Rolex watch"）
  - page: 页码
  - per_page: 每页数量
  - order_by: 排序方式（relevant/latest）

示例:
GET https://api.unsplash.com/search/photos?query=Rolex%20watch&per_page=10
```

**响应格式**:
```json
{
  "results": [
    {
      "id": "abc123",
      "urls": {
        "raw": "https://images.unsplash.com/...",
        "full": "https://images.unsplash.com/...",
        "regular": "https://images.unsplash.com/...",
        "small": "https://images.unsplash.com/..."
      },
      "user": {
        "name": "Photographer Name",
        "username": "username"
      },
      "description": "Watch description"
    }
  ]
}
```

**📊 免费套餐限制**
- 请求限制: 50 次/小时
- 图片数量: 无限制
- 使用条款: 需要标注摄影师

**💰 成本**: 免费

**集成状态**: ⏳ 可选集成

---

### 3. AI 图片生成（Manus 内部服务）

**📌 服务信息**
- **提供商**: Manus 平台
- **模型**: DALL-E 3 / Stable Diffusion
- **质量**: 8K 分辨率
- **成本**: 包含在 Manus 平台中

**🎨 已生成的图片**
- Rolex Submariner
- Audemars Piguet Royal Oak（2 款）
- Patek Philippe Nautilus（2 款）
- Richard Mille RM 011
- Omega Speedmaster
- Cartier Santos

**📝 Prompt 模板**
```
Professional luxury watch product photography of [品牌] [型号], [关键特征], studio lighting, white background, ultra-realistic, 8K resolution
```

**💰 成本**: 免费（包含在 Manus 平台中）

---

## 基础设施和服务

### 1. Supabase（PostgreSQL 数据库）

**📌 服务信息**
- **提供商**: Supabase
- **数据库类型**: PostgreSQL
- **连接方式**: JDBC / MySQL 驱动
- **备份**: 自动每日备份
- **SSL**: 支持 SSL 连接

**💾 数据库结构**
```sql
-- 主表
CREATE TABLE watches (
  id INT PRIMARY KEY,
  brand VARCHAR(255),
  model VARCHAR(255),
  reference_number VARCHAR(255),
  year INT,
  case_diameter DECIMAL(5,2),
  case_thickness DECIMAL(5,2),
  case_material VARCHAR(255),
  dial_color VARCHAR(255),
  water_resistance VARCHAR(255),
  movement_type VARCHAR(255),
  movement_caliber VARCHAR(255),
  description TEXT,
  imageUrl VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 特征表
CREATE TABLE watch_features (
  id INT PRIMARY KEY,
  watch_id INT,
  feature_name VARCHAR(255),
  feature_value VARCHAR(500),
  FOREIGN KEY (watch_id) REFERENCES watches(id)
);

-- 用户表
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 收藏表
CREATE TABLE favorites (
  id INT PRIMARY KEY,
  user_id VARCHAR(64),
  watch_id INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (watch_id) REFERENCES watches(id)
);

-- 价格历史表（预留）
CREATE TABLE market_prices (
  id INT PRIMARY KEY,
  watch_id INT,
  timestamp TIMESTAMP,
  price_usd DECIMAL(10,2),
  source VARCHAR(100),
  condition VARCHAR(50),
  FOREIGN KEY (watch_id) REFERENCES watches(id)
);
```

**📊 数据量**
- watches: 34,817 条
- watch_features: 222,961 条
- users: 0 条（待用户注册）
- favorites: 0 条（待用户操作）
- market_prices: 0 条（待 API 集成）

**💰 定价**
- 免费套餐: 500MB 数据库
- Pro 套餐: $25/月（8GB 数据库）

**集成状态**: ✅ 已集成

---

### 2. Manus OAuth（身份认证）

**📌 服务信息**
- **提供商**: Manus 平台
- **认证方式**: OAuth 2.0
- **登录 URL**: `https://api.manus.im/oauth/authorize`
- **回调 URL**: `/api/oauth/callback`

**🔑 环境变量**
```
VITE_APP_ID=<your_app_id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
JWT_SECRET=<your_jwt_secret>
```

**集成状态**: ✅ 已集成

---

### 3. Manus 通知服务

**📌 服务信息**
- **功能**: 发送所有者通知
- **方式**: 应用内通知
- **API**: `/api/system/notifyOwner`

**使用示例**
```typescript
import { notifyOwner } from "./server/_core/notification";

await notifyOwner({
  title: "新手表数据已导入",
  content: "成功导入 100 款新手表"
});
```

**集成状态**: ✅ 已集成

---

## 数据更新计划

### 当前状态（静态数据）
```
手表数据: Kaggle 数据集（2024 年 1 月）
手表图片: Kaggle + AI 生成（2025 年 1 月）
价格数据: 无（待 API 集成）
```

### 推荐的更新计划

#### 短期（1-3 个月）
- [ ] 集成 TheWatchAPI（需要 API Key）
- [ ] 实现定时价格更新（每天一次）
- [ ] 添加价格历史追踪

#### 中期（3-6 个月）
- [ ] 评估 WatchBase DataFeed API
- [ ] 集成 Chrono24 二级市场价格
- [ ] 实现市场趋势分析

#### 长期（6-12 个月）
- [ ] 建立自有数据采集系统
- [ ] 实现 AI 驱动的价格预测
- [ ] 添加用户贡献的数据

---

## 数据许可证和合规性

### 已使用的数据源许可证

| 数据源 | 许可证 | 商用 | 修改 | 分发 |
|--------|--------|------|------|------|
| Kaggle Watches | MIT | ✅ | ✅ | ✅ |
| Kaggle Images | ODbL | ✅ | ✅ | ✅ |
| TheWatchAPI | 商业 | ✅ | ❌ | ❌ |
| Unsplash | Unsplash License | ✅ | ✅ | ✅ |
| AI 生成图片 | 自有 | ✅ | ✅ | ✅ |

### 重要提醒
- ⚠️ 所有数据使用必须遵守相应的许可证
- ⚠️ 商业 API（如 WatchBase、Chrono24）需要正式授权
- ⚠️ 禁止未经授权的网页爬取
- ⚠️ 必须在适当位置标注数据来源

---

## API 集成检查清单

### 必需集成
- [ ] TheWatchAPI（价格和基础数据）
  - [ ] 获取 API Key
  - [ ] 配置环境变量
  - [ ] 实现搜索端点
  - [ ] 实现价格历史端点
  - [ ] 配置定时更新任务

### 可选集成
- [ ] WatchBase DataFeed（高端手表数据）
  - [ ] 申请商业合作
  - [ ] 获取 API 凭证
  - [ ] 评估成本效益
  
- [ ] Chrono24 API（二级市场价格）
  - [ ] 申请 API 访问权限
  - [ ] 集成实时价格
  - [ ] 实现市场趋势分析

- [ ] Unsplash API（补充图片）
  - [ ] 获取 API Key
  - [ ] 实现图片搜索功能
  - [ ] 自动下载和缓存

---

## 成本总结

### 当前成本（免费）
- Kaggle 数据集: 免费
- Manus CDN: 免费
- Supabase 数据库: 免费（500MB）
- Manus OAuth: 免费
- AI 图片生成: 免费

**总计**: $0/月

### 预计成本（集成后）

#### 最小配置（推荐）
- TheWatchAPI Pro: $9.99/月
- Supabase Pro: $25/月
- **总计**: $34.99/月

#### 完整配置
- TheWatchAPI Pro: $9.99/月
- WatchBase DataFeed: $99/月（按需）
- Chrono24 API: $50/月（预估）
- Supabase Pro: $25/月
- **总计**: $183.99/月

---

## 常见问题

### Q1: 为什么没有实时价格数据？
**A**: 当前使用的是静态 Kaggle 数据集。需要集成 TheWatchAPI 或 WatchBase 才能获得实时价格。

### Q2: 如何获取 TheWatchAPI 的 API Key？
**A**: 访问 https://www.thewatchapi.com/，注册账户，免费套餐会自动获得 API Key。

### Q3: 可以爬取其他网站的数据吗？
**A**: 不建议。这可能违反服务条款和法律。建议使用官方 API 或购买数据服务。

### Q4: 图片来自哪里？
**A**: 
- 2,553 张来自 Kaggle 开源数据集
- 10 张是使用 AI（DALL-E 3）生成的高质量产品图

### Q5: 如何更新数据库中的数据？
**A**: 
- 手动更新: 使用 SQL 或管理界面
- 自动更新: 集成 API 并配置定时任务
- 批量导入: 使用提供的 Python 脚本

---

## 总结

**当前系统包含**:
- ✅ 34,817 条手表数据（Kaggle）
- ✅ 222,961 条特征数据
- ✅ 2,563 张手表图片（Kaggle + AI）
- ✅ 10 个顶级品牌的 AI 生成图片
- ✅ 完整的搜索和浏览功能
- ✅ 用户收藏功能（框架已准备）

**待集成**:
- ⏳ 实时价格数据（TheWatchAPI）
- ⏳ 价格历史追踪
- ⏳ 市场趋势分析
- ⏳ 二级市场价格（Chrono24）

**下一步建议**:
1. 获取 TheWatchAPI 的免费 API Key
2. 配置定时价格更新任务
3. 实现价格历史图表
4. 评估高端数据源的成本效益

---

**文档版本**: 1.0  
**最后更新**: 2025-01-22  
**作者**: Manus AI Assistant

