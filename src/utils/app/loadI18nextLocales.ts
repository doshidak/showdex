import { initReactI18next } from 'react-i18next';
import i18n, { type TFunction } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import intervalPlural from 'i18next-intervalplural-postprocessor';
import { ShowdexLocaleBundles } from '@showdex/consts/app';
import {
  env,
  getResourceUrl,
  nonEmptyObject,
  runtimeFetch,
} from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';

/**
 * Shared reference to the initialized `i18n` instance, populated at runtime.
 *
 * @since 1.2.1
 */
export const i18nRef: Record<'value', typeof i18n> = {
  value: null,
};

/**
 * Shared reference to the `t` function of the initialized `i18n` instance, populated at runtime.
 *
 * @since 1.2.1
 */
export const tRef: Record<'value', TFunction> = {
  value: null,
};

const l = logger('@showdex/utils/app/loadI18nextLocales()');

/**
 * Loads each locale bundle into `i18n`.
 *
 * * App strings will be available via any `react-i18next` consumer, e.g., `useTranslation()`.
 * * Default `en` bundle will be used as a fallback if the current language doesn't define a particular key.
 * * Providing the optional `initLocale` argument will override the `LanguageDetector`, so this should only be provided
 *   from the user's settings, if applicable.
 *
 * @todo add types in `/types/i18n.d.ts` -- too lazy rn lmao
 * @since 1.2.1
 */
export const loadI18nextLocales = async (
  initLocale?: string,
): Promise<typeof i18n> => {
  if (!ShowdexLocaleBundles.length) {
    l.debug(
      'found no bundles to load! pretty sure Showdex is about to look real weird rn',
      '\n', 'ShowdexLocaleBundles', ShowdexLocaleBundles,
      '\n', 'initLocale', initLocale,
    );

    return null;
  }

  const resources: Record<string, Record<string, unknown>> = {};
  const ns: string[] = []; // e.g., ['common', 'pokedex', 'hellodex', ...]

  for (const bundle of ShowdexLocaleBundles) {
    const {
      id,
      ext,
      tag,
      locale,
    } = bundle || {};

    if (!id || tag !== 'locale' || !locale) {
      continue;
    }

    const url = getResourceUrl(`i18n.${locale}${ext ? `.${ext}` : ''}`);
    const response = await runtimeFetch<Record<string, unknown>>(url);
    const data = response.json();

    if (!nonEmptyObject(data.common?.['--meta'])) {
      l.debug(
        'downloaded absolutely nothing for the', locale, 'locale!',
        '\n', 'url', url,
        '\n', 'data', data,
      );

      continue;
    }

    resources[locale] = data;

    Object.keys(resources[locale])
      .filter((k) => !ns.includes(k))
      .forEach((key) => void ns.push(key));
  }

  if (!nonEmptyObject(resources)) {
    l.warn(
      'loaded absolutely nothing!',
      '\n', 'resources', resources,
      '\n', 'ShowdexLocaleBundles', ShowdexLocaleBundles,
      '\n', 'initLocale', initLocale,
    );

    return null;
  }

  const supportedLngs = Object.keys(resources);

  tRef.value = await i18n
    .use(intervalPlural)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,

      // debug: __DEV__, // default: false
      lng: initLocale || undefined, // falling back to `undefined` to allow the LanguageDetector to kick in
      supportedLngs,
      fallbackLng: supportedLngs[0],
      cleanCode: true, // e.g., 'EN' -> 'en', 'En-uS', -> 'en-US'

      ns,
      defaultNS: 'common',

      interpolation: {
        defaultVariables: { // basically globals you can use in translation strings
          version: env('package-version', 'icoden'), // e.g., 'v{{version}}' -> 'v1.2.1'
        },

        escapeValue: false,
        skipOnVariables: false, // default true; false will resolve t('key', { foo: '$t(some-ns:nested.key)' })
      },

      react: {
        defaultTransParent: 'span', // default: 'div'
        transEmptyNodeValue: '',
        transSupportBasicHtmlNodes: true, // allows <br />, <strong>, etc.
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'em'],
      },
    });

  if (__DEV__) {
    l.success(
      'i18n ready!',
      '\n', 'locales', '(init)', initLocale, '(all)', supportedLngs,
      '\n', 'ns', ns,
    );
  }

  i18nRef.value = i18n;

  return i18n;
};
