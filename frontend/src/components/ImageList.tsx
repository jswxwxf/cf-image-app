import React, { useState } from "react";
import { UserImage } from "@/types";

interface Props {
  images: Array<UserImage>;
}

export function ImageList({ images }: Props) {
  const [selectedImage, setSelectedImage] = useState<UserImage | null>(null);

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {images.map((image, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-blue-300 transition-all hover:shadow-md"
        >
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* 图像预览区域 */}
            <div
              className="w-full md:w-1/3 aspect-square relative rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200 group-hover:scale-[1.02] transition-transform cursor-zoom-in group/preview"
              onClick={() => setSelectedImage(image)}
            >
              {/* 背景模糊填充 */}
              <img
                src={image.url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110"
              />
              {/* 主体图像（不剪裁） */}
              <img
                src={image.url}
                alt={image.filename}
                className="relative w-full h-full object-contain drop-shadow-md"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/5 transition-colors flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-0 group-hover/preview:opacity-100 transition-opacity drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>

            {/* 分析结果区域 */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 truncate max-w-[200px]">
                  {image.filename}
                </h3>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${image.analysis
                  ? "bg-green-50 text-green-600 border-green-100"
                  : "bg-blue-50 text-blue-600 border-blue-100"
                  }`}>
                  {image.analysis ? "分析完成" : "等待分析"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 min-h-[100px]">
                {!image.analysis ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-2 py-4">
                    <div className="flex items-center space-x-2 text-blue-500">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm font-medium animate-pulse">AI 正在深度分析中...</span>
                    </div>
                    <p className="text-xs italic text-slate-400 text-center px-6">
                      正在通过 Workers AI 进行深度分析，稍后请刷新查看结果...
                    </p>
                  </div>
                ) : typeof image.analysis === 'string' ? (
                  <div className="text-slate-600 text-sm">
                    {image.analysis}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.isArray(image.analysis) && image.analysis.slice(0, 3).map((item, i: number) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-500">
                          <span className="uppercase tracking-wider">{item.label}</span>
                          <span>{(item.score * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                            style={{ width: `${item.score * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 全图查看器 Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" />

          {/* 容器 */}
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <button
              className="absolute top-0 right-0 m-4 p-2 text-white/50 hover:text-white transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative max-w-full max-h-full overflow-hidden flex items-center justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300 shadow-2xl rounded-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <p className="mt-4 text-white/70 font-medium tracking-wide">
              {selectedImage.filename}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
