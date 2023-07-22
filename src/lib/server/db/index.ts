import type { NodeFuckUp } from '$lib/server/fetch-data/interfaces';
import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
import { kv } from '@vercel/kv';

export class Database {
	#getNow(): number {
		return Math.floor(new Date().getTime() / 1000);
	}

	async isCacheValid(): Promise<boolean> {
		const now = this.#getNow();
		const lastCached = await kv.get<number>('lastCached');

		if (lastCached === null) {
			return false;
		}
		return lastCached > now;
	}

	async getResponseFromCache(): Promise<SuperhubNodes> {
		const cached = await kv.get<SuperhubNodes>('cached');

		if (cached === null) {
			throw new Error('No cache available for responding with it');
		}
		return cached;
	}

	async saveResponseToCache(response: SuperhubNodes): Promise<void> {
		await kv.set('cached', response);
		await kv.set('lastCached', this.#getNow());
	}

	async fuckUpStart(nodeName: string): Promise<void> {
		const key = `node:${nodeName}:fuckUps`;

		const lastFuckUp: NodeFuckUp | null = await kv.lindex(key, -1);
		if (lastFuckUp !== null && !lastFuckUp.isEnded) return;
		await kv.lpush<NodeFuckUp>(key, { start: this.#getNow(), end: 0, isEnded: false });
	}

	async fuckUpStop(nodeName: string): Promise<void> {
		const key = `node:${nodeName}:fuckUps`;

		const lastFuckUp: NodeFuckUp = await kv.lindex(key, -1);
		if (lastFuckUp.isEnded) return; // races <3
		lastFuckUp.isEnded = true;
		await kv.lset<NodeFuckUp>(key, -1, lastFuckUp);
	}

	async getFuckUps(nodeName: string): Promise<NodeFuckUp[]> {
		return kv.lrange<NodeFuckUp>(`node:${nodeName}:fuckUps`, 0, -1);
	}

	async foundServer(name: string): Promise<void> {
		await kv.setnx(`node:${name}:monitoringSince`, this.#getNow());
	}

	async getMonitoringSince(nodeName: string): Promise<number> {
		const result = await kv.get<number>(`node:${nodeName}:monitoringSince`);
		if (result !== null) return result;
		await this.foundServer(nodeName);
		return this.#getNow();
	}
}
