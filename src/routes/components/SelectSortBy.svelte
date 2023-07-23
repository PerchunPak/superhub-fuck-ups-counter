<script lang="ts">
	import { sortNodesBy } from '$lib/stores';
</script>

<div class="form-control w-full">
	<label class="label">
		<span class="label-text">Sort by</span>
	</label>
	<select class="select select-bordered" bind:value={$sortNodesBy}>
		<option selected>Uptime percent</option>
		<option>Name</option>
		<option>Count of fuck-ups</option>
		<option>Total downtime</option>
		<option>Last downtime</option>
		<option>First noticed</option>
	</select>
</div>
