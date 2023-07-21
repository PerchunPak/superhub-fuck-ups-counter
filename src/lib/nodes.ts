export const nodes =
	[1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0].map((i) => ({
		name: 'rutherford',
		isDown: false,
		uptime: 80.21 + (i + 10),
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
	}))
;
