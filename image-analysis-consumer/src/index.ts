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
	// 当一批消息准备好交付时，将调用 queue 处理函数
	// 参考：https://developers.cloudflare.com/queues/platform/javascript-apis/#messagebatch
	async queue(batch, env): Promise<void> {
		// 队列消费者可以向互联网上的其他端点发起请求、
		// 写入 R2 对象存储、查询 D1 数据库等。
		for (let message of batch.messages) {
			// 处理每条消息（这里仅将其记录在日志中）
			console.log(`消息 ${message.id} 已处理：${JSON.stringify(message.body)}`);
		}
	},
} satisfies ExportedHandler<Env, Error>;
