import { HttpMethod } from '@showdex/consts/core';

// note: this is only used on Chrome -- Firefox should not include this with the bundle

interface BackgroundFetchMessage extends Record<string, unknown> {
  type?: string;
  url?: string;
  options?: Partial<RequestInit>;
}

const handleFetchMessage = (
  message: BackgroundFetchMessage,
  send: (payload?: unknown) => void,
): boolean => {
  switch (message?.type) {
    case 'fetch': {
      if (!message?.url) {
        break;
      }

      void (async () => {
        try {
          const response = await fetch(message.url, {
            method: HttpMethod.GET,
            ...message?.options,
            headers: {
              Accept: 'application/json',
              ...message?.options?.headers,
            },
          });

          const value = await response.text();

          // console.log('response.json()', json);

          send({
            ok: response.ok,
            status: response.status,
            value,
          });
        } catch (error) {
          send(error);
        }
      })();

      return true; // for Chrome: use `sendResponse` asynchronously
    }

    default: break;
  }
};

if (typeof chrome !== 'undefined') {
  chrome.runtime.onMessageExternal.addListener((
    message: Record<string, unknown>,
    _sender,
    sendResponse,
  ) => handleFetchMessage(message, sendResponse));
}
