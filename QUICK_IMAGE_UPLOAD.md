# 快速上传手表图片指南

## 当前状态

✅ **界面优化完成**：
- 全新的卡片设计，每个品牌有独特的颜色主题
- 优雅的占位图（品牌首字母 + 品牌名称）
- 响应式布局（移动端、平板、桌面）
- 流畅的悬停动画效果

📊 **可用资源**：
- 2,553 张真实手表图片（已下载到 `/home/ubuntu/watches/watches/images/`）
- 完整的元数据（品牌、名称、价格）

---

## 方案一：批量上传 Kaggle 图片（推荐）

### 步骤 1：运行上传脚本

```bash
cd /home/ubuntu/watch-database
chmod +x scripts/upload_watch_images.py
python3 scripts/upload_watch_images.py
```

**预计时间**：约 15-20 分钟（2,553 张图片）

**脚本功能**：
1. 自动上传图片到 S3
2. 根据品牌和名称智能匹配数据库中的手表
3. 更新匹配成功的手表的 `imageUrl` 字段

### 步骤 2：查看结果

访问搜索页面，查看已更新图片的手表。

---

## 方案二：手动上传单个图片

### 通过管理界面上传

1. 登录系统
2. 进入手表详情页
3. 点击"上传图片"按钮
4. 选择图片文件
5. 系统自动上传到 S3 并更新数据库

### 通过 API 上传

```bash
# 示例：为手表 #123 上传图片
curl -X POST https://your-domain.com/api/trpc/watches.uploadImage \
  -H "Content-Type: application/json" \
  -d '{
    "watchId": 123,
    "imageData": "base64_encoded_image_data"
  }'
```

---

## 方案三：使用外部 API 获取图片

### Unsplash API（免费）

**限制**：50 次/小时

**使用方法**：

```bash
# 1. 注册 Unsplash 开发者账号
# https://unsplash.com/developers

# 2. 获取 Access Key

# 3. 设置环境变量
export UNSPLASH_ACCESS_KEY="your_access_key"

# 4. 运行脚本
cd /home/ubuntu/watch-database
pnpm exec tsx << 'EOF'
import { fetchAndUpdateImagesFromUnsplash } from "./server/imageManager";

fetchAndUpdateImagesFromUnsplash(10)
  .then(count => console.log(`Updated ${count} images`))
  .catch(console.error);
EOF
```

---

## 图片规格要求

- **格式**：JPEG、PNG 或 WebP
- **推荐尺寸**：400x500px（4:5 比例）
- **最大文件大小**：2MB
- **质量**：80-90%

---

## 常见问题

### Q1: 如何查看已上传的图片数量？

```sql
SELECT 
  COUNT(*) as total_watches,
  COUNT(imageUrl) as watches_with_images,
  COUNT(*) - COUNT(imageUrl) as watches_without_images
FROM watches;
```

### Q2: 如何批量删除占位图？

```sql
-- 清除所有占位图 URL
UPDATE watches 
SET imageUrl = NULL
WHERE imageUrl LIKE '%placehold.co%';
```

### Q3: 如何为特定品牌批量设置图片？

```bash
# 示例：为所有 Rolex 手表设置统一图片
cd /home/ubuntu/watch-database
python3 << 'EOF'
import os
import mysql.connector
from urllib.parse import urlparse

DATABASE_URL = os.environ.get('DATABASE_URL')
parsed = urlparse(DATABASE_URL)
conn = mysql.connector.connect(
    host=parsed.hostname,
    port=parsed.port or 3306,
    user=parsed.username,
    password=parsed.password,
    database=parsed.path.lstrip('/')
)

cursor = conn.cursor()
cursor.execute("""
    UPDATE watches 
    SET imageUrl = 'https://your-s3-url.com/rolex-default.jpg'
    WHERE brand = 'Rolex' AND imageUrl IS NULL
""")
conn.commit()
print(f"Updated {cursor.rowcount} Rolex watches")
conn.close()
EOF
```

---

## 性能优化建议

1. **使用 CDN**：配置 CloudFront 或其他 CDN 加速图片加载
2. **图片懒加载**：已实现（`loading="lazy"`）
3. **WebP 格式**：转换图片为 WebP 格式可减小 30-50% 文件大小
4. **缓存策略**：设置合理的 Cache-Control 头

---

## 下一步

1. ✅ 运行批量上传脚本导入 2,553 张真实图片
2. ⏳ 为热门品牌（Rolex、Omega、Patek Philippe）优先上传高质量图片
3. ⏳ 实现管理界面的图片上传功能
4. ⏳ 配置 CDN 加速图片加载

---

## 技术支持

如有问题，请查看：
- 完整文档：`IMAGE_MANAGEMENT_GUIDE.md`
- API 文档：`API_INTEGRATION_GUIDE.md`
- 用户手册：`USER_GUIDE.md`

