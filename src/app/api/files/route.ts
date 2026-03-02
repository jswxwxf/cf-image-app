import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

/**
 * 极简上传 API：直接将文件存入 R2，不带后缀名
 * 遵循 KISS 原则，由存储桶元数据处理内容类型
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    const bucket = env.image_app_uploads;

    if (!bucket) {
      return NextResponse.json({ error: "未找到 R2 存储桶绑定" }, { status: 500 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files");

    for (const fileCandidate of files) {
      if (fileCandidate instanceof File) {
        const uuid = crypto.randomUUID();
        // 直接使用原生 UUID 作为 Key
        await bucket.put(uuid, fileCandidate);
      }
    }

    return NextResponse.json({ message: "文件上传成功" }, { status: 201 });
  } catch (error) {
    console.error("上传 API 异常:", error);
    return NextResponse.json({ error: "上传处理失败" }, { status: 500 });
  }
}

