interface ContentInjectable<T = unknown> {
  id: string;
  component: keyof JSX.IntrinsicElements;
  into: keyof JSX.IntrinsicElements;
  props?: T extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[T] : T;
}

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
    },
  },
];

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

window.addEventListener('message', (e) => {
  try {
    chrome.runtime.sendMessage({ type: e.type });
  } catch (error) {
    if (__DEV__) {
      console.error(error);
    }
  }
});

export {};
