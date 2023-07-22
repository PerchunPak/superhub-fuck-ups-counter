<script lang="ts">
	import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
	import { firstCapital, formatUnixTimestamp, calculateTotalDowntime } from '$lib/utils';
	import { onMount } from 'svelte';

	let nodes: SuperhubNodes = [];
	onMount(async () => {
		const res = await fetch('/update');
		nodes = await res.json();
	});
</script>

<div class="grid place-items-center pt-20 text-center">
	<h1 class="text-5xl font-black">
		<a
			href="https://superhub.host"
			class="text-transparent bg-clip-text bg-gradient-to-r from-color-text to-accent"
		>
			Superhub</a
		>'s fuck-ups counter
	</h1>
	<p class="pt-5 text-xl max-w-xl">
		We count how many days passed after any of the nodes downtime (so you can know which is the
		stablest one).
	</p>
</div>

<div class="pt-10 max-w-5xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
	{#each nodes as node}
		<div class="bg-secondary rounded-md px-4 py-5 w-full relative">
			<h3 class="font-extrabold">{firstCapital(node.name)}</h3>
			<p>Count of fuck-ups: <span class="font-bold">{node.fuckUps.length}</span>.</p>
			<p>
				Total downtime is <span class="font-bold"
					>{formatUnixTimestamp(calculateTotalDowntime(node.fuckUps), 'amount of time')}</span
				>.
			</p>

			{#if node.isDown}
				<p class="text-red-700">Currently down.</p>
			{:else}
				<p>
					Last downtime was <span class="font-bold"
						>{formatUnixTimestamp(node.fuckUps.slice(-1)[0].start, 'from now with suffix')}</span
					>.
				</p>
			{/if}

			<p>
				Monitoring for <span class="font-bold"
					>{formatUnixTimestamp(node.monitoringSince, 'from now')}</span
				>.
			</p>
			<div
				class="absolute top-5 right-5 py-1 px-3 rounded-md font-bold border-2 text-sm"
				class:uptime-good={node.uptime >= 99.0}
				class:uptime-average={99.0 > node.uptime && node.uptime >= 90.0}
				class:uptime-bad={node.uptime < 90.0}
			>
				{node.uptime}%
			</div>
		</div>
	{/each}
</div>

<style lang="postcss">
	.uptime-good {
		@apply bg-[var(--color-bg-uptime-good)] border-[var(--color-border-uptime-good)];
	}
	.uptime-average {
		@apply bg-[var(--color-bg-uptime-average)] border-[var(--color-border-uptime-average)];
	}
	.uptime-bad {
		@apply bg-[var(--color-bg-uptime-bad)] border-[var(--color-border-uptime-bad)];
	}
</style>
