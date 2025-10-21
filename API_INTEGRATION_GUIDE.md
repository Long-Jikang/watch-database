# Watch Database - API Integration Guide

## 概述

本系统支持与多个外部手表数据 API 集成，用于获取实时市场价格和详细规格数据。

## 支持的 API

### 1. TheWatchAPI（免费套餐）

**特点：**
- 免费套餐：每日 25 次请求
- 提供基础手表数据
- 适合小规模测试和开发

**申请步骤：**
1. 访问 [https://www.thewatchapi.com](https://www.thewatchapi.com)
2. 注册账号并申请 API Key
3. 在环境变量中设置 `THE_WATCH_API_KEY`

**使用示例：**
```typescript
// 通过 tRPC 调用
const { data } = trpc.api.testTheWatchAPI.useQuery({
  brand: "Rolex",
  model: "Submariner"
});
```

---

### 2. WatchBase DataFeed（按需付费）

**特点：**
- 按记录付费：$0.30/条
- 无月费，适合一次性批量购买
- 提供详细的产品规格数据

**申请步骤：**
1. 访问 [https://datafeed.watchbase.com](https://datafeed.watchbase.com)
2. 联系销售团队获取 API 访问权限
3. 购买所需数量的数据记录
4. 在环境变量中设置 `WATCHBASE_API_KEY`

**使用示例：**
```typescript
// 通过 tRPC 调用
const { data } = trpc.api.testWatchBase.useQuery({
  referenceNumber: "126610LN"
});
```

---

### 3. Chrono24 API（商业授权）

**特点：**
- 提供实时市场价格数据
- 需要商业授权协议
- 适合专业市场分析

**申请步骤：**
1. 访问 [https://www.chrono24.com](https://www.chrono24.com)
2. 联系商业合作部门申请 API 访问
3. 签署商业协议
4. 在环境变量中设置 `CHRONO24_API_KEY`

**使用示例：**
```typescript
// 手动触发价格更新
const { data } = trpc.api.updatePrices.useMutation();
await data.mutateAsync({ watchId: 123 });
```

---

## 环境变量配置

在项目根目录创建 `.env` 文件（或通过 Manus 平台配置）：

```bash
# TheWatchAPI
THE_WATCH_API_KEY=your_api_key_here

# WatchBase DataFeed
WATCHBASE_API_KEY=your_api_key_here

# Chrono24
CHRONO24_API_KEY=your_api_key_here
```

---

## 定时任务配置

### 自动价格更新

系统提供了定时任务接口，建议每日运行一次以更新市场价格：

```typescript
// 通过 tRPC 手动触发
const { data } = trpc.api.updateAllPrices.useMutation();
await data.mutateAsync();
```

### 使用 Cron Job

可以通过系统 cron 或外部调度工具（如 GitHub Actions）定时调用：

```bash
# 每天凌晨 2 点更新价格
0 2 * * * curl -X POST https://your-domain.com/api/trpc/api.updateAllPrices
```

---

## API 状态检查

查看当前 API 配置状态：

```typescript
const { data } = trpc.api.getStatus.useQuery();

// 返回示例：
{
  theWatchAPI: {
    configured: true,
    freeLimit: 25
  },
  watchBase: {
    configured: false,
    costPerRecord: 0.30
  },
  chrono24: {
    configured: false
  }
}
```

---

## 数据源对比

| 数据源 | 费用 | 数据类型 | 更新频率 | 推荐用途 |
|--------|------|----------|----------|----------|
| **Kaggle 数据集** | 免费 | 静态规格数据 | 一次性导入 | 基础数据库构建 |
| **TheWatchAPI** | 免费（25次/天） | 基础规格 | 实时 | 开发测试 |
| **WatchBase** | $0.30/条 | 详细规格 | 按需 | 批量数据补充 |
| **Chrono24** | 商业协议 | 市场价格 | 实时 | 价格追踪 |

---

## 最佳实践

1. **混合使用数据源**
   - 使用 Kaggle 数据集作为基础
   - 用 TheWatchAPI 补充缺失数据
   - 用 WatchBase 获取高价值手表的详细规格
   - 用 Chrono24 追踪市场价格

2. **成本控制**
   - 优先使用免费数据源
   - 仅对高价值手表使用付费 API
   - 设置每日请求限制避免超额

3. **数据质量**
   - 定期验证 API 返回数据的准确性
   - 记录数据来源以便追溯
   - 实现数据去重和冲突解决机制

---

## 故障排查

### API 请求失败

1. 检查 API Key 是否正确配置
2. 验证网络连接
3. 查看 API 配额是否用尽
4. 检查 API 服务商的状态页面

### 数据不一致

1. 检查数据源的更新时间
2. 验证数据映射逻辑
3. 查看错误日志

---

## 技术支持

如需帮助，请参考：
- [TheWatchAPI 文档](https://www.thewatchapi.com/docs)
- [WatchBase 支持](https://datafeed.watchbase.com/support)
- [Chrono24 开发者中心](https://www.chrono24.com/api)

---

## 更新日志

- **2025-10-21**: 初始版本，支持三个主要 API 集成

