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
	const monitoringFor: number = getDatabaseNow() - monitoringSince;
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
