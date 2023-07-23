import type { NodeFuckUp } from '$lib/server/fetch-data/interfaces';
import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
import { Redis } from '@upstash/redis';
import { REDIS_URL, REDIS_TOKEN } from '$env/static/private';
import type { KnownNode } from '$lib/server/db/interfaces';
import { getDatabaseNow } from '$lib/utils';

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
		await this.#redis.set('cached', response, { ex: 300 });
	}

	async getKnownNodes(): Promise<KnownNode[]> {
		const result = await this.#redis.get<KnownNode[]>('knownNodes');
		if (result === null) return [];
		return result;
	}

	async setKnownNodes(knownNodes: KnownNode[]): Promise<void> {
		await this.#redis.set('knownNodes', knownNodes, { ex: SEVEN_DAYS });
	}

	async fuckUpStart(nodeName: string): Promise<void> {
		const key = `node:${nodeName}:fuckUps`;

		const lastFuckUp: NodeFuckUp | null = await this.#redis.lindex(key, -1);
		if (lastFuckUp !== null && !lastFuckUp.isEnded) return;
		await this.#redis.lpush<NodeFuckUp>(key, { start: getDatabaseNow(), end: 0, isEnded: false });
	}

	async fuckUpStop(nodeName: string): Promise<void> {
		const key = `node:${nodeName}:fuckUps`;

		const lastFuckUp: NodeFuckUp = await this.#redis.lindex(key, -1);
		if (lastFuckUp.isEnded) return; // races <3
		lastFuckUp.end = getDatabaseNow();
		lastFuckUp.isEnded = true;
		await this.#redis.lset<NodeFuckUp>(key, -1, lastFuckUp);
	}

	async getFuckUps(nodeName: string): Promise<NodeFuckUp[]> {
		return this.#redis.lrange<NodeFuckUp>(`node:${nodeName}:fuckUps`, 0, -1);
	}
}
