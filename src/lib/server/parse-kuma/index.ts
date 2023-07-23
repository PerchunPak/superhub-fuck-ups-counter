import type { FetchedKumaData } from '$lib/server/parse-kuma/interfaces';
import { getInternalSuperhubNodesData } from '$lib/server/parse-kuma/get-data';
import { getDownNodes } from '$lib/server/parse-kuma/get-down-nodes';

export async function fetchKumaNodesData(): Promise<FetchedKumaData> {
	const internalData = await getInternalSuperhubNodesData();
	const downNodes = await getDownNodes(internalData.publicGroupList[1].monitorList);

	return internalData.publicGroupList[1].monitorList.map((node) => ({
		id: node.id,
		// @ts-expect-error it can't be null
		name: node.name.match(/(^\w+)/)[1],
		isDown: downNodes.includes(node.id)
	}));
}
