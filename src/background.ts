// chrome.runtime.onMessage.addListener((message: Record<string, unknown>, sender) => {
//   switch (<string> message?.type) {
//     case 'showPageAction': {
//       chrome.pageAction.show(sender.tab.id);
//
//       break;
//     }
//
//     case 'hidePageAction': {
//       chrome.pageAction.hide(sender.tab.id);
//
//       break;
//     }
//
//     default: break;
//   }
// });

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
            method: 'GET',
            ...message?.options,
            headers: {
              Accept: 'application/json',
              ...message?.options?.headers,
            },
          });

          const json = await <Promise<Record<string, unknown>>> response.json();

          // console.log('response.json()', json);

          send({
            ok: response.ok,
            status: response.status,
            jsonValue: json,
          });
        } catch (error) {
          send(error);
        }
      })();

      // fetch(<string> message?.url, {
      //   method: 'GET',
      //   ...(<Record<string, unknown>> message?.options),
      //   headers: {
      //     Accept: 'application/json',
      //     ...(<Record<string, unknown>> (<Record<string, unknown>> message?.options)?.headers),
      //   },
      // }).then((response) => sendResponse(response)).catch((error) => sendResponse(error));

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
} else {
  // note: while implemented, this would only apply for Firefox, where we can access fetch() directly,
  // so in other words, this is pretty much unused lmao
  // (for other browsers like Opera GX, `chrome.runtime` should be available)
  browser.runtime.onMessageExternal.addListener((
    message: Record<string, unknown>,
    // _sender,
  ) => new Promise((resolve, reject) => {
    handleFetchMessage(message, (payload) => {
      if (payload instanceof Error) {
        reject(payload);
      } else {
        resolve(payload);
      }
    });
  }));
}

export {};
