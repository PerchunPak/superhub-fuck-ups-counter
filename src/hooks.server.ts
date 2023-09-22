import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';
import { locale } from 'svelte-i18n';

Sentry.init({
	dsn: 'https://d415571e639fca1d68faca5127b20106@o4504254006689792.ingest.sentry.io/4505926330548224',
	tracesSampleRate: 1
});

export const handle: Handle = sequence(Sentry.sentryHandle(), async ({ event, resolve }) => {
	const lang = event.request.headers.get('accept-language')?.split(',')[0];
	if (lang) {
		locale.set(lang);
	}
	return resolve(event);
});
export const handleError = Sentry.handleErrorWithSentry();
