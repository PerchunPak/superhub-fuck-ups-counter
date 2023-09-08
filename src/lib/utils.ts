import { formatDistance } from 'date-fns';
import type { NodeFuckUp, SuperhubNodes } from '$lib/server/fetch-data/interfaces';
// @ts-expect-error AFAIK date-fns doesn't mark it as public
import { enUS, ru, uk } from 'date-fns/locale/index';

export function firstCapital(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDateFnsLocale(locale: string | null | undefined) {
	if (locale === null || locale === undefined) throw new Error('Unexpected locale happened!');

	if (locale.startsWith('ru')) return ru;
	else if (locale.startsWith('uk')) return uk;
	else return enUS;
}

export function formatUnixTimestamp(
	locale: string | null | undefined,
	time: number,
	formatting: 'amount of time' | 'from now' | 'from now with suffix'
): string {
	if (formatting === 'amount of time') {
		return formatDistance(0, time * 1000, { locale: getDateFnsLocale(locale) });
	} else if (formatting.startsWith('from now')) {
		return formatDistance(new Date(time * 1000), new Date(), {
			addSuffix: formatting.endsWith('with suffix'),
			locale: getDateFnsLocale(locale)
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
