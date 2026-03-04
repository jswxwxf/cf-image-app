import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { uploadImageForAnalysis } from "@/lib/images";

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
