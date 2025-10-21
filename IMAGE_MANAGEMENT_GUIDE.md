# 手表图片管理指南

## 当前状态

✅ **已完成**：
- 所有手表都有占位图（蓝色背景 + 品牌名称）
- 前端完整支持图片显示
- 数据库已包含 `imageUrl` 字段

📊 **数据统计**：
- 总手表数：34,817 条（已清理无效数据）
- 已有图片：34,817 条（占位图）
- 可用真实图片：2,553 张（Kaggle 数据集）

---

## 图片来源

### 1. Kaggle 手表图片数据集（已下载）

**位置**：`/home/ubuntu/watches/watches/images/`

**数量**：2,553 张高质量手表图片

**元数据**：`/home/ubuntu/watches/watches/metadata.csv`

**格式**：
```csv
,brand,name,price,image_name
0,Versace,Greca Logo Watch," $2,780.00",0.jpg
1,Fitbit,Fitbit Sense 2 Smart Watch, $449.95,1.jpg
```

**使用方法**：
1. 将图片上传到 S3 存储
2. 更新数据库中的 `imageUrl` 字段

---

## 图片上传方案

### 方案 1：批量上传 Kaggle 图片（推荐）

```bash
# 1. 创建上传脚本
cd /home/ubuntu/watch-database
cat > scripts/upload_kaggle_images.ts << 'EOF'
import { storagePut } from "../server/storage";
import { getDb } from "../server/db";
import { watches } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const KAGGLE_IMAGES_DIR = "/home/ubuntu/watches/watches/images";
const METADATA_FILE = "/home/ubuntu/watches/watches/metadata.csv";

async function uploadKaggleImages() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 读取元数据
  const metadata: any[] = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(METADATA_FILE)
      .pipe(csv())
      .on("data", (row) => metadata.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`Found ${metadata.length} images in Kaggle dataset`);

  let uploaded = 0;
  
  for (const row of metadata) {
    const imagePath = path.join(KAGGLE_IMAGES_DIR, row.image_name);
    
    if (!fs.existsSync(imagePath)) {
      console.log(`Image not found: ${imagePath}`);
      continue;
    }

    try {
      // 上传到 S3
      const imageBuffer = fs.readFileSync(imagePath);
      const { url } = await storagePut(
        `watches/${row.image_name}`,
        imageBuffer,
        "image/jpeg"
      );

      // 根据品牌和名称匹配数据库中的手表
      const matchingWatches = await db
        .select({ id: watches.id })
        .from(watches)
        .where(
          sql`LOWER(${watches.brand}) = LOWER(${row.brand}) 
              AND LOWER(${watches.name}) LIKE CONCAT('%', LOWER(${row.name}), '%')`
        )
        .limit(1);

      if (matchingWatches.length > 0) {
        await db
          .update(watches)
          .set({ imageUrl: url })
          .where(eq(watches.id, matchingWatches[0].id));
        
        uploaded++;
        console.log(`Uploaded: ${row.brand} - ${row.name}`);
      }
    } catch (error) {
      console.error(`Error uploading ${row.image_name}:`, error);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nTotal uploaded: ${uploaded} images`);
}

uploadKaggleImages().catch(console.error);
EOF

# 2. 安装依赖
pnpm add csv-parser

# 3. 运行上传脚本
pnpm exec tsx scripts/upload_kaggle_images.ts
```

### 方案 2：手动上传单个图片

**通过 API 上传**：

```typescript
// 在 server/routers.ts 中添加
watches: router({
  // ... 现有路由
  
  uploadImage: protectedProcedure
    .input(z.object({
      watchId: z.number(),
      imageData: z.string(), // Base64 编码的图片
    }))
    .mutation(async ({ input }) => {
      const { watchId, imageData } = input;
      
      // 解码 Base64
      const buffer = Buffer.from(imageData, 'base64');
      
      // 上传到 S3
      const { url } = await storagePut(
        `watches/${watchId}.jpg`,
        buffer,
        "image/jpeg"
      );
      
      // 更新数据库
      await updateWatchImage(watchId, url);
      
      return { success: true, imageUrl: url };
    }),
}),
```

### 方案 3：使用外部 API 获取图片

**Unsplash API**（免费）：

```bash
# 设置环境变量
export UNSPLASH_ACCESS_KEY="your_access_key"

# 运行脚本
cd /home/ubuntu/watch-database
pnpm exec tsx << 'EOF'
import { fetchAndUpdateImagesFromUnsplash } from "./server/imageManager";

// 每次获取 10 张图片（免费套餐限制：50次/小时）
fetchAndUpdateImagesFromUnsplash(10)
  .then(count => console.log(`Updated ${count} images`))
  .catch(console.error);
EOF
```

---

## 图片规格建议

- **格式**：JPEG 或 WebP
- **尺寸**：400x500px（4:5 比例）
- **文件大小**：< 200KB
- **质量**：80-90%

---

## 批量更新示例

### 更新特定品牌的图片

```sql
-- 为 Rolex 手表设置统一占位图
UPDATE watches 
SET imageUrl = 'https://placehold.co/400x500/1e40af/white?text=Rolex'
WHERE brand = 'Rolex';
```

### 清除所有占位图

```sql
-- 清除占位图，准备上传真实图片
UPDATE watches 
SET imageUrl = NULL
WHERE imageUrl LIKE '%placehold.co%';
```

---

## 下一步建议

1. **优先级 1**：上传 Kaggle 数据集的 2,553 张真实图片
2. **优先级 2**：为热门品牌（Rolex、Omega、Patek Philippe）使用 Unsplash API
3. **优先级 3**：提供管理界面让用户手动上传图片

---

## 注意事项

⚠️ **版权问题**：
- Kaggle 数据集使用 CC0 公共领域许可证，可商用
- Unsplash 图片需遵守其使用条款
- 避免未经授权使用品牌官方图片

⚠️ **性能优化**：
- 使用 CDN 加速图片加载
- 实现图片懒加载（已实现）
- 考虑使用 WebP 格式减小文件大小

⚠️ **存储成本**：
- S3 存储费用：约 $0.023/GB/月
- 2,553 张图片（假设每张 100KB）≈ 250MB ≈ $0.006/月

