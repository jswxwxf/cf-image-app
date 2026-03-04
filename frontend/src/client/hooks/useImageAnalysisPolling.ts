import { useState, useEffect, useRef } from "react";
import { fetchAnalysis } from "@/client/services/image";
import type { UserImage } from "@/types";

/**
 * 自定义 Hook：管理已上传图像的状态并自动轮询 AI 分析结果
 */
export function useImageAnalysisPolling() {
  const [uploadedImages, setUploadedImages] = useState<UserImage[]>([]);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const hasPending = uploadedImages.some((img) => img.id && img.completed !== 1);

    if (hasPending && !pollTimerRef.current) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const updated = await fetchAnalysis(uploadedImages);
          // 只有当数据（分析结果或完成状态）真正发生变化时才更新状态
          const hasChange = updated.some(
            (img, idx) => img.completed !== uploadedImages[idx]?.completed
          );
          if (hasChange) {
            setUploadedImages(updated);
          }
        } catch (err) {
          console.error("轮询分析结果失败:", err);
        }
      }, 2000);
    }

    // 当所有分析完成或组件卸载时清理定时器
    if (!hasPending || uploadedImages.length === 0) {
      stopPolling();
    }

    return () => stopPolling();
  }, [uploadedImages]);

  return [uploadedImages, setUploadedImages] as const;
}
