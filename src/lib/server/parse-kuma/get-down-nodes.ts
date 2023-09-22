import type { InternalKumaNodeData } from '$lib/server/parse-kuma/interfaces';
import randUserAgent from "rand-user-agent";

export async function getDownNodes(nodes: InternalKumaNodeData[]): Promise<number[]> {
	const userAgent = randUserAgent("desktop");
	const result = await fetch('https://status.superhub.host/api/status-page/heartbeat/superhub', {
		headers: {
			'User-Agent': userAgent,
			Accept: 'application/json, text/plain, */*',
			'Accept-Language': 'en-US,en;q=0.5',
			'Alt-Used': 'status.superhub.host',
			'Sec-Fetch-Dest': 'empty',
			'Sec-Fetch-Mode': 'cors',
			'Sec-Fetch-Site': 'same-origin',
			Pragma: 'no-cache',
			'Cache-Control': 'no-cache'
		},
		referrer: 'https://status.superhub.host/status/superhub',
		method: 'GET'
	});
	const json = await result.json();

	return nodes
		.filter((node) => json.heartbeatList[node.id].slice(-1)[0].status !== 1)
		.map((node) => node.id);
}
