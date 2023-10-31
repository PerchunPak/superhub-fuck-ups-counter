import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
import { Database } from '$lib/server/db';
import { fetchKumaNodesData } from '$lib/server/parse-kuma';
import type { NodeFuckUp } from '$lib/server/fetch-data/interfaces';
import { calculateTotalDowntime, getDatabaseNow } from '$lib/utils';
import type { KnownNode } from '$lib/server/db/interfaces';
import type { PingInformation } from '$lib/server/parse-kuma/interfaces';

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
		await addFuckUpsToDatabase(db, node.name, node.pings);
		const fuckUps = await db.getFuckUps(node.name);
		const monitoringSince = knownNodes.filter((e) => e.name === node.name)[0].foundAt;

		resultNodes.push({
			name: node.name,
			// @ts-expect-error i did the check
			isDown: fuckUps.at(-1) === undefined ? false : !fuckUps.at(-1).isEnded,
			uptime: calculateUptime(monitoringSince, fuckUps),
			monitoringSince: monitoringSince,
			fuckUps: fuckUps
		});
	}
	return resultNodes;
}

async function addFuckUpsToDatabase(db: Database, nodeName: string, pings: PingInformation[]) {
	const lastParsedPingTime = await db.getLastParsedPingTime(nodeName);
	let lastSuccessfulPingTime: number | undefined;
	let fuckUpStart: PingInformation | null = null;
	for (const ping of extractOnlyStewedPings(lastParsedPingTime, pings)) {
		if (ping.isOnline) {
			if (fuckUpStart !== null) {
				await db.addFuckUp(nodeName, fuckUpStart.time, ping.time);
				fuckUpStart = null;
			}
			lastSuccessfulPingTime = ping.time;
		} else {
			if (fuckUpStart === null) {
				fuckUpStart = ping;
			}
		}
	}

	if (fuckUpStart !== null) await db.addFuckUp(nodeName, fuckUpStart.time, null);
	if (lastSuccessfulPingTime !== undefined)
		await db.setLastParsedPingTime(nodeName, lastSuccessfulPingTime);
}

function extractOnlyStewedPings(
	lastParsedPingTime: number,
	pings: PingInformation[]
): PingInformation[] {
	const stewedPings: PingInformation[] = [];

	let counter = 0;
	// @ts-expect-error so if check would work
	let firstPing: PingInformation = { isOnline: undefined, time: undefined };
	for (const ping of pings) {
		if (lastParsedPingTime > ping.time) continue;

		if (ping.isOnline === firstPing.isOnline) counter += 1;
		else {
			firstPing = ping;
			counter = 1;
		}

		if (counter === 3) {
			stewedPings.push(firstPing);
			counter = 0;
		}
	}

	return stewedPings;
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

	describe('extract only stewed pings', () => {
		it('no pings to parse', () => {
			expect(
				extractOnlyStewedPings(0, [
					{ isOnline: true, time: 1 },
					{ isOnline: true, time: 2 },
					{ isOnline: false, time: 3 },
					{ isOnline: false, time: 4 }
				])
			).toStrictEqual([]);
		});

		it('new fuck up, no end', () => {
			expect(
				extractOnlyStewedPings(0, [
					{ isOnline: true, time: 1 },
					{ isOnline: false, time: 2 },
					{ isOnline: false, time: 3 },
					{ isOnline: false, time: 4 }
				])
			).toStrictEqual([{ isOnline: false, time: 2 }]);
		});

		it('new fuck up, throttle ping 1', () => {
			expect(
				extractOnlyStewedPings(0, [
					{ isOnline: true, time: 1 },
					{ isOnline: false, time: 2 },
					{ isOnline: false, time: 3 },
					{ isOnline: false, time: 4 },
					{ isOnline: true, time: 5 }
				])
			).toStrictEqual([{ isOnline: false, time: 2 }]);
		});

		it('new fuck up, throttle ping 2', () => {
			expect(
				extractOnlyStewedPings(0, [
					{ isOnline: true, time: 1 },
					{ isOnline: false, time: 2 },
					{ isOnline: false, time: 3 },
					{ isOnline: false, time: 4 },
					{ isOnline: true, time: 5 },
					{ isOnline: false, time: 6 }
				])
			).toStrictEqual([{ isOnline: false, time: 2 }]);
		});

		it('new fuck up with end', () => {
			expect(
				extractOnlyStewedPings(0, [
					{ isOnline: true, time: 1 },
					{ isOnline: false, time: 2 },
					{ isOnline: false, time: 3 },
					{ isOnline: false, time: 4 },
					{ isOnline: true, time: 5 },
					{ isOnline: true, time: 6 },
					{ isOnline: true, time: 7 }
				])
			).toStrictEqual([
				{ isOnline: false, time: 2 },
				{ isOnline: true, time: 5 }
			]);
		});
	});

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
