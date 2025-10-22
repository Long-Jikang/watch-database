# TheWatchAPI 集成方案

## API 概述

TheWatchAPI 提供免费的手表数据和价格 API，包括：

### 可用的 API 端点

1. **品牌列表** (Brand List)
   - 端点: `GET https://api.thewatchapi.com/v1/brand/list`
   - 参数: `api_token`
   - 返回: 所有品牌列表

2. **型号列表** (Model List)
   - 端点: `GET https://api.thewatchapi.com/v1/model/list`
   - 参数: `brand`, `api_token`
   - 返回: 指定品牌的所有型号

3. **参考号列表** (Reference List)
   - 端点: `GET https://api.thewatchapi.com/v1/reference/list`
   - 参数: `brand`, `api_token`
   - 返回: 指定品牌的所有参考号

4. **型号搜索** (Model Search) - 高使用率
   - 端点: `GET https://api.thewatchapi.com/v1/model/search`
   - 参数: 
     - `search`: 搜索关键词
     - `search_attributes`: model
     - `case_material`: 表壳材质
     - `api_token`
   - 返回: 详细的手表信息，包括：
     - brand（品牌）
     - reference_number（参考号）
     - model（型号）
     - movement（机芯类型）
     - year_of_production（生产年份）
     - case_material（表壳材质）
     - case_diameter（表径）
     - description（详细描述）
     - last_updated（最后更新时间）

5. **历史价格** (Historical Prices) - BETA
   - Brand Price History
   - Model Price History
   - Reference Price History

## 免费套餐

- 每日 25 次 API 请求
- 无需信用卡
- 即时访问

## 集成计划

### 第一阶段：基础集成
1. 注册 TheWatchAPI 账号获取 API Token
2. 在后端添加 API 调用函数
3. 实现品牌和型号同步

### 第二阶段：数据增强
1. 使用 Model Search API 获取详细信息
2. 更新现有数据库中的手表描述
3. 添加生产年份、机芯类型等字段

### 第三阶段：价格追踪
1. 接入历史价格 API
2. 定时更新价格数据
3. 实现价格趋势图

## 使用示例

```typescript
// 搜索 Rolex Daytona
const response = await fetch(
  'https://api.thewatchapi.com/v1/model/search?search=rolex daytona&search_attributes=model&case_material=steel&api_token=YOUR_TOKEN'
);
const data = await response.json();
```

## 注意事项

- 免费套餐限制：每日 25 次请求
- 需要合理规划 API 调用频率
- 建议使用缓存机制减少 API 调用
- 价格数据为参考价格（asking prices），非实际成交价

