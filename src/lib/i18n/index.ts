import { browser } from '$app/environment';
import { register, init } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('./lang/en.json')),
	register('ru', () => import('./lang/ru.json')),
	register('uk', () => import('./lang/uk.json'));

init({
	fallbackLocale: defaultLocale,
	initialLocale: browser ? window.navigator.language : defaultLocale
});
