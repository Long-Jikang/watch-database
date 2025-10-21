#!/usr/bin/env python3
"""
批量上传手表图片到 S3 并更新数据库
使用 Kaggle 数据集的 2,553 张真实手表图片
"""

import os
import sys
import csv
import mysql.connector
from urllib.parse import urlparse
import subprocess
import time

# 从环境变量获取数据库连接信息
DATABASE_URL = os.environ.get('DATABASE_URL', '')
if not DATABASE_URL:
    print("错误: 未找到 DATABASE_URL 环境变量")
    sys.exit(1)

# 解析数据库 URL
parsed = urlparse(DATABASE_URL)
db_config = {
    'host': parsed.hostname,
    'port': parsed.port or 3306,
    'user': parsed.username,
    'password': parsed.password,
    'database': parsed.path.lstrip('/'),
}

# 图片目录
KAGGLE_IMAGES_DIR = "/home/ubuntu/watches/watches/images"
METADATA_FILE = "/home/ubuntu/watches/watches/metadata.csv"

def upload_to_s3(image_path, s3_key):
    """使用 manus-upload-file 上传图片到 S3"""
    try:
        result = subprocess.run(
            ['manus-upload-file', image_path],
            capture_output=True,
            text=True,
            check=True
        )
        # 输出格式: https://storage.example.com/path/to/file.jpg
        url = result.stdout.strip()
        return url
    except subprocess.CalledProcessError as e:
        print(f"上传失败: {e.stderr}")
        return None

def main():
    print("开始批量上传手表图片...")
    print(f"图片目录: {KAGGLE_IMAGES_DIR}")
    print(f"元数据文件: {METADATA_FILE}")
    
    # 检查文件是否存在
    if not os.path.exists(KAGGLE_IMAGES_DIR):
        print(f"错误: 图片目录不存在: {KAGGLE_IMAGES_DIR}")
        sys.exit(1)
    
    if not os.path.exists(METADATA_FILE):
        print(f"错误: 元数据文件不存在: {METADATA_FILE}")
        sys.exit(1)
    
    # 连接数据库
    print("\n连接数据库...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    # 读取元数据
    print("\n读取元数据...")
    metadata = []
    with open(METADATA_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            metadata.append(row)
    
    print(f"找到 {len(metadata)} 条图片元数据")
    
    uploaded_count = 0
    matched_count = 0
    failed_count = 0
    
    for idx, row in enumerate(metadata, 1):
        brand = row.get('brand', '').strip()
        name = row.get('name', '').strip()
        image_name = row.get('image_name', '').strip()
        
        if not image_name:
            continue
        
        image_path = os.path.join(KAGGLE_IMAGES_DIR, image_name)
        
        if not os.path.exists(image_path):
            print(f"[{idx}/{len(metadata)}] 图片不存在: {image_path}")
            failed_count += 1
            continue
        
        print(f"\n[{idx}/{len(metadata)}] 处理: {brand} - {name}")
        
        # 上传到 S3
        print(f"  上传图片: {image_name}")
        s3_url = upload_to_s3(image_path, f"watches/{image_name}")
        
        if not s3_url:
            print(f"  上传失败")
            failed_count += 1
            continue
        
        uploaded_count += 1
        print(f"  上传成功: {s3_url}")
        
        # 在数据库中查找匹配的手表
        # 策略: 根据品牌和名称模糊匹配
        if brand:
            query = """
                SELECT id, name, brand 
                FROM watches 
                WHERE LOWER(brand) = LOWER(%s)
                AND (
                    LOWER(name) LIKE CONCAT('%%', LOWER(%s), '%%')
                    OR LOWER(%s) LIKE CONCAT('%%', LOWER(name), '%%')
                )
                LIMIT 1
            """
            cursor.execute(query, (brand, name, name))
            result = cursor.fetchone()
            
            if result:
                watch_id = result['id']
                print(f"  匹配到手表 #{watch_id}: {result['brand']} - {result['name']}")
                
                # 更新图片 URL
                update_query = "UPDATE watches SET imageUrl = %s WHERE id = %s"
                cursor.execute(update_query, (s3_url, watch_id))
                conn.commit()
                
                matched_count += 1
                print(f"  已更新图片 URL")
            else:
                print(f"  未找到匹配的手表")
        
        # 限速（避免 S3 API 限流）
        time.sleep(0.2)
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*60)
    print("批量上传完成！")
    print(f"总计: {len(metadata)} 张图片")
    print(f"上传成功: {uploaded_count} 张")
    print(f"匹配成功: {matched_count} 条记录")
    print(f"失败: {failed_count} 张")
    print("="*60)

if __name__ == '__main__':
    main()

