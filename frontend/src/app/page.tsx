"use client";

import React, { useState } from "react";
import { ImageList } from "@/components/ImageList";

import type { ChangeEvent } from "react";
import type { UserImage } from "@/types";

export default function Home() {
	const [uploadedImages, setUploadedImages] = useState<UserImage[]>([]);
	const [isUploading, setIsUploading] = useState(false);

	const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		setIsUploading(true);
		const formData = new FormData();

		const filesArray = Array.from(files);
		const localPreviewImages: UserImage[] = filesArray.map((file) => {
			formData.append("files", file);
			return {
				url: URL.createObjectURL(file),
				filename: file.name,
			};
		});

		try {
			const response = await fetch("/api/files", {
				method: "POST",
				body: formData,
			});

			if (response.ok) {
				const data = (await response.json()) as any;

				// 将 API 返回的分析结果映射到本地预览列表中
				const updatedImages = localPreviewImages.map(img => {
					// 根据文件名匹配返回的结果
					const result = data.results?.find((r: any) => r.name === img.filename);
					return {
						...img,
						...result
					};
				});

				setUploadedImages(updatedImages);
			}
		} catch (error) {
			console.error("上传错误:", error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
			{/* 背景装饰：柔和的浅色渐变 */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				<div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-100/40 blur-[100px] rounded-full" />
				<div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-100/40 blur-[100px] rounded-full" />
			</div>

			<div className="relative container mx-auto px-6 py-16 max-w-4xl min-h-screen flex flex-col">
				{/* 头部标题区 */}
				<header className="mb-12 text-center space-y-4">
					<h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
						AI Image Analyzer
					</h1>
					<p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
						上传你的图像，我们将通过 Cloudflare Workers AI 进行深度分析。
					</p>
				</header>

				{/* 交互核心区 */}
				<section className="flex-1">
					{uploadedImages.length === 0 ? (
						<div
							className={`group relative rounded-3xl border-2 border-dashed ${isUploading ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/50'} shadow-sm transition-all duration-300 animate-in zoom-in-95`}
						>
							<input
								type="file"
								accept="image/*"
								multiple
								onChange={handleChange}
								className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
								disabled={isUploading}
							/>
							<div className="p-12 md:p-20 flex flex-col items-center text-center space-y-6">
								<div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
									<svg className="w-10 h-10 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
									</svg>
								</div>
								<div className="space-y-2">
									<h3 className="text-xl font-bold text-slate-800">
										{isUploading ? "正在上传..." : "点击或拖拽图像至此"}
									</h3>
									<p className="text-slate-500 font-medium">
										支持多图并行上传，快速获得 AI 分析报告
									</p>
								</div>
								<button className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-semibold shadow-md shadow-blue-200 group-hover:bg-blue-700 transition-all">
									选择图片
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-8 animate-in fade-in duration-500">
							<div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
								<h2 className="text-2xl font-bold text-slate-800">分析结果</h2>
								<button
									onClick={() => setUploadedImages([])}
									className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
								>
									重新上传
								</button>
							</div>
							<ImageList images={uploadedImages} />
						</div>
					)}
				</section>

				<footer className="mt-20 py-8 text-center text-slate-400 font-medium">
					Powered by Next.js & Cloudflare Workers
				</footer>
			</div>
		</main>
	);
}
