import { json } from '@sveltejs/kit';
import { getNodesData } from '$lib/server/fetch-data';

export async function GET(): Promise<Response> {
	return json(await getNodesData());
}
