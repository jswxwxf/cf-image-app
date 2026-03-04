/**
 * 欢迎使用 Cloudflare Workers！
 *
 * 这是一个队列消费者（Queue consumer）模板：一个能处理来自队列消息的 Worker。
 * 详情请参阅：https://developers.cloudflare.com/queues/get-started/
 *
 * - 在终端运行 `npm run dev` 启动开发服务器
 * - 访问 http://localhost:8787/ 查看 Worker 运行情况
 * - 运行 `npm run deploy` 发布你的 Worker
 *
 * 在 `wrangler.jsonc` 中为 Worker 绑定资源。添加绑定后，
 * 可以通过 `npm run cf-typegen` 重新生成 `Env` 对象的类型定义。
 *
 * 更多详情：https://developers.cloudflare.com/workers/
 */

export default {
	// 为了方便测试，你可以通过 URL 传参发送消息，例如：/?id=your-image-id
	async fetch(req, env, ctx): Promise<Response> {
		const url = new URL(req.url);
		const imageId = url.searchParams.get('id');

		if (!imageId) {
			return new Response('请提供图片 ID，例如: /?id=abc', { status: 400 });
		}

		await env.IMAGE_ANALYSIS_QUEUE.send(imageId);
		return new Response(`已向队列发送图片分析请求: ${imageId}`);
	},
	// 当一批消息准备好交付时，将调用 queue 处理函数
	async queue(batch, env): Promise<void> {
		const MAX_RETRIES = 3;

		for (let message of batch.messages) {
			const image_id = message.body as string;

			try {
				// 1. 获取图片
				const image = await env.IMAGE_APP_UPLOADS!.get(image_id);
				if (image === null) {
					throw new Error('IMAGE_NOT_FOUND');
				}

				console.log(`正在分析图片: ${image_id}...`);

				// 2. 将 R2 数据转换为 AI 模型可接受的格式
				const inputs = {
					image: Array.from(new Uint8Array(await image.arrayBuffer())),
				};

				// 3. 调用 Cloudflare Workers AI 进行图像分类
				const analysis = await env.AI!.run('@cf/microsoft/resnet-50', inputs);

				// 4. 更新 D1 数据库记录为成功
				await env.DB.prepare('UPDATE images SET completed = 1, analysis = ?1 WHERE id = ?2')
					.bind(JSON.stringify(analysis), image_id)
					.run();

				// 5. 处理完成后删除 R2 中的原始临时图片
				await env.IMAGE_APP_UPLOADS!.delete(image_id);

				// 确认消息处理完成
				message.ack();
				console.log(`图片 ${image_id} 分析完成。`);
			} catch (err) {
				console.error(`处理图片 ${image_id} 失败:`, err);

				// 处理所有失败情况：无论是 R2 找不到还是 AI 报错
				const record = await env.DB.prepare('SELECT retry_count FROM images WHERE id = ?1')
					.bind(image_id)
					.first<{ retry_count: number }>();

				const currentRetries = record?.retry_count || 0;

				if (currentRetries >= MAX_RETRIES) {
					console.warn(`图片 ${image_id} 已达到最大重试次数 (${MAX_RETRIES})，标记为失败。`);
					// 标记为完成但无分析结果（analysis = NULL），使前端停止轮询
					await env.DB.prepare('UPDATE images SET completed = 1, analysis = NULL WHERE id = ?1')
						.bind(image_id)
						.run();
					message.ack();
				} else {
					// 增加重试计数并让队列重发消息
					await env.DB.prepare('UPDATE images SET retry_count = retry_count + 1 WHERE id = ?1')
						.bind(image_id)
						.run();
					message.retry();
				}
			}
		}
	},
} satisfies ExportedHandler<Env, string>;
