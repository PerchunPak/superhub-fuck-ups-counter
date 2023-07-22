import { formatDistance } from 'date-fns';
import type { NodeFuckUp } from '$lib/server/fetch-data/interfaces';

export function firstCapital(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatUnixTimestamp(
	time: number,
	formatting: 'amount of time' | 'from now' | 'from now with suffix'
): string {
	if (formatting === 'amount of time') {
		return formatDistance(0, time * 1000);
	} else if (formatting.startsWith('from now')) {
		return formatDistance(new Date(time * 1000), new Date(), {
			addSuffix: formatting.endsWith('with suffix')
		});
	} else {
		throw TypeError('Incorrect formatting');
	}
}

export function calculateTotalDowntime(fuckUps: NodeFuckUp[]): number {
	// total downtime in minutes
	return fuckUps.reduce(
		(partialSum, fuckUp) =>
			partialSum +
			Math.floor(
				(fuckUp.start - (fuckUp.isEnded ? fuckUp.end : Math.floor(new Date().getTime() / 1000))) /
					60
			),
		0
	);
}
