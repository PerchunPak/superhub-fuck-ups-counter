import type { FetchedKumaData } from '$lib/server/parse-kuma/interfaces';
import { getInternalSuperhubNodesData } from '$lib/server/parse-kuma/get-data';
import { getPingsInformation } from '$lib/server/parse-kuma/get-pings-information';

export async function fetchKumaNodesData(): Promise<FetchedKumaData> {
	const internalData = await getInternalSuperhubNodesData();
	const pingsInformation = await getPingsInformation(internalData.publicGroupList[0].monitorList);

	return internalData.publicGroupList[0].monitorList.map((node) => ({
		id: node.id,
		// @ts-expect-error it can't be null
		name: node.name.match(/(^\w+)/)[1],
		pings: pingsInformation[node.id]
	}));
}
