import type { NodeFuckUp } from '$lib/server/fetch-data/interfaces';
import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
import { Redis } from '@upstash/redis';
import { REDIS_URL, REDIS_TOKEN } from '$env/static/private';

const SEVEN_DAYS = 604800;

export class Database {
	#getNow(): number {
		return Math.floor(new Date().getTime() / 1000);
	}
	#redis;

	constructor() {
		this.#redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
	}

	async isCacheValid(): Promise<boolean> {
		const now = this.#getNow();
		const lastCached = await this.#redis.get<number>('lastCached');

		if (lastCached === null) {
			return false;
		}
		return lastCached > now;
	}

	async getResponseFromCache(): Promise<SuperhubNodes> {
		const cached = await this.#redis.get<SuperhubNodes>('cached');

		if (cached === null) {
			throw new Error('No cache available for responding with it');
		}
		return cached;
	}

	async saveResponseToCache(response: SuperhubNodes): Promise<void> {
		await this.#redis.set('cached', response, { ex: SEVEN_DAYS });
		await this.#redis.set('lastCached', this.#getNow());
	}

	async fuckUpStart(nodeName: string): Promise<void> {
		const key = `node:${nodeName}:fuckUps`;

		const lastFuckUp: NodeFuckUp | null = await this.#redis.lindex(key, -1);
		if (lastFuckUp !== null && !lastFuckUp.isEnded) return;
		await this.#redis.lpush<NodeFuckUp>(key, { start: this.#getNow(), end: 0, isEnded: false });
	}

	async fuckUpStop(nodeName: string): Promise<void> {
		const key = `node:${nodeName}:fuckUps`;

		const lastFuckUp: NodeFuckUp = await this.#redis.lindex(key, -1);
		if (lastFuckUp.isEnded) return; // races <3
		lastFuckUp.end = this.#getNow();
		lastFuckUp.isEnded = true;
		await this.#redis.lset<NodeFuckUp>(key, -1, lastFuckUp);
	}

	async getFuckUps(nodeName: string): Promise<NodeFuckUp[]> {
		return this.#redis.lrange<NodeFuckUp>(`node:${nodeName}:fuckUps`, 0, -1);
	}

	async foundServer(name: string): Promise<void> {
		await this.#redis.set(`node:${name}:monitoringSince`, this.#getNow(), { ex: SEVEN_DAYS, nx: true });
	}

	async getMonitoringSince(nodeName: string): Promise<number> {
		const result = await this.#redis.get<number>(`node:${nodeName}:monitoringSince`);
		if (result !== null) return result;
		await this.foundServer(nodeName);
		return this.#getNow();
	}
}
