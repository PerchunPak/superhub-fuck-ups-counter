import { formatDistance } from 'date-fns';
import type { NodeFuckUp, SuperhubNodes } from '$lib/server/fetch-data/interfaces';
import { locale as localeStore } from 'svelte-i18n';
import { get } from 'svelte/store';
import { enUS, ru, uk } from 'date-fns/locale/index';

export function firstCapital(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDateFnsLocale() {
	const currentLocale = get(localeStore);
	if (currentLocale === null || currentLocale === undefined)
		throw new Error('Unexpected locale happened!');

	if (currentLocale.startsWith('ru')) return ru;
	else if (currentLocale.startsWith('uk')) return uk;
	else return enUS;
}

export function formatUnixTimestamp(
	time: number,
	formatting: 'amount of time' | 'from now' | 'from now with suffix'
): string {
	if (formatting === 'amount of time') {
		return formatDistance(0, time * 1000, { locale: getDateFnsLocale() });
	} else if (formatting.startsWith('from now')) {
		return formatDistance(new Date(time * 1000), new Date(), {
			addSuffix: formatting.endsWith('with suffix'),
			locale: getDateFnsLocale()
		});
	} else {
		throw TypeError('Incorrect formatting');
	}
}

export function calculateTotalDowntime(fuckUps: NodeFuckUp[]): number {
	if (fuckUps.length === 0) return 0;
	// total downtime in seconds
	return fuckUps.reduce(
		(partialSum, fuckUp) =>
			partialSum +
			((fuckUp.isEnded ? fuckUp.end : Math.floor(new Date().getTime() / 1000)) - fuckUp.start),
		0
	);
}

export function getDatabaseNow(): number {
	return Math.floor(new Date().getTime() / 1000);
}

export function fixDownNodesEndTime(nodes: SuperhubNodes): SuperhubNodes {
	return nodes.map((node) => {
		node.fuckUps = node.fuckUps.map((fuckUp) => {
			if (fuckUp.end === 0) {
				fuckUp.end = getDatabaseNow();
			}
			return fuckUp;
		});
		return node;
	});
}
