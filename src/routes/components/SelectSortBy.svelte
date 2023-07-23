<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { sortNodesBy } from '$lib/stores';
</script>

<div class="form-control w-full">
	<label class="label">
		<span class="label-text">{$_('sorting.Sort by')}</span>
	</label>
	<select class="select select-bordered" bind:value={$sortNodesBy}>
		<option selected value="uptime-percent">{$_('sorting.Uptime percent')}</option>
		<option value="name">{$_('sorting.Name')}</option>
		<option value="fuck-ups-count">{$_('sorting.Count of fuck-ups')}</option>
		<option value="total-downtime">{$_('sorting.Total downtime')}</option>
		<option value="last-downtime">{$_('sorting.Last downtime')}</option>
		<option value="first-noticed">{$_('sorting.First noticed')}</option>
	</select>
</div>
