function generateRandomUptimeAfterDot() {
	const min = Math.ceil(0);
	const max = Math.floor(99);
	return Math.floor(Math.random() * (max - min + 1) + min) / 100;
}

export const nodes = Array.from(
	{ length: 12 },
	(_, i) => i + 89 + generateRandomUptimeAfterDot()
).map((i) => ({
	name: 'rutherford',
	isDown: false,
	uptime: i,
	fuckUps: [
		{
			date: 1689839351,
			duration: 103
		},
		{
			date: 1689871751,
			duration: 124
		},
		{
			date: 1689911351,
			duration: 32
		}
	],
	monitoringSince: 1689738551
}));
