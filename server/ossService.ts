import OSS from 'ali-oss';

/**
 * 阿里云OSS服务类
 * 提供图片上传、下载、删除等OSS操作功能
 */
export class OSSService {
  private client: OSS;
  private bucketName: string;
  private endpoint: string;

  constructor() {
    // 从环境变量获取配置
    this.endpoint = process.env.ALIYUN_OSS_ENDPOINT || 'http://oss-cn-hongkong.aliyuncs.com';
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    this.bucketName = process.env.ALIYUN_OSS_BUCKET_NAME || 'finora-covers';

    // 检查必要的环境变量
    if (!accessKeyId || !accessKeySecret) {
      throw new Error('阿里云OSS配置缺失：请设置ALIYUN_ACCESS_KEY_ID和ALIYUN_ACCESS_KEY_SECRET环境变量');
    }

    // 初始化OSS客户端
    this.client = new OSS({
      endpoint: this.endpoint,
      accessKeyId,
      accessKeySecret,
      bucket: this.bucketName,
    });
  }

  /**
   * 检查图片是否存在于OSS中
   * @param imagePath 图片路径
   * @returns 是否存在
   */
  async checkImageExistsFromFileName(imagePath: string | null): Promise<boolean> {
    if (!imagePath) {
      return false;
    }

    try {
      await this.client.head(imagePath);
      return true;
    } catch (error) {
      if ((error as any).code === 'NoSuchKey') {
        return false;
      }
      console.error('检查OSS图片存在性失败:', error);
      return false;
    }
  }

  /**
   * 生成OSS签名URL用于临时访问
   * @param imagePath 图片路径
   * @param expires 过期时间（秒），默认3600秒（1小时）
   * @returns 签名URL或null
   */
  async generateSignedUrl(imagePath: string | null): Promise<string | null> {
    if (!imagePath) {
      return null;
    }

    try {
      // 先检查图片是否存在于OSS中
      const exists = await this.checkImageExistsFromFileName(imagePath);
      if (!exists) {
        console.log(`图片不存在于OSS中: ${imagePath}`);
        return null;
      }

      // 生成签名URL
      const result = await this.client.signatureUrl(imagePath, {
        expires: 3600, // 1小时
        method: 'GET',
      });

      return result;
    } catch (error) {
      console.error('生成OSS签名URL失败:', error);
      return null;
    }
  }

  /**
   * 上传图片到OSS
   * @param filePath 本地文件路径
   * @param ossPath OSS存储路径
   * @returns 是否成功
   */
  async uploadImage(filePath: string, ossPath: string): Promise<boolean> {
    try {
      await this.client.put(ossPath, filePath);
      return true;
    } catch (error) {
      console.error('上传图片到OSS失败:', error);
      return false;
    }
  }

  /**
   * 从OSS删除图片
   * @param ossPath OSS存储路径
   * @returns 是否成功
   */
  async deleteImage(ossPath: string): Promise<boolean> {
    try {
      await this.client.delete(ossPath);
      return true;
    } catch (error) {
      console.error('从OSS删除图片失败:', error);
      return false;
    }
  }

  /**
   * 获取图片的公开URL（如果设置了公开读取）
   * @param imagePath 图片路径
   * @returns 公开URL或null
   */
  getPublicUrl(imagePath: string | null): string | null {
    if (!imagePath) {
      return null;
    }

    try {
      // 检查图片是否存在于OSS中
      // 这里我们假设图片存在，因为公开URL不需要签名
      return `https://${this.bucketName}.${this.endpoint.replace('http://', '')}/${imagePath}`;
    } catch (error) {
      console.error('生成OSS公开URL失败:', error);
      return null;
    }
  }

  /**
   * 批量检查图片是否存在
   * @param imagePaths 图片路径数组
   * @returns 存在性结果映射
   */
  async batchCheckImageExists(imagePaths: (string | null)[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const path of imagePaths) {
      if (path) {
        results[path] = await this.checkImageExistsFromFileName(path);
      }
    }
    
    return results;
  }

  /**
   * 批量生成签名URL
   * @param imagePaths 图片路径数组
   * @returns 签名URL映射
   */
  async batchGenerateSignedUrls(imagePaths: (string | null)[]): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};
    
    for (const path of imagePaths) {
      if (path) {
        results[path] = await this.generateSignedUrl(path);
      }
    }
    
    return results;
  }
}

// 创建全局OSS服务实例
export const ossService = new OSSService();