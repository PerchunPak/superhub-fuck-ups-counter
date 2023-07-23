import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
import { Database } from '$lib/server/db';
import { fetchKumaNodesData } from '$lib/server/parse-kuma';
import type { NodeFuckUp } from '$lib/server/fetch-data/interfaces';
import { calculateTotalDowntime } from '$lib/utils';

export async function getNodesData(): Promise<SuperhubNodes> {
	const db = new Database();

	if (await db.isCacheValid()) {
		return await db.getResponseFromCache();
	}

	const response = await fetchNewResponse(db);
	await db.saveResponseToCache(response);
	return response;
}

async function fetchNewResponse(db: Database): Promise<SuperhubNodes> {
	const fromKuma = await fetchKumaNodesData();

	const resultNodes: SuperhubNodes = [];
	for (const node of fromKuma) {
		await db.foundServer(node.name);
		if (node.isDown) {
			await db.fuckUpStart(node.name);
		}

		const fuckUps = await db.getFuckUps(node.name);
		if (!node.isDown && fuckUps.length > 0 && !fuckUps.slice(-1)[0].isEnded) {
			await db.fuckUpStop(node.name);
		}
		const monitoringSince = await db.getMonitoringSince(node.name);

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
	return (monitoringSince * 100) / calculateTotalDowntime(fuckUps);
}
