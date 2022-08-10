// import { v4 as uuidv4 } from 'uuid';
import { logger } from '@showdex/utils/debug';

interface ContentInjectable<T = unknown> {
  id: string;
  component: keyof JSX.IntrinsicElements;
  into: keyof JSX.IntrinsicElements;
  props?: Partial<T extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[T] : T>;
}

const l = logger('@showdex/content');

const injectables: ContentInjectable<HTMLElement>[] = [
  // <ContentInjectable<HTMLMetaElement & { 'http-equiv'?: string; }>> {
  //   id: 'showdex-meta-csp',
  //   component: 'meta',
  //   into: 'head',
  //   props: {
  //     'http-equiv': 'Content-Security-Policy',
  //     content: 'script-src \'self\' *.pokemonshowdown.com',
  //   },
  // },
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
      src: chrome.runtime.getURL('main.js'),
      async: true,
      'data-ext-id': chrome.runtime.id,
    },
  },

  // ...['gen12', 'gen3', 'gen4', 'gen56', 'gen78', 'util'].map((file) => <ContentInjectable<HTMLScriptElement>>({
  //   id: `showdex-honko-mechanics-${file}`,
  //   component: 'script',
  //   into: 'body',
  //   props: {
  //     src: chrome.runtime.getURL(`calc/mechanics/${file}.js`),
  //     async: true,
  //   },
  // })),

  // ...Array(8).fill(null).map((_, i) => <ContentInjectable<HTMLScriptElement>>({
  //   id: `showdex-honko-sets-gen${i + 1}`,
  //   component: 'script',
  //   into: 'body',
  //   props: {
  //     src: chrome.runtime.getURL(`calc/sets/gen${i + 1}.js`),
  //     async: true,
  //   },
  // })),

  // ...['abilities', 'index', 'items', 'moves', 'natures', 'species', 'types'].map((file) => <ContentInjectable<HTMLScriptElement>>({
  //   id: `showdex-honko-data-${file}`,
  //   component: 'script',
  //   into: 'body',
  //   props: {
  //     src: chrome.runtime.getURL(`calc/data/${file}.js`),
  //     async: true,
  //   },
  // })),

  // ...['calc', 'desc', 'field', 'items', 'pokemon', 'result', 'stats', 'util'].map((file) => <ContentInjectable<HTMLScriptElement>>({
  //   id: `showdex-honko-${file}`,
  //   component: 'script',
  //   into: 'body',
  //   props: {
  //     src: chrome.runtime.getURL(`calc/${file}.js`),
  //     async: true,
  //   },
  // })),
];

l.info('starting Showdex with Chrome extensionId', chrome.runtime.id);

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
    source.setAttribute(key, <string> value);
  });

  destination.appendChild(source);
});

// window.addEventListener('message', (e) => {
//   try {
//     chrome.runtime.sendMessage({ type: e.type });
//   } catch (error) {
//     if (__DEV__) {
//       l.error(error);
//     }
//   }
// });

// export {};
