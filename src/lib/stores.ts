import type { SuperhubNodes, SuperhubNode } from '$lib/server/fetch-data/interfaces';
import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { calculateTotalDowntime, getDatabaseNow } from '$lib/utils';

export const nodes = writable<SuperhubNodes | Error>([]);
export const sortNodesBy = writable<
	| 'uptime-percent'
	| 'name'
	| 'fuck-ups-count'
	| 'total-downtime'
	| 'last-downtime'
	| 'first-noticed'
>();

sortNodesBy.subscribe((sortBy) => {
	const nodesStoreValue = get(nodes);
	if (
		nodesStoreValue instanceof Error ||
		nodesStoreValue.messages !== undefined ||
		sortBy === undefined
	)
		return;

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
		const fuckUpsCountComparison = compareTwoValues(nodeA.fuckUps.length, nodeB.fuckUps.length);
		switch (sortBy) {
			case 'uptime-percent':
				return compareTwoValues(nodeA.uptime, nodeB.uptime);
			case 'name':
				return compareTwoValues(nodeA.name, nodeB.name);
			case 'fuck-ups-count':
				return fuckUpsCountComparison === 0 ? 1 : fuckUpsCountComparison === 1 ? 0 : -1;
			case 'total-downtime':
				return compareTwoValues(
					calculateTotalDowntime(nodeA.fuckUps),
					calculateTotalDowntime(nodeB.fuckUps)
				);
			case 'last-downtime':
				return compareTwoValues(parseLastDowntime(nodeA), parseLastDowntime(nodeB));
			case 'first-noticed':
				return compareTwoValues(nodeA.monitoringSince, nodeB.monitoringSince);
		}
	});
	nodes.set(nodesStoreValue);
});
