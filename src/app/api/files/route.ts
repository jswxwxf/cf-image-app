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
    const results = [];

    for (const fileCandidate of files) {
      if (fileCandidate instanceof File) {
        const uuid = crypto.randomUUID();
        const buffer = await fileCandidate.arrayBuffer();

        // 1. 存储到 R2
        await bucket.put(uuid, buffer, {
          httpMetadata: { contentType: fileCandidate.type },
        });

        // 2. 调用 Workers AI 进行分析 (使用 resnet-50 模型)
        // 流行做法：直接传递 Uint8Array，不再需要 Array.from 转换
        let analysis = null;
        try {
          analysis = await env.AI.run("@cf/microsoft/resnet-50", {
            image: [...new Uint8Array(buffer)],
          });
        } catch (aiError) {
          console.error("AI 分析失败:", aiError);
          analysis = { error: "分析服务不可用" };
        }

        results.push({
          id: uuid,
          name: fileCandidate.name,
          type: fileCandidate.type,
          analysis,
        });
      }
    }

    return NextResponse.json({ message: "上传并分析完成", results }, { status: 201 });
  } catch (error) {
    console.error("上传 API 异常:", error);
    return NextResponse.json({ error: "上传处理失败" }, { status: 500 });
  }
}

