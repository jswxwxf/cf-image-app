import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "AI Image Analyzer | 智能图像分析仪",
	description: "使用 Cloudflare Workers AI 深度分析你的每一张图片。支持 JPG, PNG, WebP 格式的多图并行上传。",
	keywords: ["AI", "Image Analysis", "Cloudflare", "Workers AI", "Next.js", "Tailwind CSS"],
	authors: [{ name: "Next.js AI App" }],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="zh-CN">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
				{children}
			</body>
		</html>
	);
}
