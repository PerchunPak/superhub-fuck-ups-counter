<script lang="ts">
	import type { SuperhubNodes } from '$lib/server/fetch-data/interfaces';
	import { firstCapital, formatUnixTimestamp, calculateTotalDowntime } from '$lib/utils';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { locale } from 'svelte-i18n';
	import { writable } from 'svelte/store';

	const nodes = writable<SuperhubNodes | Error>([]);
	onMount(() => {
		async function updateNodes() {
			try {
				const res = await fetch('/update');
				nodes.set(await res.json());
			} catch (e) {
				nodes.set(e);
			}
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
		<button type="button" on:click={() => ($locale = localeName)}>
			<img src={`/flags/${flag}.svg`} alt={`${alt} flag`} />
		</button>
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

{#if $nodes.message !== undefined}
	<div class="pt-20 text-center">
		<p class="text-2xl font-bold">{$_('error.title')}</p>
		<p class="text-xl">
			{$_('error.description')}<a
				href="https://github.com/PerchunPak/superhub-fucked-up-counter"
				class="text-accent underline">GitHub</a
			>.
		</p>
		<code class="text-xl">{$nodes.message}</code>
	</div>
{:else if $nodes.length === 0}
	<div role="status" class="pt-20">
		<svg
			aria-hidden="true"
			class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
			viewBox="0 0 100 101"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
				fill="currentColor"
			/>
			<path
				d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
				fill="currentFill"
			/>
		</svg>
		<span class="sr-only">Loading...</span>
	</div>
{:else}
	<div class="pt-10 max-w-5xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each $nodes as node}
			<div class="bg-secondary rounded-md px-4 py-5 w-full relative">
				<h3 class="font-extrabold">{firstCapital(node.name)}</h3>
				<p>
					{$_('nodes.Count of fuck-ups:')} <span class="font-bold">{node.fuckUps.length}</span>.
				</p>
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
{/if}

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
