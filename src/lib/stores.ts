import type { SuperhubNodes, SuperhubNode } from '$lib/server/fetch-data/interfaces';
import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { calculateTotalDowntime } from '$lib/utils';

export const nodes = writable<SuperhubNodes | Error>([]);
export const sortNodesBy = writable<
	| 'Uptime percent'
	| 'Name'
	| 'Count of fuck-ups'
	| 'Total downtime'
	| 'Last downtime'
	| 'First noticed'
>();

sortNodesBy.subscribe((sortBy) => {
	const nodesStoreValue = get(nodes);
	if (
		nodesStoreValue instanceof Error ||
		nodesStoreValue.messages !== undefined ||
		sortBy === undefined
	) return;

	function compareTwoValues(a: any, b: any): -1 | 0 | 1 {
		if (a < b) {
			return -1;
		}
		if (a > b) {
			return 1;
		}
		return 0;
	}

	function parseLastDowntime(node: SuperhubNode) {
		return node.fuckUps.length === 0 ? 0 : node.fuckUps.slice(-1)[0].end;
	}

	nodesStoreValue.sort((nodeA, nodeB): number => {
		switch (sortBy) {
			case 'Uptime percent':
				return compareTwoValues(nodeA.uptime, nodeB.uptime);
			case 'Name':
				return compareTwoValues(nodeA.name, nodeB.name);
			case 'Count of fuck-ups':
				return compareTwoValues(nodeA.fuckUps.length, nodeB.fuckUps.length);
			case 'Total downtime':
				return compareTwoValues(
					calculateTotalDowntime(nodeA.fuckUps),
					calculateTotalDowntime(nodeB.fuckUps)
				);
			case 'Last downtime':
				return compareTwoValues(parseLastDowntime(nodeA), parseLastDowntime(nodeB));
			case 'First noticed':
				return compareTwoValues(nodeA.monitoringSince, nodeB.monitoringSince);
		}
	});
	nodes.set(nodesStoreValue);
});
