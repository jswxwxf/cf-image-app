import type { UserImage } from "@/types";

/**
 * 处理图像上传与结果映射的业务逻辑
 * @param files 选中的文件列表
 * @returns 处理后的图像列表（包含预览 URL 和分析状态）
 */
export async function uploadImages(files: FileList): Promise<UserImage[]> {
  const formData = new FormData();
  const filesArray = Array.from(files);

  // 构建上传数据并发生成本地预览
  const localPreviewImages: UserImage[] = filesArray.map((file) => {
    formData.append("files", file);
    return {
      url: URL.createObjectURL(file),
      filename: file.name,
    };
  });

  const response = await fetch("/api/files", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as any;
    throw new Error(errorData.error || "上传处理失败");
  }

  const data = (await response.json()) as any;

  // 将服务器返回的处理结果（如 ID、状态等）映射回预览列表
  return localPreviewImages.map((img) => {
    const result = data.results?.find((r: any) => r.name === img.filename);
    return {
      ...img,
      ...(result || {}),
    };
  });
}

/**
 * 获取最新图像分析状态并更新列表
 * @param images 当前已上传且可能在等待分析的图像列表
 * @returns 更新后的新图像列表（带有最新的 AI 分析结果）
 */
export async function fetchAnalysis(images: UserImage[]): Promise<UserImage[]> {
  // 提取需要查询的 ID 列表（通常是那些还没有分析结果的）
  const imageIds = images.map((img) => img.id).filter(Boolean);

  if (imageIds.length === 0) return images;

  try {
    const response = await fetch(`/api/files?image_ids=${imageIds.join(",")}`);
    if (!response.ok) return images;

    const remoteResults = (await response.json()) as Array<{
      id: string;
      analysis: any;
      completed: number;
    }>;

    // 使用函数式 map 生成更新后的列表，确保触发 React 状态更新
    return images.map((img) => {
      const match = remoteResults.find((r) => r.id === img.id);
      // 只要后端返回了已完成状态或新的分析数据，就进行同步
      if (match && (match.completed === 1 || match.analysis !== undefined)) {
        return {
          ...img,
          ...match,
        };
      }
      return img;
    });
  } catch (error) {
    console.error("同步分析状态失败:", error);
    return images;
  }
}
