import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';

function generateRandomUptimeAfterDot() {
	const min = Math.ceil(0);
	const max = Math.floor(99);
	return Math.floor(Math.random() * (max - min + 1) + min) / 100;
}

export const nodes: SuperhubNodes = Array.from(
	{ length: 12 },
	(_, i) => i + 89 + generateRandomUptimeAfterDot()
).map((i) => ({
	name: 'rutherford',
	isDown: false,
	uptime: i,
	fuckUps: [
		{
			start: 1689839351,
			end: 1689839351 + 103,
			isEnded: true
		},
		{
			start: 1689871751,
			end: 1689871751 + 124,
			isEnded: true
		},
		{
			start: 1689911351,
			end: 1689911351 + 32,
			isEnded: true
		}
	],
	monitoringSince: 1689738551
}));
