import { formatDistance } from 'date-fns';
import type { NodeFuckUp } from '$lib/server/fetch-data/interfaces';
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

	if (currentLocale === 'ru') return ru;
	else if (currentLocale === 'uk') return uk;
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
