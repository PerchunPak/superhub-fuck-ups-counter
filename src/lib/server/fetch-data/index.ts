import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
import { Database } from '$lib/server/db';
import { fetchKumaNodesData } from '$lib/server/parse-kuma';
import type { NodeFuckUp } from '$lib/server/fetch-data/interfaces';
import { calculateTotalDowntime, getDatabaseNow } from '$lib/utils';
import type { KnownNode } from '$lib/server/db/interfaces';

export async function getNodesData(): Promise<SuperhubNodes> {
	const db = new Database();
	const cachedResponse = await db.getResponseFromCache();

	if (cachedResponse !== null) {
		return cachedResponse;
	}

	const response = await fetchNewResponse(db);
	await db.saveResponseToCache(response);
	return response;
}

async function fetchNewResponse(db: Database): Promise<SuperhubNodes> {
	const fromKuma = await fetchKumaNodesData();
	const knownNodes = mergeKnownNodes(
		await db.getKnownNodes(),
		fromKuma.map((e) => e.name)
	);
	await db.setKnownNodes(knownNodes);

	const resultNodes: SuperhubNodes = [];
	for (const node of fromKuma) {
		if (node.isDown) {
			await db.fuckUpStart(node.name);
		}

		const fuckUps = await db.getFuckUps(node.name);
		if (!node.isDown && fuckUps.length > 0 && !fuckUps.slice(-1)[0].isEnded) {
			await db.fuckUpStop(node.name);
		}
		const monitoringSince = knownNodes.filter((e) => e.name === node.name)[0].foundAt;

		resultNodes.push({
			name: node.name,
			isDown: node.isDown,
			uptime: calculateUptime(monitoringSince, fuckUps),
			monitoringSince: monitoringSince,
			fuckUps: fuckUps
		});
	}
	return resultNodes;
}

function calculateUptime(monitoringSince: number, fuckUps: NodeFuckUp[]): number {
	// rules that are expected in production, but can be accidentally broke in tests:
	// - `now` must be bigger than `monitoringSince`
	// - `monitoringFor` must be bigger than `totalDowntime`
	const monitoringFor: number = getDatabaseNow() - monitoringSince;
	if (monitoringFor === 0) return 100; // monitoringSince is now

	return roundNumberToTwoPlacesAfterDot(
		(1 - calculateTotalDowntime(fuckUps) / monitoringFor) * 100
	);
}

function roundNumberToTwoPlacesAfterDot(num: number): number {
	return Math.round((num + Number.EPSILON) * 100) / 100;
}

function mergeKnownNodes(fromDb: KnownNode[], fromKuma: string[]): KnownNode[] {
	const merged: KnownNode[] = [];

	for (const node of fromDb) {
		if (fromKuma.includes(node.name)) {
			merged.push(node);
		}
	}

	const alreadyAddedNames: string[] = merged.map((e) => e.name);
	for (const nodeName of fromKuma) {
		if (!alreadyAddedNames.includes(nodeName)) {
			merged.push({ name: nodeName, foundAt: getDatabaseNow() });
			alreadyAddedNames.push(nodeName);
		}
	}

	return merged;
}

if (import.meta.vitest) {
	const { it, expect, describe } = import.meta.vitest;

	describe('calculate uptime', () => {
		it('no fuck-ups', () => {
			expect(calculateUptime(0, [])).toBe(100);
		});

		it('100% uptime, monitoring since is now', () => {
			expect(
				calculateUptime(getDatabaseNow(), [
					{ start: getDatabaseNow(), end: getDatabaseNow(), isEnded: true }
				])
			).toBe(100);
		});

		it('99% uptime', () => {
			expect(
				calculateUptime(getDatabaseNow() - 148800, [
					{ start: getDatabaseNow(), end: getDatabaseNow() + 1488, isEnded: true }
				])
			).toBe(99);
		});

		it('99.5% uptime', () => {
			expect(
				calculateUptime(getDatabaseNow() - 148800, [
					{ start: getDatabaseNow(), end: getDatabaseNow() + 744, isEnded: true }
				])
			).toBe(99.5);
		});

		it('many numbers after dot in uptime', () => {
			expect(
				calculateUptime(getDatabaseNow() - 3, [
					{ start: getDatabaseNow(), end: getDatabaseNow() + 1, isEnded: true }
				])
			).toBe(66.67); // it's actually 66.(6)
		});
	});

	describe('roundNumberToTwoPlacesAfterDot', () => {
		it.each([0, 1, 2, 3, 4])('round 1.01%i to 1.01', (i) => {
			expect(roundNumberToTwoPlacesAfterDot(1.01 + i / 1000)).toBe(1.01);
		});
		it.each([5, 6, 7, 8, 9])('round 1.01%i to 1.02', (i) => {
			expect(roundNumberToTwoPlacesAfterDot(1.01 + i / 1000)).toBe(1.02);
		});
	});

	describe('mergeKnownNodes', () => {
		it('in fromDb and fromKuma', () => {
			expect(
				mergeKnownNodes(
					[
						{ name: 'a', foundAt: 1 },
						{ name: 'b', foundAt: 1 },
						{ name: 'c', foundAt: 1 }
					],
					['a', 'b', 'c']
				)
			).toStrictEqual([
				{ name: 'a', foundAt: 1 },
				{ name: 'b', foundAt: 1 },
				{ name: 'c', foundAt: 1 }
			]);
		});
		it('in fromDb but not in fromKuma', () => {
			expect(
				mergeKnownNodes(
					[
						{ name: 'a', foundAt: 1 },
						{ name: 'b', foundAt: 1 },
						{ name: 'c', foundAt: 1 }
					],
					['a', 'b']
				)
			).toStrictEqual([
				{ name: 'a', foundAt: 1 },
				{ name: 'b', foundAt: 1 }
			]);
		});
		it('not in fromDb and fromKuma', () => {
			expect(
				mergeKnownNodes(
					[
						{ name: 'a', foundAt: 1 },
						{ name: 'b', foundAt: 1 }
					],
					['a', 'b']
				)
			).toStrictEqual([
				{ name: 'a', foundAt: 1 },
				{ name: 'b', foundAt: 1 }
			]);
		});
		it('not in fromDb but in fromKuma', () => {
			expect(
				mergeKnownNodes(
					[
						{ name: 'a', foundAt: 1 },
						{ name: 'b', foundAt: 1 }
					],
					['a', 'b', 'c']
				)
			).toStrictEqual([
				{ name: 'a', foundAt: 1 },
				{ name: 'b', foundAt: 1 },
				{ name: 'c', foundAt: getDatabaseNow() }
			]);
		});
	});
}
