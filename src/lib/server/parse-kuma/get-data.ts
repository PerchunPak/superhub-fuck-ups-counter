import type { InternalKumaData } from '$lib/server/parse-kuma/interfaces';
import vm from 'vm';

export async function getInternalSuperhubNodesData(): Promise<InternalKumaData> {
	const html = await getHtml();
	const code = extractCodeFromHtml(html);
	const result = executeCode(code);

	return result;
}

async function getHtml(): Promise<string> {
	const response = await fetch('https://kuma.perchun.it/status/superhub');
	const result = await response.text();
	return result;
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
	const context = { window: {} };
	vm.createContext(context);
	vm.runInContext(code, context);
	// @ts-expect-error dynamic types :)
	return context.window.preloadData[0];
}
