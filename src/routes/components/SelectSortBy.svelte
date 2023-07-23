<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { sortNodesBy } from '$lib/stores';
</script>

<div class="form-control w-full">
	<label class="label">
		<span class="label-text">{$_("sorting.Sort by")}</span>
	</label>
	<select class="select select-bordered" bind:value={$sortNodesBy}>
		<option selected>{$_("sorting.Uptime percent")}</option>
		<option>{$_("sorting.Name")}</option>
		<option>{$_("sorting.Count of fuck-ups")}</option>
		<option>{$_("sorting.Total downtime")}</option>
		<option>{$_("sorting.Last downtime")}</option>
		<option>{$_("sorting.First noticed")}</option>
	</select>
</div>
