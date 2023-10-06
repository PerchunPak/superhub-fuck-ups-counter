import type { InternalKumaNodeData } from '$lib/server/parse-kuma/interfaces';

export async function getDownNodes(nodes: InternalKumaNodeData[]): Promise<number[]> {
	const result = await fetch('https://kuma.perchun.it/api/status-page/heartbeat/superhub');
	const json = await result.json();

	return nodes
		.filter((node) => json.heartbeatList[node.id].slice(-1)[0].status !== 1)
		.map((node) => node.id);
}
