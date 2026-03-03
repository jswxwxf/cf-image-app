/**
 * 图像上传辅助函数：处理文件上传至 R2、D1 记录初始化及发送异步消息队列
 */
export async function uploadImageForAnalysis(file: File, env: any) {
  const uuid = crypto.randomUUID();
  const buffer = await file.arrayBuffer();

  // 1. 存储到 R2
  await env.IMAGE_APP_UPLOADS.put(uuid, buffer, {
    httpMetadata: { contentType: file.type },
  });

  // 2. 插入数据库记录（状态设为未完成）
  await env.DB.prepare("INSERT INTO images (id, completed) VALUES (?1, 0)")
    .bind(uuid)
    .run();

  // 3. 发送至 Queue 进行异步分析
  await env.ANALYSIS_QUEUE.send(uuid);

  return {
    id: uuid,
    name: file.name,
    type: file.type,
    status: "processing",
  };
}
