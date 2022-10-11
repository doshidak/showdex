// import { v4 as uuidv4 } from 'uuid';
import { createShowdexEvent, getShowdexEventName, env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type { ShowdexEventDetail } from '@showdex/utils/core';

interface ContentInjectable<T = unknown> {
  id: string;
  component: keyof JSX.IntrinsicElements;
  into: keyof JSX.IntrinsicElements;
  props?: Partial<T extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[T] : T>;
}

const l = logger('@showdex/content');

const { runtime } = chrome || browser;

if (typeof document === 'undefined' || !runtime?.id) {
  l.error('Extension will not run properly since no valid runtime.id was found!');

  throw new Error('Did you forget this is a WebExtension? :o');
}

// obtain the extension runtime ID with this one simple trick
// (using runtime.id will work on Chrome, but not on Firefox since it'll return the ID defined in the manifest)
// (e.g., 'chrome-extension://dabpnahpcemkfbgfbmegmncjllieilai/main.js', 'moz-extension://81b2e17b-928f-4689-a33f-501eae139258/main.js')
const mainUrl = runtime.getURL('main.js');

const extensionId = mainUrl?.endsWith('main.js')
  ? mainUrl.split('/')[2] // e.g., ['chrome-extension:', '', 'dabpnahpcemkfbgfbmegmncjllieilai', 'main.js']
  : runtime.id;

const injectables: ContentInjectable<HTMLElement>[] = [
  <ContentInjectable<HTMLLinkElement>> {
    id: 'showdex-preconnect-googleapis',
    component: 'link',
    into: 'head',
    props: {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
  },

  <ContentInjectable<HTMLLinkElement>> {
    id: 'showdex-stylesheet-work-sans',
    component: 'link',
    into: 'head',
    props: {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    },
  },

  <ContentInjectable<HTMLLinkElement>> {
    id: 'showdex-stylesheet-fira-code',
    component: 'link',
    into: 'head',
    props: {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap',
    },
  },

  <ContentInjectable<HTMLScriptElement>> {
    id: 'showdex-script-main',
    component: 'script',
    into: 'body',
    props: {
      src: mainUrl,
      async: true,
      'data-ext-id': extensionId,
    },
  },
];

// (production only)
// include an extra script tag for the @pkmn/dex chunk
// if (!__DEV__) {
//   /**
//    * @todo See todo in webpack config about dynamically loading the chunks in as an env.
//    */
//   injectables.push(...[
//     runtime.getURL('pkmn.2c27923b.js'),
//     runtime.getURL('pkmn.356b2d28.js'),
//   ].filter(Boolean).map((src, i) => <ContentInjectable<HTMLScriptElement>> ({
//     id: `showdex-script-pkmn-${String(i).padStart(2, '0')}`,
//     component: 'script',
//     into: 'body',
//     props: {
//       src,
//       async: true,
//       // 'data-ext-id': extensionId,
//     },
//   })));
// }

l.info(
  'Starting Showdex for', env('build-target', 'probably chrome??'),
  'with extension ID', extensionId, 'and runtime.id', runtime.id,
);

l.debug('Injecting the following injectables:', injectables);

injectables.forEach(({
  id,
  component,
  into,
  props,
}) => {
  const source = document.getElementById(id) || document.createElement(component);
  const destination = into === 'head' ? document.head : document.body;

  if (source.id !== id) {
    source.id = id;
  }

  Object.entries(props).forEach(([key, value]) => {
    if (value !== undefined) {
      source.setAttribute(key, <string> value);
    }
  });

  // l.debug('Injecting', source, 'into', destination, 'with props', props);

  destination.appendChild(source);
});

// Firefox needs this for importing settings from the clipboard
// cause they don't support navigator.clipboard.getText() yet lmao
// (at the time of writing of course)

// found this at the wayyyy bottom of the MDN docs for readText(),
// specifically in the browser compatibility section after clicking on the lil asterisk:
// https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText#browser_compatibility
// "Firefox only supports reading the clipboard in browser extensions,
// "using the "clipboardRead" extension permission." ... LOL
if (env('build-target') === 'firefox') {
  l.debug('Adding onShowdexRequest event handler');

  window.addEventListener(getShowdexEventName('request'), (e: CustomEvent<ShowdexEventDetail>) => {
    l.debug(
      'Received onShowdexRequest event', e?.detail?.type || '(missing event.detail.type)',
      '\n', 'event', e,
    );

    if (e?.detail?.type !== 'clipboardReadText') {
      return;
    }

    void (async () => {
      l.debug(
        'Sending message to background script via browser.runtime.sendMessage()',
        '\n', 'event.detail.type', e.detail.type,
        '\n', 'event', e,
      );

      try {
        const response = await navigator.clipboard.readText();

        l.debug(
          'Firing onShowdexResponse for', e.detail.type,
          '\n', 'response', response,
        );

        window.dispatchEvent(createShowdexEvent('response', {
          type: 'clipboardReadText',
          payload: response,
        }));
      } catch (error) {
        if (__DEV__) {
          l.error(
            'Failed to handle message event', `${e.type || '(missing event.type)'}:`,
            '\n', error,
            '\n', 'event', e,
            '\n', '(You will only see this error on development.)',
          );
        }
      }
    })();
  });
}
