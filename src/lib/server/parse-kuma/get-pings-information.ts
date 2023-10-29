import type { InternalKumaNodeData, PingInformation } from '$lib/server/parse-kuma/interfaces';

//              node id         list of 50 pings, (done by Kuma every minute)
type Result = { [node: number]: PingInformation[] };

export async function getPingsInformation(nodes: InternalKumaNodeData[]): Promise<Result> {
	const result = await fetch('https://kuma.perchun.it/api/status-page/heartbeat/superhub');
	const json: { heartbeatList: { [id: number]: { status: 0 | 1; time: string }[] } } =
		await result.json();

	const finalResult: Result = {};
	for (const node of nodes) {
		finalResult[node.id] = json.heartbeatList[node.id].map((heartbeat) => ({
			isOnline: !!heartbeat.status,
			time: new Date(heartbeat.time).getTime()
		}));
	}
	return finalResult;
}
