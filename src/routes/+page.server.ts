import type { PageServerLoad } from './$types';
import {nodes} from "$lib/nodes";

export async function load(): Promise<PageServerLoad> {
	return {
		nodes: nodes
	};
}
