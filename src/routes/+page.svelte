<script lang="ts">
	import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
	import { firstCapital, formatUnixTimestamp, calculateTotalDowntime } from '$lib/utils';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { locale } from 'svelte-i18n';
	import { writable } from 'svelte/store';

	const nodes = writable<SuperhubNodes>([]);
	onMount(() => {
		async function updateNodes() {
			const res = await fetch('/update');
			nodes.set(await res.json());
		}
		const interval = setInterval(updateNodes, 1000 * 60);
		updateNodes();

		return () => clearInterval(interval);
	});
</script>

<head>
	<title>{$_('title.prefix')}Superhub{$_('title.suffix')}</title>
</head>

<div
	class="border-4 border-secondary bg-color-background h-fit p-1 w-40 grid gap-2 grid-cols-3 absolute top-8 lg:top-12 xl:top-14 right-14 xl:right-20"
>
	{#each [['us', 'American', 'en-US'], ['uk', 'Ukrainian', 'uk'], ['ru', 'Russian', 'ru']] as [flag, alt, localeName]}
		<img
			src={`/flags/${flag}.svg`}
			alt={`${alt} flag`}
			on:click={() => ($locale = localeName)}
			class="cursor-pointer"
		/>
	{/each}
</div>

<div class="grid place-items-center pt-20 text-center">
	<h1 class="text-5xl font-black">
		{$_('title.prefix')}<a
			href="https://superhub.host"
			class="text-transparent bg-clip-text bg-gradient-to-r from-color-text to-accent"
		>
			Superhub</a
		>{$_('title.suffix')}
	</h1>
	<p class="pt-5 text-xl max-w-xl">
		{$_('description')}
	</p>
</div>

<div class="pt-10 max-w-5xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
	{#each $nodes as node}
		<div class="bg-secondary rounded-md px-4 py-5 w-full relative">
			<h3 class="font-extrabold">{firstCapital(node.name)}</h3>
			<p>{$_('nodes.Count of fuck-ups:')} <span class="font-bold">{node.fuckUps.length}</span>.</p>
			<p>
				{$_('nodes.Total downtime is')}
				<span class="font-bold"
					>{($locale,
					formatUnixTimestamp(calculateTotalDowntime(node.fuckUps), 'amount of time'))}</span
				>.
			</p>

			{#if node.isDown}
				<p class="text-red-700">{$_('nodes.Currently down.')}</p>
			{:else if node.fuckUps.length === 0}
				<p class="text-green-500">{$_('nodes.There were no fuck-ups (yet).')}</p>
			{:else}
				<p>
					{$_('nodes.Last downtime was')}
					<span class="font-bold"
						>{($locale,
						formatUnixTimestamp(node.fuckUps.slice(-1)[0].start, 'from now with suffix'))}</span
					>.
				</p>
			{/if}

			<p>
				{$_('nodes.Monitoring for')}
				<span class="font-bold"
					>{($locale, formatUnixTimestamp(node.monitoringSince, 'from now'))}</span
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
