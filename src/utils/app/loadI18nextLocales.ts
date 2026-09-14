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
 * How many times to try downloading a single locale bundle before giving up on it.
 *
 * @since 1.4.2
 */
const MaxLocaleFetchAttempts = 3;

/**
 * How long to wait between locale bundle download attempts, in milliseconds.
 *
 * * Multiplied by the attempt number, e.g., 250ms, then 500ms.
 *
 * @since 1.4.2
 */
const LocaleFetchRetryDelay = 250;

/**
 * Downloads a single locale bundle, retrying a couple times before giving up.
 *
 * * On Chrome, `runtimeFetch()` has to hop through the extension's (non-persistent!) background service
 *   worker to read `i18n.<locale>.json`, since locale bundles aren't `web_accessible_resources`.
 * * That hop is exactly the kind of thing that can whiff once on a cold start -- & whiffing once used to
 *   cost the user every single translated string in the app, so it's worth asking twice.
 *
 * @since 1.4.2
 */
const fetchLocaleBundle = async (
  url: string,
): Promise<Record<string, unknown>> => {
  let lastError: Error = null;

  for (let attempt = 1; attempt <= MaxLocaleFetchAttempts; attempt++) {
    try {
      const response = await runtimeFetch<Record<string, unknown>>(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status || '???'}`);
      }

      const data = response.json();

      if (!nonEmptyObject(data)) {
        throw new Error('couldn\'t parse the downloaded bundle as JSON');
      }

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MaxLocaleFetchAttempts) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, LocaleFetchRetryDelay * attempt);
        });
      }
    }
  }

  throw lastError;
};

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
      ntt,
      ext,
      locale,
    } = bundle || {};

    if (!id || ntt !== 'locale' || !locale) {
      continue;
    }

    const url = getResourceUrl(`i18n.${locale}${ext ? `.${ext}` : ''}`);

    // note (2026/08/29): a locale bundle failing to download used to take the *entire* i18n init w/ it --
    // runtimeFetch() could reject (or hand back an unparsable body, making json() null, whose `.common`
    // access threw a TypeError), which propagated out of here & aborted BootdexAdapter's __init(), so
    // i18n never initialized & every t() w/out an English default rendered its raw key in the UI.
    // isolating each bundle means one bad download costs you that locale, not all of Showdex's strings
    let data: Record<string, unknown>;

    try {
      data = await fetchLocaleBundle(url);
    } catch (error) {
      l.warn(
        'couldn\'t download the', locale, 'locale cuz of', error,
        '\n', 'url', url,
      );

      continue;
    }

    if (!nonEmptyObject(data?.common?.['--meta'])) {
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
