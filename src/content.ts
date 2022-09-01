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
      src: chrome.runtime.getURL('main.js'),
      async: true,
      'data-ext-id': chrome.runtime.id,
    },
  },
];

l.info('Starting Showdex with Chrome extension runtime.id', chrome.runtime.id);

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
