import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { uploadImageForAnalysis, retrieveImageAnalysisQuery } from "@/lib/images";
import type { ImageQueryResult } from "@/types";

/**
 * 极简上传 API：直接将文件存入 R2，不带后缀名
 * 遵循 KISS 原则，由存储桶元数据处理内容类型
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();

    const formData = await request.formData();
    const files = formData.getAll("files");
    const results = [];

    for (const fileCandidate of files) {
      if (fileCandidate instanceof File) {
        const result = await uploadImageForAnalysis(fileCandidate, env);
        results.push(result);
      }
    }

    return NextResponse.json(
      { message: "上传成功，正在后台进行 AI 分析", results },
      { status: 201 }
    );
  } catch (error) {
    console.error("上传 API 异常:", error);
    return NextResponse.json({ error: "上传处理失败" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    const searchParams = request.nextUrl.searchParams;
    const imageIds = searchParams.get("image_ids")?.split(",");

    if (!imageIds || imageIds.length === 0) {
      return NextResponse.json({ error: "未提供图像 ID" }, { status: 400 });
    }

    const allResults = await retrieveImageAnalysisQuery(imageIds, env);

    if (allResults.length === 0) {
      return NextResponse.json({ error: "未找到对应的图像记录" }, { status: 404 });
    }

    const imageAnalysis = allResults.map((row: ImageQueryResult) => ({
      id: row.id,
      analysis: row.analysis ? JSON.parse(row.analysis as string) : false,
    }));

    return NextResponse.json(imageAnalysis);
  } catch (error) {
    console.error("获取分析结果 API 异常:", error);
    return NextResponse.json({ error: "获取分析结果失败" }, { status: 500 });
  }
}
