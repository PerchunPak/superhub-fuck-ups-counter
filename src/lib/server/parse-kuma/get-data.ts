import type { InternalKumaData } from '$lib/server/parse-kuma/interfaces';
// @ts-expect-error node packages work in runtime, idk what typescript wants
import vm from 'vm';

export async function getInternalSuperhubNodesData(): Promise<InternalKumaData> {
	const html = await getHtml();
	const code = extractCodeFromHtml(html);
	const result = executeCode(code);

	return result;
}

async function getHtml(): Promise<string> {
	const response = await fetch('https://status.superhub.host/status/superhub', {
		credentials: 'include',
		headers: {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
			Accept:
				'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.5',
			'Alt-Used': 'status.superhub.host',
			'Upgrade-Insecure-Requests': '1',
			'Sec-Fetch-Dest': 'document',
			'Sec-Fetch-Mode': 'navigate',
			'Sec-Fetch-Site': 'cross-site',
			Pragma: 'no-cache',
			'Cache-Control': 'no-cache'
		},
		method: 'GET',
		mode: 'cors'
	});
	return await response.text();
}

function extractCodeFromHtml(html: string): string {
	const windowDotPreloadData = html.match(/(window\.preloadData = .*;)/)?.[1];
	if (!windowDotPreloadData) throw new Error('Failed to parse HTML');
	// We also need to fix the syntax some why
	return fixSyntaxInCode(windowDotPreloadData);
}

function fixSyntaxInCode(code: string): string {
	return code.replace(/window\.preloadData = (.*);/, 'window.preloadData = [$1];');
}

function executeCode(code: string): InternalKumaData {
	// superhub please don't hack me
	const context = { window: {} };
	vm.createContext(context);
	vm.runInContext(code, context);
	// @ts-expect-error dynamic types :)
	return context.window.preloadData[0];
}
