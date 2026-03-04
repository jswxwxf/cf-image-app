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
		for (let message of batch.messages) {
			const image_id = message.body;
			const image = await env.IMAGE_APP_UPLOADS!.get(image_id);

			if (image === null) {
				console.log(`无法找到图片 ID: ${image_id}`);
				// 标记重试，可能图片还没上传完成
				message.retry();
				continue;
			}

			console.log(`正在分析图片: ${image_id}...`);

			// 将 R2 数据转换为 AI 模型可接受的格式
			const inputs = {
				image: Array.from(new Uint8Array(await image.arrayBuffer())),
			};

			// 调用 Cloudflare Workers AI 进行图像分类
			const analysis = await env.AI!.run('@cf/microsoft/resnet-50', inputs);

			// 更新 D1 数据库记录
			await env.DB.prepare('UPDATE images SET completed = 1, analysis = ?1 WHERE id = ?2')
				.bind(JSON.stringify(analysis), image_id)
				.run();

			// 处理完成后删除 R2 中的原始临时图片（如果业务需要）
			await env.IMAGE_APP_UPLOADS!.delete(image_id);

			// 确认消息处理完成，从队列中移除
			message.ack();

			console.log(`图片 ${image_id} 分析完成并已更新数据库。`);
		}
	},
} satisfies ExportedHandler<Env, string>;
