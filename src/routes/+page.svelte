<script lang="ts">
	import { _, locale, locales } from 'svelte-i18n';
</script>

<div>
	{$_('my.translation.key')}
</div>
<div class="pt-1">
	<select bind:value={$locale}>
		{#each $locales as locale}
			<option value={locale}>{locale}</option>
		{/each}
	</select>
</div>
