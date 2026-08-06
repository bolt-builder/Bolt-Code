import { Anthropic } from "@anthropic-ai/sdk"
import workerpool from "workerpool"

import { countTokensResultSchema } from "../workers/types"
import { tiktoken } from "./tiktoken"

let pool: workerpool.Pool | undefined = undefined

export type CountTokensOptions = {
	useWorker?: boolean
}

export async function countTokens(
	content: Anthropic.Messages.ContentBlockParam[],
	{ useWorker = true }: CountTokensOptions = {},
): Promise<number> {
	// Lazily create the worker pool if it doesn't exist.
	if (useWorker && typeof pool === "undefined") {
		pool = workerpool.pool(__dirname + "/workers/countTokens.js", {
			maxWorkers: 1,
			maxQueueSize: 10,
		})
	}

	// If the worker pool doesn't exist or the caller doesn't want to use it
	// then, use the non-worker implementation.
	if (!useWorker || !pool) {
		return tiktoken(content)
	}

	try {
		const data = await pool.exec("countTokens", [content])
		const result = countTokensResultSchema.parse(data)

		if (!result.success) {
			throw new Error(result.error)
		}

		return result.count
	} catch (error) {
		console.error(error)

		// Most rejections here are transient and per-call (e.g. the queue is
		// full or a single task failed); fall back to the in-process
		// implementation for this call without disabling the pool, since
		// permanently disabling it would force every subsequent call onto the
		// synchronous path and block the event loop on large contexts. Only
		// dispose of the pool when its worker actually crashed/terminated,
		// and let it be recreated lazily on the next call.
		if (error instanceof Error && /terminated/i.test(error.message)) {
			const failedPool = pool
			pool = undefined
			void failedPool.terminate(true).catch(() => {})
		}

		return tiktoken(content)
	}
}
