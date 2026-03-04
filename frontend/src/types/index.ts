export interface AnalysisResult {
  label: string;
  score: number;
}

/**
 * 用户图像接口定义
 * 用于前端预览与分析显示
 */
export interface UserImage {
  /**
   * 图像名称
   */
  filename: string;
  /**
   * 图像预览 URL (Blob URL 或 CDN URL)
   */
  url: string;
  /**
   * 图像分析结果 (可选)
   */
  analysis?: string | AnalysisResult[];
}

/**
 * 数据库图像查询结果接口
 */
export interface ImageQueryResult {
  id: string;
  analysis: string | null;
  completed: number;
}
