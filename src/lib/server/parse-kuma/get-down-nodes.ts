import type { InternalKumaNodeData } from '$lib/server/parse-kuma/interfaces';

export async function getDownNodes(nodes: InternalKumaNodeData[]): Promise<number[]> {
	const result = await fetch('https://status.superhub.host/api/status-page/heartbeat/superhub', {
		credentials: 'include',
		headers: {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
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
		method: 'GET',
		mode: 'cors'
	});
	const json = await result.json();

	return nodes
		.filter((node) => json.heartbeatList[node.id].slice(-1)[0].status !== 1)
		.map((node) => node.id);
}
