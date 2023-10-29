import type { NodeFuckUp } from '$lib/server/fetch-data/interfaces';
import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
import { Redis } from '@upstash/redis';
import { REDIS_URL, REDIS_TOKEN } from '$env/static/private';
import type { KnownNode } from '$lib/server/db/interfaces';

const SEVEN_DAYS = 604800;

export class Database {
	#redis;

	constructor() {
		this.#redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
	}

	async getResponseFromCache(): Promise<SuperhubNodes | null> {
		return await this.#redis.get<SuperhubNodes>('cached');
	}

	async saveResponseToCache(response: SuperhubNodes): Promise<void> {
		await this.#redis.set('cached', response, { ex: 180 });
	}

	async getKnownNodes(): Promise<KnownNode[]> {
		const result = await this.#redis.get<KnownNode[]>('knownNodes');
		if (result === null) return [];
		return result;
	}

	async setKnownNodes(knownNodes: KnownNode[]): Promise<void> {
		await this.#redis.set('knownNodes', knownNodes, { ex: SEVEN_DAYS });
	}

	async getFuckUps(nodeName: string): Promise<NodeFuckUp[]> {
		return (await this.#redis.lrange<NodeFuckUp>(`node:${nodeName}:fuckUps`, 0, -1)).reverse();
	}

	async getLastParsedPingTime(nodeName: string): Promise<number> {
		const result = await this.#redis.get<number>(`node:${nodeName}:lastParsedPingTime`);
		if (result === null) return 0;
		return result;
	}

	async setLastParsedPingTime(nodeName: string, lastParsedPingTime: number): Promise<void> {
		await this.#redis.set(`node:${nodeName}:lastParsedPingTime`, lastParsedPingTime);
	}

	async addFuckUp(nodeName: string, start: number, end: number | null): Promise<void> {
		const key = `node:${nodeName}:fuckUps`;

		const lastFuckUp: NodeFuckUp | null = await this.#redis.lindex(key, 0);

		let previousFuckUp: NodeFuckUp | null;
		if (lastFuckUp !== null && !lastFuckUp.isEnded)
			previousFuckUp = await this.#redis.lpop<NodeFuckUp>(key);
		else previousFuckUp = null;

		await this.#redis.lpush<NodeFuckUp>(key, {
			start: previousFuckUp === null ? start : previousFuckUp.start,
			end: previousFuckUp === null ? (end === null ? 0 : end) : previousFuckUp.end,
			isEnded: end === null
		});
	}
}
