import type { FetchedKumaData } from '$lib/server/parse-kuma/interfaces';
import { getInternalSuperhubNodesData } from '$lib/server/parse-kuma/get-data';
import { getDownNodes } from '$lib/server/parse-kuma/get-down-nodes';

export async function fetchKumaNodesData(): Promise<FetchedKumaData> {
	const internalData = await getInternalSuperhubNodesData();
	const downNodes = await getDownNodes(internalData.publicGroupList[1].monitorList);

	return internalData.publicGroupList[1].monitorList.map((node) => ({
		id: node.id,
		name: node.name,
		isDown: downNodes.includes(node.id)
	}));
}
