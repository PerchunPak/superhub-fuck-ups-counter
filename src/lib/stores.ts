import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
import type { Writable, Subscriber, Invalidator, Unsubscriber, Updater } from 'svelte/store';
import { derived, writable } from 'svelte/store';
import { calculateTotalDowntime } from '$lib/utils';

export const sortNodesBy = writable<
	| 'uptime-percent'
	| 'name'
	| 'fuck-ups-count'
	| 'total-downtime'
	| 'last-downtime'
	| 'first-noticed'
>('uptime-percent');

class NodesListClass implements Writable<SuperhubNodes | Error> {
	#nodes;
	#sortedNodes;

	constructor() {
		this.#nodes = writable<SuperhubNodes | Error>([]);
		this.#sortedNodes = derived(
			[this.#nodes, sortNodesBy],
			([$nodes, $sortNodesBy]): SuperhubNodes => {
				if (
					$nodes instanceof Error ||
					$nodes.messages !== undefined ||
					$sortNodesBy === undefined
				)
					return [];

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

				$nodes.sort((nodeA, nodeB): number => {
					switch ($sortNodesBy) {
						case 'uptime-percent':
							return compareTwoValues(nodeA.uptime, nodeB.uptime);
						case 'name':
							return compareTwoValues(nodeA.name, nodeB.name);
						case 'fuck-ups-count':
							return compareTwoValues(nodeA.fuckUps.length, nodeB.fuckUps.length);
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
				if (
					$sortNodesBy === 'fuck-ups-count' ||
					$sortNodesBy === 'total-downtime' ||
					$sortNodesBy === 'last-downtime' ||
					$sortNodesBy === 'first-noticed'
				)
					$nodes.reverse();

				return $nodes;
			}
		);
	}

	subscribe(
		run: Subscriber<SuperhubNodes | Error>,
		invalidate?: Invalidator<SuperhubNodes | Error>
	): Unsubscriber {
		return this.#sortedNodes.subscribe(run, invalidate);
	}

	set(value: SuperhubNodes | Error): void {
		this.#nodes.set(value);
	}

	update(updater: Updater<SuperhubNodes | Error>): void {
		this.#nodes.update(updater);
	}
}

export const nodes = new NodesListClass();
